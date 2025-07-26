'use client';

import { Globe } from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// 语言配置
const LANGUAGE_MAP: Record<string, { label: string; shortLabel: string }> = {
  'zh-CN': { label: '中文(简体)', shortLabel: '中文' },
  'en-US': { label: 'English (US)', shortLabel: 'EN' },
  'ja-JP': { label: '日本語', shortLabel: '日' },
  'ko-KR': { label: '한국어', shortLabel: '한' },
  'fr-FR': { label: 'Français', shortLabel: 'FR' },
  'de-DE': { label: 'Deutsch', shortLabel: 'DE' },
  'es-ES': { label: 'Español', shortLabel: 'ES' },
  'pt-BR': { label: 'Português (Brasil)', shortLabel: 'PT' },
  'ru-RU': { label: 'Русский', shortLabel: 'RU' },
  'ar-SA': { label: 'العربية', shortLabel: 'AR' },
};

interface RepositoryLanguageSwitcherProps {
  supportedLanguages: string[];
  currentLanguage: string;
}

const RepositoryLanguageSwitcher = ({ supportedLanguages, currentLanguage }: RepositoryLanguageSwitcherProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const switchLanguage = (languageCode: string) => {
    const params = new URLSearchParams(searchParams);
    if (languageCode !== 'zh-CN') {
      params.set('lang', languageCode);
    } else {
      params.delete('lang');
    }
    
    const queryString = params.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
    router.push(newUrl);
  };

  // 如果只有一种语言或没有支持的语言，不显示切换器
  if (supportedLanguages.length <= 1) {
    return null;
  }

  const currentLanguageInfo = LANGUAGE_MAP[currentLanguage] || { label: currentLanguage, shortLabel: currentLanguage };

  return (
    <Select value={currentLanguage} onValueChange={switchLanguage}>
      <SelectTrigger 
        className="w-auto h-8 px-2 gap-2 bg-transparent border-0 
                   hover:bg-accent hover:text-accent-foreground 
                   focus:bg-accent focus:text-accent-foreground
                   transition-all duration-200 ease-in-out
                   rounded-md shadow-none text-xs"
        aria-label="选择语言"
      >
        <SelectValue 
          placeholder="语言" 
          className="text-xs font-medium"
        />
      </SelectTrigger>
      <SelectContent 
        className="min-w-[120px] animate-in fade-in-0 zoom-in-95 
                   data-[state=open]:animate-in data-[state=closed]:animate-out 
                   data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 
                   data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        align="end"
      >
        {supportedLanguages.map((languageCode) => {
          const languageInfo = LANGUAGE_MAP[languageCode] || { label: languageCode, shortLabel: languageCode };
          return (
            <SelectItem 
              key={languageCode}
              value={languageCode}
              className="text-xs cursor-pointer
                         focus:bg-accent focus:text-accent-foreground
                         hover:bg-accent/50 transition-colors duration-150"
            >
              <span className="flex items-center gap-2">
                <Globe className="h-3 w-3 text-muted-foreground" />
                {languageInfo.label}
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};

export default RepositoryLanguageSwitcher; 