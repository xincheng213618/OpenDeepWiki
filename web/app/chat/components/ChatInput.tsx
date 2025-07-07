'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ArrowUp, Eraser, ImagePlus, Trash2, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Base64Content } from '../../types/chat';

interface ChatInputProps {
  value?: string;
  placeholder?: string;
  loading?: boolean;
  disabled?: boolean;
  onSend?: (message: string, imageContents?: Base64Content[]) => void;
  onStop?: () => void;
  onChange?: (value: string) => void;
  onClear?: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  value,
  placeholder = '输入消息...',
  loading = false,
  disabled = false,
  onSend,
  onStop,
  onChange,
  onClear,
}) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [imageUploading, setImageUploading] = useState(false);
  const [imageList, setImageList] = useState<Base64Content[]>([]);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputValue(value);
    onChange?.(value);
  };

  const handleSend = () => {
    if ((inputValue.trim() || imageList.length > 0) && !loading && !disabled) {
      onSend?.(inputValue.trim(), imageList.length > 0 ? imageList : undefined);
      setInputValue('');
      setImageList([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStop = () => {
    onStop?.();
  };

  const handleClear = () => {
    setInputValue('');
    setImageList([]);
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      alert('只能上传图片文件!');
      return;
    }

    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      alert('图片大小不能超过5MB!');
      return;
    }

    try {
      setImageUploading(true);
      const base64Content = await convertFileToBase64(file);
      setImageList([...imageList, {
        data: base64Content,
        mimeType: file.type
      }]);
      setImageUploading(false);
      
      // 重置input以便可以再次选择同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('图片转换失败:', error);
      alert('图片处理失败，请重试');
      setImageUploading(false);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // 移除 data:image/jpeg;base64, 前缀
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const removeImage = (index: number) => {
    const newImageList = [...imageList];
    newImageList.splice(index, 1);
    setImageList(newImageList);
  };

  return (
    <div className="w-full space-y-2">
      {/* 图片预览区域 */}
      {imageList.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 bg-muted/30 rounded-md border border-dashed">
          {imageList.map((image, index) => (
            <div key={index} className="relative w-20 h-20 rounded-md overflow-hidden border border-border group">
              <img 
                src={`data:${image.mimeType};base64,${image.data}`} 
                alt="上传图片" 
                className="w-full h-full object-cover"
              />
              <button 
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 bg-background/80 text-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 输入区域 */}
      <div className="flex flex-col space-y-2">
        <div className="relative">
          <Textarea
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || loading}
            className="pr-10 min-h-[80px] resize-none"
          />
          
          <div className="absolute bottom-2 right-2">
            {loading ? (
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={handleStop}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            ) : (
              <Button 
                size="icon" 
                onClick={handleSend}
                disabled={(!inputValue.trim() && imageList.length === 0) || disabled || imageUploading}
                className="h-8 w-8"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* 工具栏 */}
        <div className="flex items-center">
          <div className="flex-1 flex gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8" 
                    disabled={disabled || loading}
                    onClick={handleUploadClick}
                  >
                    {imageUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>上传图片</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8" 
                    disabled={!inputValue && imageList.length === 0}
                    onClick={handleClear}
                  >
                    <Eraser className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>清空输入</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" 
                  onClick={() => setShowClearDialog(true)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>清空消息</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* 文件上传输入 */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleImageUpload}
      />

      {/* 清空消息确认对话框 */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认清空</AlertDialogTitle>
            <AlertDialogDescription>
              确定要清空所有聊天消息吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              onClear?.();
              setShowClearDialog(false);
            }}>
              确认清空
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ChatInput;