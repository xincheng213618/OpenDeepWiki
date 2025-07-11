import { getWarehouseOverview } from '../../services';
import RepositoryInfo from './RepositoryInfo';
import { checkGitHubRepoExists } from '../../services/githubService';
import { DocsBody,  DocsPage, DocsTitle } from 'fumadocs-ui/page';
import RenderMarkdown from '@/app/components/renderMarkdown';
import { getMDXComponents } from '@/components/mdx-components';
import FloatingChatClient from './FloatingChatClient';
import ReloadButtonClient from './ReloadButtonClient';

// 服务器组件，处理数据获取
export default async function RepositoryPage({ params, searchParams }: any) {
  try {
    const { owner, name } = await params;

    const { branch } = await searchParams;

    if (!owner || !name) {
      throw new Error('Missing owner or repository name');
    }

    // 在服务器端获取数据
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
            title={`${name} AI 助手`}
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
        <DocsTitle>页面加载失败</DocsTitle>
        <DocsBody>
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-destructive mb-2">
                无法加载仓库页面
              </h2>
              <p className="text-muted-foreground mb-4">
                仓库 <code className="bg-muted px-2 py-1 rounded">{params.owner}/{params.name}</code> 可能不存在或暂时无法访问
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                错误详情: {error instanceof Error ? error.message : '未知错误'}
              </p>
            </div>

            <div className="flex gap-4">
              <ReloadButtonClient />
              <a
                href={`/${params.owner}`}
                className="px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
              >
                返回 {params.owner}
              </a>
              <a
                href="/"
                className="px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
              >
                返回首页
              </a>
            </div>
          </div>
        </DocsBody>
      </DocsPage>
    );
  }
}
