import { getWarehouseOverview } from '../../services';
import RepositoryInfo from './RepositoryInfo';
import { checkGitHubRepoExists } from '../../services/githubService';
import { DocsBody, DocsPage, DocsTitle } from 'fumadocs-ui/page';
import RenderMarkdown from '@/app/components/renderMarkdown';
import FloatingChatClient from './FloatingChatClient';
import ReloadButtonClient from './ReloadButtonClient';
import { getTranslation } from '@/app/i18n/server';
import { fallbackLng } from '@/app/i18n/settings';
import { headers } from 'next/headers';
import { documentCatalog } from '../../services/warehouseService';
import { redirect } from 'next/navigation';

// 服务器组件，处理数据获取
export default async function RepositoryPage({ params, searchParams }: any) {
  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language');
  const lng = acceptLanguage?.includes('en') ? 'en-US' : fallbackLng;

  const { t } = await getTranslation(lng, 'common');

    const { owner, name } = await params;
  const { branch, lang } = await searchParams;

  if (!owner || !name) {
    throw new Error('Missing owner or repository name');
  }

  // 获取文档目录数据，检查是否有菜单项
  const languageCode = lang || 'zh-CN';
  
  try {
    const catalogResponse = await documentCatalog(owner, name, branch, languageCode);
    
    // 如果有目录数据且存在菜单项，重定向到第一个菜单项
    if (catalogResponse.success && catalogResponse.data?.items && catalogResponse.data.items.length > 0) {
      const firstMenuItem = catalogResponse.data.items[0]
      console.log('firstMenuItem', firstMenuItem);
      if (firstMenuItem?.url) {
        // 重定向到第一个菜单项
        redirect(`/${owner}/${name}/${firstMenuItem.url}`);
      }
    }
  } catch (error) {
    // 如果是重定向错误，直接重新抛出
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error;
    }
    // 其他错误继续处理，但不影响后续逻辑
    console.warn('Failed to get document catalog:', error);
  }

  try {

    // 如果没有菜单项，继续原有逻辑：获取概述数据
    const response = await getWarehouseOverview(owner, name, branch);

    // 如果获取数据失败，尝试从GitHub获取仓库信息
    if (!response.success || !response.data) {
      // 检查GitHub仓库是否存在
      const githubRepoExists = await checkGitHubRepoExists(owner, name, branch);

      // 如果GitHub仓库存在，则显示GitHub仓库信息
      if (githubRepoExists) {
        return (
          <RepositoryInfo
            owner={owner}
            branch={branch}
            name={name}
          />
        );
      } else {
        return (
          <RepositoryInfo
            owner={owner}
            branch={branch}
            name={name}
          />
        );
      }
    }

    const compiled = await RenderMarkdown({
      markdown: response.data.content,
    }) as any;

    return (
      <DocsPage
        toc={compiled!.toc}>
        <>
          <DocsBody>
            {compiled.body}
          </DocsBody>
          <FloatingChatClient
            organizationName={owner}
            repositoryName={name}
            title={t('page.ai_assistant', { name })}
            theme="light"
            enableDomainValidation={false}
            embedded={false}
          />
        </>
      </DocsPage>
    );
  } catch (error) {
    console.error('Repository page error:', error);

    return (
      <DocsPage>
        <DocsTitle>{t('page.error.title')}</DocsTitle>
        <DocsBody>
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-destructive mb-2">
                {t('page.error.unable_to_load')}
              </h2>
              <p className="text-muted-foreground mb-4">
                <code className="bg-muted px-2 py-1 rounded">{owner}/{name}</code> {t('page.error.repo_not_exist')}
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                {t('page.error.error_detail', { error: error instanceof Error ? error.message : t('page.error.unknown_error') })}
              </p>
            </div>

            <div className="flex gap-4">
              <ReloadButtonClient />
              <a
                href={`/${owner}`}
                className="px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
              >
                {t('page.error.back_to_owner', { owner: owner })}
              </a>
              <a
                href="/"
                className="px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
              >
                {t('page.error.back_to_home')}
              </a>
            </div>
          </div>
        </DocsBody>
      </DocsPage>
    );
  }
}
