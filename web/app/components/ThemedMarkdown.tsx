'use client'

import { Markdown, ThemeProvider } from "@lobehub/ui";
import { useTheme } from 'next-themes';

interface ThemedMarkdownProps {
    children: string;
}

export default function ThemedMarkdown({ children }: ThemedMarkdownProps) {
    const { resolvedTheme } = useTheme();
    
    return (
        <ThemeProvider themeMode={resolvedTheme as any}>
            <Markdown>
                {children}
            </Markdown>
        </ThemeProvider>
    );
} 