import { useState } from 'react';
import { Copy, Check, Download, Zap } from 'lucide-react';
import { RepositoryFile } from '../lib/supabase';

const LANG_MAP: Record<string, string> = {
  js: 'JavaScript', ts: 'TypeScript', jsx: 'JavaScript', tsx: 'TypeScript',
  py: 'Python', rs: 'Rust', go: 'Go', java: 'Java', cpp: 'C++', c: 'C',
  rb: 'Ruby', php: 'PHP', swift: 'Swift', kt: 'Kotlin', sh: 'Shell',
  html: 'HTML', css: 'CSS', json: 'JSON', yaml: 'YAML', yml: 'YAML',
  md: 'Markdown', toml: 'TOML', xml: 'XML', sql: 'SQL',
};

function highlight(code: string, ext: string): string {
  if (['json'].includes(ext)) {
    return code
      .replace(/("(?:[^"\\]|\\.)*")\s*:/g, '<span class="text-blue-400">$1</span>:')
      .replace(/:\s*("(?:[^"\\]|\\.)*")/g, ': <span class="text-emerald-400">$1</span>')
      .replace(/:\s*(\d+\.?\d*)/g, ': <span class="text-orange-400">$1</span>')
      .replace(/:\s*(true|false|null)/g, ': <span class="text-pink-400">$1</span>');
  }
  return code
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

type Props = {
  file: RepositoryFile;
  onRun?: (file: RepositoryFile) => void;
};

const RUNNABLE = ['js', 'ts', 'py', 'rs', 'go', 'java', 'rb', 'php', 'cpp', 'c'];

export default function CodeViewer({ file, onRun }: Props) {
  const [copied, setCopied] = useState(false);
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const lang = LANG_MAP[ext] ?? 'Plain Text';
  const isRunnable = RUNNABLE.includes(ext);
  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext);
  const isMarkdown = ext === 'md';

  function handleCopy() {
    navigator.clipboard.writeText(file.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  }

  const lines = file.content.split('\n');

  return (
    <div className="flex flex-col h-full bg-gray-950 rounded-xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-200">{file.name}</span>
          <span className="text-xs px-2 py-0.5 bg-gray-800 text-gray-400 rounded">{lang}</span>
          <span className="text-xs text-gray-600">{lines.length} lines</span>
          <span className="text-xs text-gray-600">{(file.size_bytes / 1024).toFixed(1)} KB</span>
        </div>
        <div className="flex items-center gap-1.5">
          {isRunnable && onRun && (
            <button
              onClick={() => onRun(file)}
              className="flex items-center gap-1 text-xs bg-emerald-700 hover:bg-emerald-600 text-white px-2.5 py-1 rounded transition font-medium"
            >
              <Zap size={12} /> Run
            </button>
          )}
          <button onClick={handleDownload} className="text-gray-400 hover:text-white p-1.5 rounded hover:bg-gray-800 transition" title="Download">
            <Download size={14} />
          </button>
          <button onClick={handleCopy} className="text-gray-400 hover:text-white p-1.5 rounded hover:bg-gray-800 transition" title="Copy">
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {isImage ? (
          <div className="flex items-center justify-center p-8">
            <img src={file.content} alt={file.name} className="max-w-full max-h-96 rounded-lg border border-gray-700" />
          </div>
        ) : isMarkdown ? (
          <div className="p-6 prose prose-invert prose-emerald max-w-none text-sm leading-relaxed">
            <pre className="whitespace-pre-wrap font-mono text-gray-300 text-xs">{file.content}</pre>
          </div>
        ) : (
          <div className="flex text-xs font-mono">
            <div className="select-none border-r border-gray-800 bg-gray-950 px-3 py-4 text-gray-700 text-right shrink-0 min-w-[3rem]">
              {lines.map((_, i) => (
                <div key={i} className="leading-6">{i + 1}</div>
              ))}
            </div>
            <pre className="flex-1 p-4 overflow-x-auto text-gray-300 leading-6">
              <code
                dangerouslySetInnerHTML={{ __html: highlight(file.content, ext) }}
              />
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
