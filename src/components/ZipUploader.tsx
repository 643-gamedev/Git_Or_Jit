import { useState, useRef } from 'react';
import { Archive, Upload, X, Check, AlertCircle, FolderOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, Repository, RepositoryFile } from '../lib/supabase';

type Props = {
  repo: Repository;
  branch: string;
  onClose: () => void;
  onExtracted: (files: RepositoryFile[]) => void;
};

type FileEntry = { path: string; content: string; size: number };

async function readZipFile(file: File): Promise<FileEntry[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async e => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      try {
        const { default: JSZip } = await import('jszip');
        const zip = await JSZip.loadAsync(arrayBuffer);
        const entries: FileEntry[] = [];

        const filePromises: Promise<void>[] = [];
        zip.forEach((relativePath, zipEntry) => {
          if (!zipEntry.dir) {
            const p = zipEntry.async('string').then(content => {
              entries.push({ path: relativePath, content, size: content.length });
            }).catch(() => {
              entries.push({ path: relativePath, content: '[Binary file - cannot display]', size: 0 });
            });
            filePromises.push(p);
          }
        });

        await Promise.all(filePromises);
        resolve(entries);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

export default function ZipUploader({ repo, branch, onClose, onExtracted }: Props) {
  const { profile } = useAuth();
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetPath, setTargetPath] = useState('/');
  const [extracting, setExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [extractedCount, setExtractedCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith('.zip')) setSelectedFile(f);
    else setError('Please drop a .zip file');
  }

  async function handleExtract() {
    if (!selectedFile || !profile) return;
    setError('');
    setExtracting(true);
    setProgress(10);

    try {
      const entries = await readZipFile(selectedFile);
      setProgress(40);

      const prefix = targetPath === '/' ? '' : targetPath.replace(/^\/|\/$/g, '') + '/';
      const insertedFiles: RepositoryFile[] = [];

      const batchSize = 10;
      for (let i = 0; i < entries.length; i += batchSize) {
        const batch = entries.slice(i, i + batchSize);
        const rows = batch.map(entry => {
          const fullPath = prefix + entry.path;
          const parts = fullPath.split('/');
          const fileName = parts[parts.length - 1];

          const dirParts = parts.slice(0, -1);
          const dirInserts = dirParts.map((_, idx) => ({
            repo_id: repo.id,
            branch,
            path: dirParts.slice(0, idx + 1).join('/'),
            name: dirParts[idx],
            type: 'directory' as const,
            content: '',
            size_bytes: 0,
            commit_message: `Extract ${selectedFile.name}`,
            committed_by: profile.id,
          }));

          return {
            fileRow: {
              repo_id: repo.id,
              branch,
              path: fullPath,
              name: fileName,
              type: 'file' as const,
              content: entry.content,
              size_bytes: entry.size,
              commit_message: `Extract ${selectedFile.name}`,
              committed_by: profile.id,
            },
            dirRows: dirInserts,
          };
        });

        const allDirRows = batch.flatMap((_, idx) => rows[idx].dirRows);
        const uniqueDirs = allDirRows.filter((d, i, arr) => arr.findIndex(x => x.path === d.path) === i);

        if (uniqueDirs.length > 0) {
          await supabase.from('repository_files').upsert(uniqueDirs, { onConflict: 'repo_id,branch,path' });
        }

        const fileRows = rows.map(r => r.fileRow);
        const { data } = await supabase.from('repository_files').upsert(fileRows, { onConflict: 'repo_id,branch,path' }).select();
        if (data) insertedFiles.push(...data);

        setProgress(40 + Math.round(((i + batchSize) / entries.length) * 55));
      }

      setProgress(100);
      setExtractedCount(entries.length);
      setDone(true);
      setTimeout(() => onExtracted(insertedFiles), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extraction failed');
      setExtracting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <Archive size={20} className="text-orange-400" />
            <h2 className="font-semibold text-white">Upload & Extract Zip</h2>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-400 transition"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950/40 border border-red-900/50 px-3 py-2 rounded-lg">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {done ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-emerald-950 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check size={22} className="text-emerald-400" />
              </div>
              <p className="font-medium text-white">Extraction complete!</p>
              <p className="text-sm text-gray-500 mt-1">{extractedCount} files added to repository</p>
            </div>
          ) : (
            <>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
                  dragOver ? 'border-emerald-500 bg-emerald-950/20' : selectedFile ? 'border-emerald-800 bg-emerald-950/10' : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".zip"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) setSelectedFile(f);
                  }}
                />
                {selectedFile ? (
                  <div>
                    <Archive size={28} className="mx-auto mb-2 text-orange-400" />
                    <p className="font-medium text-white text-sm">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{(selectedFile.size / 1024).toFixed(1)} KB · click to change</p>
                  </div>
                ) : (
                  <div>
                    <Upload size={28} className="mx-auto mb-2 text-gray-600" />
                    <p className="text-sm text-gray-400">Drag & drop your .zip file here</p>
                    <p className="text-xs text-gray-600 mt-1">or click to browse</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 flex items-center gap-1">
                  <FolderOpen size={12} /> Extract to path
                </label>
                <input
                  type="text"
                  value={targetPath}
                  onChange={e => setTargetPath(e.target.value)}
                  placeholder="/ (root)"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <p className="text-xs text-gray-600 mt-1">Use / to extract to repo root, or /subfolder to extract into a folder</p>
              </div>

              {extracting && (
                <div>
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
                    <span>Extracting files...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleExtract}
                disabled={!selectedFile || extracting}
                className="w-full flex items-center justify-center gap-2 bg-orange-700 hover:bg-orange-600 disabled:bg-gray-800 disabled:text-gray-600 text-white text-sm font-medium py-2.5 rounded-lg transition"
              >
                <Archive size={15} />
                {extracting ? 'Extracting...' : 'Extract to repository'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
