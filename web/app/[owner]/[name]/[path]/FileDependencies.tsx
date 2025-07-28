'use client';

import { useState } from 'react';

interface FileSource {
  id: string;
  name: string;
}

interface FileDependenciesProps {
  files: FileSource[];
}

export default function FileDependencies({ files }: FileDependenciesProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mb-6 border border-gray-200 rounded-lg bg-gray-50">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">
            文档依赖文件
          </span>
          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
            {files.length}
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      
      {isExpanded && (
        <div className="border-t border-gray-200">
          <div className="max-h-48 overflow-y-auto p-4">
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="text-sm text-gray-600 py-1 px-2 bg-white rounded border border-gray-100 hover:border-gray-200 transition-colors"
                >
                  {file.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 