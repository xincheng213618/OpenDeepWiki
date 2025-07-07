import { ChatItem } from "@/components/ui/chat-item";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Markdown } from "@lobehub/ui";
import { useState } from "react";
import { Base64Content, MessageContentAudioItem, MessageContentCodeItem, MessageContentFileItem, MessageContentImageItem, MessageContentItem, MessageContentLinkItem, MessageContentReasoningItem, MessageContentTableItem, MessageContentTextItem, MessageContentToolItem, MessageContentType, MessageItem } from "../../../../types/chat";

interface UserMessageProps {
    messageItem: MessageItem;
    handleDelete: (messageId: string) => void;
}

export default function UserMessage({ messageItem, handleDelete }: UserMessageProps) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const handleDeleteClick = () => {
        setShowDeleteDialog(true);
    }

    const handleConfirmDelete = () => {
        handleDelete(messageItem.id);
        setShowDeleteDialog(false);
    }

    const handleCopyClick = () => {
        // 提取所有文本和推理内容
        const textContent = (messageItem.content as any[])
            .filter(item => item.type === 'text' || item.type === 'reasoning')
            .map(item => item.content || '')
            .join('\n\n');
        navigator.clipboard.writeText(textContent);
        toast.success('已复制到剪贴板');
    }

    const renderActions = () => {
        return (
            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyClick}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                >
                    <Copy size={14} />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDeleteClick}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                >
                    <Trash2 size={14} />
                </Button>
            </div>
        )
    }

    const renderMessage = () => {
        return (
            <div className="chat-message-content max-h-60 overflow-y-auto overflow-x-hidden text-sm">
                {(messageItem.content as any[]).map((contentItem: MessageContentToolItem | MessageContentImageItem | MessageContentCodeItem | MessageContentTableItem | MessageContentLinkItem | MessageContentFileItem | MessageContentAudioItem | MessageContentReasoningItem | MessageContentTextItem, index: number) => {
                    switch (contentItem.type) {
                        case MessageContentType.Text:
                            return (
                                <div key={`text-${index}`} className="whitespace-pre-wrap break-words text-sm">
                                    {contentItem.content || ''}
                                </div>
                            );
                        case MessageContentType.Image:
                            return contentItem.imageContents && contentItem.imageContents.length > 0 ? (
                                <div key={`image-${index}`} className="mb-2 flex flex-wrap gap-2">
                                    {contentItem.imageContents.map((image: Base64Content, imgIndex: number) => (
                                        <img
                                            key={imgIndex}
                                            src={`data:${image.mimeType};base64,${image.data}`}
                                            alt="用户上传的图片"
                                            className="max-w-full max-h-36 rounded border border-border object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                            onClick={() => window.open(`data:${image.mimeType};base64,${image.data}`, '_blank')}
                                        />
                                    ))}
                                </div>
                            ) : null;
                        default:
                            return (
                                <div key={`other-${index}`}>
                                    暂时不支持该类型
                                </div>
                            );
                    }
                })}
            </div>
        )
    }

    return (
        <>
            <ChatItem
                className="user-message"
                actions={renderActions}
                key={messageItem.id}
                renderMessage={renderMessage}
                role="user"
            />

            {/* 删除确认对话框 */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>确定删除该消息吗？</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-sm text-muted-foreground">删除后将无法恢复</p>
                    </div>
                    <DialogFooter className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            取消
                        </Button>
                        <Button variant="destructive" onClick={handleConfirmDelete}>
                            确定删除
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}