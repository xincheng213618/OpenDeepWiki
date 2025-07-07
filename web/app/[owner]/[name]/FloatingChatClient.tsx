'use client';

import FloatingChat from '@/app/chat';

interface FloatingChatClientProps {
  appId: string;
  organizationName: string;
  repositoryName: string;
  title: string;
  theme: "light" | "dark";
  enableDomainValidation: boolean;
  embedded: boolean;
}

export default function FloatingChatClient({
  appId,
  organizationName,
  repositoryName,
  title,
  theme,
  enableDomainValidation,
  embedded
}: FloatingChatClientProps) {
  return (
    <FloatingChat
      appId={appId}
      organizationName={organizationName}
      repositoryName={repositoryName}
      title={title}
      theme={theme}
      enableDomainValidation={enableDomainValidation}
      embedded={embedded}
      onError={(error) => {
        console.error('Built-in chat error:', error);
      }}
    />
  );
} 