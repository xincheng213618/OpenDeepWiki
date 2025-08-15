// 文档数据类型
export interface DocumentData {
  id: string;
  title: string;
  content: string;
  description?: string;
  fileSource?: any[];
  branch: string;
  address: string;
  createdAt?: string;
  updatedAt?: string;
  lastUpdate?: any;
}

// 标题类型
export interface Heading {
  key: string;
  title: string;
  level: number;
  id: string;
}

// 锚点项类型
export interface AnchorItem {
  key: string;
  href: string;
  title: string;
  children: AnchorItem[];
}

// API响应类型
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
  isSuccess?: boolean;
  message?: string;
}

// 文档页面属性类型
export interface DocumentPageProps {
  params: {
    owner: string;
    name: string;
    path: string;
  };
  searchParams: {
    branch?: string;
  };
}

// 客户端组件属性类型
export interface DocumentPageClientProps {
  document: DocumentData | null;
  error: string | null;
  headings: Heading[];
  anchorItems: AnchorItem[];
  owner: string;
  name: string;
  path: string;
  branch?: string;
} 