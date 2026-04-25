import { useState } from 'react';
import { Folder, FolderOpen, FileText, ChevronRight, ChevronDown, FileCode, FileJson, Image } from 'lucide-react';
import { RepositoryFile } from '../lib/supabase';

type TreeNode = {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: TreeNode[];
  file?: RepositoryFile;
};

function buildTree(files: RepositoryFile[]): TreeNode[] {
  const root: TreeNode[] = [];
  const map: Record<string, TreeNode> = {};

  const sorted = [...files].sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
    return a.path.localeCompare(b.path);
  });

  for (const f of sorted) {
    const node: TreeNode = { name: f.name, path: f.path, type: f.type, file: f };
    if (f.type === 'directory') node.children = [];
    map[f.path] = node;

    const parentPath = f.path.includes('/') ? f.path.substring(0, f.path.lastIndexOf('/')) : '';
    if (parentPath && map[parentPath]) {
      map[parentPath].children!.push(node);
    } else {
      root.push(node);
    }
  }

  return root;
}

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase();
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'rs', 'go', 'java', 'cpp', 'c', 'rb', 'php'].includes(ext ?? '')) return <FileCode size={14} className="text-emerald-400" />;
  if (['json', 'yaml', 'yml', 'toml', 'xml'].includes(ext ?? '')) return <FileJson size={14} className="text-yellow-400" />;
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext ?? '')) return <Image size={14} className="text-blue-400" />;
  return <FileText size={14} className="text-gray-400" />;
}

type NodeProps = {
  node: TreeNode;
  onSelect: (file: RepositoryFile) => void;
  selectedPath: string;
  depth: number;
};

function TreeNodeComp({ node, onSelect, selectedPath, depth }: NodeProps) {
  const [open, setOpen] = useState(depth === 0);

  if (node.type === 'directory') {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          className="flex items-center gap-1.5 w-full text-left py-1 pr-3 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded transition"
        >
          {open ? <ChevronDown size={12} className="shrink-0 text-gray-500" /> : <ChevronRight size={12} className="shrink-0 text-gray-500" />}
          {open ? <FolderOpen size={14} className="shrink-0 text-yellow-400" /> : <Folder size={14} className="shrink-0 text-yellow-400" />}
          <span className="truncate">{node.name}</span>
        </button>
        {open && node.children?.map(child => (
          <TreeNodeComp key={child.path} node={child} onSelect={onSelect} selectedPath={selectedPath} depth={depth + 1} />
        ))}
      </div>
    );
  }

  return (
    <button
      onClick={() => node.file && onSelect(node.file)}
      style={{ paddingLeft: `${depth * 16 + 20}px` }}
      className={`flex items-center gap-1.5 w-full text-left py-1 pr-3 text-sm rounded transition ${
        selectedPath === node.path
          ? 'bg-emerald-950 text-emerald-300 border-l-2 border-emerald-500'
          : 'text-gray-400 hover:text-white hover:bg-gray-800'
      }`}
    >
      {getFileIcon(node.name)}
      <span className="truncate">{node.name}</span>
    </button>
  );
}

type Props = {
  files: RepositoryFile[];
  onSelect: (file: RepositoryFile) => void;
  selectedPath: string;
};

export default function FileTree({ files, onSelect, selectedPath }: Props) {
  const tree = buildTree(files);

  if (files.length === 0) {
    return (
      <div className="p-4 text-center text-gray-600 text-sm">
        <FileText size={24} className="mx-auto mb-2 opacity-40" />
        No files yet
      </div>
    );
  }

  return (
    <div className="py-2">
      {tree.map(node => (
        <TreeNodeComp key={node.path} node={node} onSelect={onSelect} selectedPath={selectedPath} depth={0} />
      ))}
    </div>
  );
}
