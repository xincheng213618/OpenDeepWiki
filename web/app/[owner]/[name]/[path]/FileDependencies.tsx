'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Github, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { useTheme } from 'next-themes';
import { ThemeProvider } from '@lobehub/ui';

interface FileSource {
  id: string;
  name: string;
  url: string;
  address: string;
}

interface FileDependenciesProps {
  files: FileSource[];
}

export default function FileDependencies({ files }: FileDependenciesProps) {
  const [isOpen, setIsOpen] = useState(true);
  const { resolvedTheme } = useTheme();

  return (
    <ThemeProvider themeMode={resolvedTheme as any}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
          <CollapsibleTrigger asChild>
            <div className="flex items-center gap-2 cursor-pointer">
              <CardTitle className="text-base font-medium">
                文档依赖文件
              </CardTitle>
              <Badge variant="secondary">{files.length}</Badge>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''
                  }`}
              />
            </div>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="px-4 pb-4">
            <div className="max-h-48 overflow-y-auto space-y-2">
              {files.map((file) => (
                <Link
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                  }}
                  rel="noopener noreferrer" target="_blank" href={file.url} key={file.id} passHref>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-1.5 px-2 rounded-md border hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer">
                    <Github className="h-3.5 w-3.5" />
                    <span className="flex-1 truncate">{file.address}</span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </ThemeProvider>
  );
}