import { useState } from 'react';
import { X, FilePlus, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, Repository, RepositoryFile } from '../lib/supabase';

type Props = {
  repo: Repository;
  branch: string;
  onClose: () => void;
  onAdded: (file: RepositoryFile) => void;
};

export default function AddFileModal({ repo, branch, onClose, onAdded }: Props) {
  const { profile } = useAuth();
  const [path, setPath] = useState('');
  const [content, setContent] = useState('');
  const [commitMsg, setCommitMsg] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const fileName = path.split('/').pop() ?? path;

  async function handleSave() {
    if (!profile || !path.trim()) return;
    setError('');
    setSaving(true);

    const { data: existing } = await supabase
      .from('repository_files')
      .select('id')
      .eq('repo_id', repo.id)
      .eq('branch', branch)
      .eq('path', path.trim())
      .maybeSingle();

    if (existing) { setError('A file at this path already exists'); setSaving(false); return; }

    const parts = path.trim().split('/');
    if (parts.length > 1) {
      const dirRows = parts.slice(0, -1).map((_, idx) => ({
        repo_id: repo.id,
        branch,
        path: parts.slice(0, idx + 1).join('/'),
        name: parts[idx],
        type: 'directory' as const,
        content: '',
        size_bytes: 0,
        commit_message: commitMsg || `Add ${fileName}`,
        committed_by: profile.id,
      }));
      await supabase.from('repository_files').upsert(dirRows, { onConflict: 'repo_id,branch,path' });
    }

    const { data, error: err } = await supabase.from('repository_files').insert({
      repo_id: repo.id,
      branch,
      path: path.trim(),
      name: fileName,
      type: 'file',
      content,
      size_bytes: content.length,
      commit_message: commitMsg || `Add ${fileName}`,
      committed_by: profile.id,
    }).select().single();

    if (err) { setError(err.message); setSaving(false); return; }
    onAdded(data);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <FilePlus size={18} className="text-emerald-400" />
            <h2 className="font-semibold text-white">Create new file</h2>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-400 transition"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950/40 border border-red-900/50 px-3 py-2 rounded-lg">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">File path</label>
            <input
              type="text"
              value={path}
              onChange={e => setPath(e.target.value)}
              placeholder="src/components/MyComponent.tsx"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 font-mono"
            />
            <p className="text-xs text-gray-600 mt-1">Use forward slashes to create nested files. Directories are created automatically.</p>
          </div>

          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-400 mb-1.5">File content</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Enter file content..."
              rows={14}
              spellCheck={false}
              className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2.5 text-xs text-gray-300 font-mono placeholder-gray-700 focus:outline-none focus:border-emerald-500 resize-none leading-5"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Commit message</label>
            <input
              type="text"
              value={commitMsg}
              onChange={e => setCommitMsg(e.target.value)}
              placeholder={`Add ${fileName || 'new file'}`}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 px-5 py-4 border-t border-gray-800 shrink-0">
          <button
            onClick={handleSave}
            disabled={saving || !path.trim()}
            className="bg-emerald-700 hover:bg-emerald-600 disabled:bg-gray-800 disabled:text-gray-600 text-white text-sm font-medium px-5 py-2 rounded-lg transition"
          >
            {saving ? 'Committing...' : 'Commit new file'}
          </button>
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-300 px-4 py-2 transition">Cancel</button>
        </div>
      </div>
    </div>
  );
}
