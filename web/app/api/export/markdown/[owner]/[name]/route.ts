import { NextRequest, NextResponse } from 'next/server';
import { documentCatalog } from '@/app/services/warehouseService';

export async function GET(
  request: NextRequest,
  { params }: { params: { owner: string; name: string } }
) {
  try {
    const { owner, name } = params;
    const { searchParams } = new URL(request.url);
    const branch = searchParams.get('branch') || 'main';

    // 获取文档目录数据
    const { data } = await documentCatalog(owner, name, branch);
    
    if (!data) {
      return NextResponse.json(
        { error: 'Repository not found' },
        { status: 404 }
      );
    }

    // 生成Markdown内容
    const markdownContent = generateMarkdown(data, owner, name, branch);

    // 返回文件下载响应
    return new NextResponse(markdownContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${owner}-${name}-${branch}.md"`,
      },
    });

  } catch (error) {
    console.error('Export markdown error:', error);
    return NextResponse.json(
      { error: 'Failed to export markdown' },
      { status: 500 }
    );
  }
}

function generateMarkdown(data: any, owner: string, name: string, branch: string): string {
  const { items, lastUpdate, git } = data;
  
  let markdown = `# ${owner}/${name}\n\n`;
  
  // 添加基本信息
  markdown += `**分支**: ${branch}\n\n`;
  if (lastUpdate) {
    markdown += `**最后更新**: ${new Date(lastUpdate).toLocaleString()}\n\n`;
  }
  if (git) {
    markdown += `**仓库地址**: ${git}\n\n`;
  }
  
  markdown += `---\n\n`;
  
  // 生成目录
  markdown += `## 目录\n\n`;
  markdown += generateTableOfContents(items);
  markdown += `\n---\n\n`;
  
  // 生成内容
  markdown += generateContent(items);
  
  return markdown;
}

function generateTableOfContents(items: any[], level: number = 0): string {
  let toc = '';
  const indent = '  '.repeat(level);
  
  for (const item of items) {
    toc += `${indent}- [${item.label}](#${slugify(item.label)})\n`;
    
    if (item.children && item.children.length > 0) {
      toc += generateTableOfContents(item.children, level + 1);
    }
  }
  
  return toc;
}

function generateContent(items: any[], level: number = 2): string {
  let content = '';
  
  for (const item of items) {
    const headingLevel = '#'.repeat(level);
    content += `${headingLevel} ${item.label}\n\n`;
    
    if (item.description) {
      content += `${item.description}\n\n`;
    }
    
    if (item.url) {
      content += `**路径**: ${item.url}\n\n`;
    }
    
    if (item.children && item.children.length > 0) {
      content += generateContent(item.children, level + 1);
    }
    
    content += `---\n\n`;
  }
  
  return content;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
