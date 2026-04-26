import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Star, GitFork, Eye, Code2, BookOpen, AlertCircle, GitBranch,
  Globe, Lock, Upload, Plus, Archive, Zap, Settings, Trash2,
  Copy, Command, Workflow, GitPullRequest, Flag
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, Repository, RepositoryFile } from '../lib/supabase';
import FileTree from '../components/FileTree';
import CodeViewer from '../components/CodeViewer';
import IssuesPanel from '../components/IssuesPanel';
import ZipUploader from '../components/ZipUploader';
import CodeRunner from '../components/CodeRunner';
import AddFileModal from '../components/AddFileModal';

type Tab = 'code' | 'issues' | 'pages';

export default function RepositoryPage() {
  const { owner, repo: repoName } = useParams<{ owner: string; repo: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [repo, setRepo] = useState<Repository | null>(null);
  const [files, setFiles] = useState<RepositoryFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<RepositoryFile | null>(null);
  const [tab, setTab] = useState<Tab>('code');
  const [starred, setStarred] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showZip, setShowZip] = useState(false);
  const [showAddFile, setShowAddFile] = useState(false);
  const [runFile, setRunFile] = useState<RepositoryFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOwner = profile?.username === owner;

  useEffect(() => {
    function handleKeyPress(e: KeyboardEvent) {
      if ((e.key === '.' || e.key === '>') && repo) {
        const repoUrl = `https://github.dev/${owner}/${repoName}`;
        window.open(repoUrl, '_blank');
      }
    }
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [owner, repoName, repo]);

  useEffect(() => {
    fetchRepo();
  }, [owner, repoName]);

  async function fetchRepo() {
    setLoading(true);
    const { data: ownerData } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', owner)
      .maybeSingle();

    if (!ownerData) { setNotFound(true); setLoading(false); return; }

    const { data: repoData } = await supabase
      .from('repositories')
      .select('*, owner:profiles(*)')
      .eq('owner_id', ownerData.id)
      .eq('name', repoName)
      .maybeSingle();

    if (!repoData) { setNotFound(true); setLoading(false); return; }
    setRepo(repoData);

    const { data: filesData } = await supabase
      .from('repository_files')
      .select('*')
      .eq('repo_id', repoData.id)
      .eq('branch', repoData.default_branch)
      .order('type', { ascending: false })
      .order('path');

    setFiles(filesData ?? []);

    if (filesData && filesData.length > 0) {
      const readme = filesData.find(f => f.name.toLowerCase() === 'readme.md');
      setSelectedFile(readme ?? filesData.find(f => f.type === 'file') ?? null);
    }

    if (user) {
      const { data: star } = await supabase
        .from('repository_stars')
        .select('id')
        .eq('user_id', user.id)
        .eq('repo_id', repoData.id)
        .maybeSingle();
      setStarred(!!star);
    }

    setLoading(false);
  }

  async function toggleStar() {
    if (!user || !repo) return;
    if (starred) {
      await supabase.from('repository_stars').delete().eq('user_id', user.id).eq('repo_id', repo.id);
      setRepo({ ...repo, star_count: repo.star_count - 1 });
    } else {
      await supabase.from('repository_stars').insert({ user_id: user.id, repo_id: repo.id });
      setRepo({ ...repo, star_count: repo.star_count + 1 });
    }
    setStarred(!starred);
  }

  function handleFileAdded(file: RepositoryFile) {
    setFiles(prev => {
      const exists = prev.findIndex(f => f.path === file.path);
      if (exists >= 0) return prev.map((f, i) => i === exists ? file : f);
      return [...prev, file];
    });
    setSelectedFile(file);
    setShowAddFile(false);
  }

  function handleZipExtracted(newFiles: RepositoryFile[]) {
    setFiles(prev => {
      const updated = [...prev];
      for (const f of newFiles) {
        const idx = updated.findIndex(x => x.path === f.path);
        if (idx >= 0) updated[idx] = f;
        else updated.push(f);
      }
      return updated;
    });
    setShowZip(false);
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="flex items-center gap-3 text-gray-500">
        <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        Loading repository...
      </div>
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
      <div className="text-center">
        <AlertCircle size={40} className="mx-auto mb-4 text-gray-600" />
        <h1 className="text-2xl font-bold mb-2">Repository not found</h1>
        <p className="text-gray-500 mb-6">This repository doesn't exist or you don't have access.</p>
        <Link to="/explore" className="text-emerald-400 hover:underline">Explore public repositories</Link>
      </div>
    </div>
  );

  if (!repo) return null;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-screen-xl mx-auto px-6 py-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <BookOpen size={14} />
                <Link to={`/${owner}`} className="hover:text-emerald-400 transition">{owner}</Link>
                <span>/</span>
                <span className="text-white font-semibold text-base">{repo.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${repo.is_private ? 'border-gray-700 text-gray-500' : 'border-emerald-800 text-emerald-600'}`}>
                  {repo.is_private ? <><Lock size={9} className="inline mr-1" />Private</> : <><Globe size={9} className="inline mr-1" />Public</>}
                </span>
              </div>
              {repo.description && <p className="text-sm text-gray-400">{repo.description}</p>}
              {repo.topics.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {repo.topics.map(t => <span key={t} className="text-xs px-2 py-0.5 bg-teal-950 text-teal-400 rounded-full border border-teal-900/50">{t}</span>)}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {user && (
                <button
                  onClick={toggleStar}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition ${
                    starred ? 'bg-yellow-950/50 border-yellow-800 text-yellow-400' : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600 hover:text-white'
                  }`}
                >
                  <Star size={13} fill={starred ? 'currentColor' : 'none'} />
                  {starred ? 'Starred' : 'Star'} · {repo.star_count}
                </button>
              )}
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 bg-gray-800 text-gray-300 text-sm hover:border-gray-600 hover:text-white transition">
                <GitFork size={13} /> Fork · {repo.fork_count}
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 bg-gray-800 text-gray-300 text-sm hover:border-gray-600 hover:text-white transition">
                <Eye size={13} /> Watch · {repo.watcher_count}
              </button>
              <button onClick={() => alert('Commands coming soon!\n\nType "/" in code to see available commands.')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 bg-gray-800 text-gray-300 text-sm hover:border-gray-600 hover:text-white transition" title="Press / for commands">
                <Command size={13} /> Commands
              </button>
              <button onClick={() => alert('PR feature coming soon!\n\nCreate pull requests to propose changes.')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 bg-gray-800 text-gray-300 text-sm hover:border-gray-600 hover:text-white transition">
                <GitPullRequest size={13} /> PRs
              </button>
              <button onClick={() => alert('Actions/CI coming soon!\n\nConnect your CI/CD workflows.')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 bg-gray-800 text-gray-300 text-sm hover:border-gray-600 hover:text-white transition">
                <Workflow size={13} /> Actions
              </button>
              <button onClick={() => alert('Report issue.\n\nHelp us improve Git or Jit? at issues@gitorjit.dev')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 bg-gray-800 text-gray-300 text-sm hover:border-gray-600 hover:text-white transition">
                <Flag size={13} />
              </button>
              {isOwner && (
                <Link to={`/${owner}/${repoName}/settings`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 bg-gray-800 text-gray-300 text-sm hover:border-gray-600 hover:text-white transition">
                  <Settings size={13} />
                </Link>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-0 mt-4 -mb-px border-t border-gray-800 pt-0">
            {[
              { id: 'code' as Tab, icon: <Code2 size={13} />, label: 'Code', count: files.filter(f => f.type === 'file').length },
              { id: 'issues' as Tab, icon: <AlertCircle size={13} />, label: 'Issues', count: repo.issue_count },
              { id: 'pages' as Tab, icon: <Globe size={13} />, label: 'Pages' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm border-b-2 transition -mb-px ${
                  tab === t.id ? 'border-emerald-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                {t.icon} {t.label}
                {t.count !== undefined && (
                  <span className={`px-1.5 py-0.5 rounded-full text-xs ${tab === t.id ? 'bg-emerald-900 text-emerald-400' : 'bg-gray-800 text-gray-600'}`}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-screen-xl mx-auto px-6 py-6">
        {tab === 'code' && (
          <div className="flex gap-4 min-h-[70vh]">
            {/* File tree */}
            <div className="w-60 shrink-0">
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <GitBranch size={12} /> {repo.default_branch}
                  </div>
                  {isOwner && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setShowAddFile(true)}
                        className="text-gray-500 hover:text-emerald-400 p-1 rounded transition"
                        title="Add file"
                      >
                        <Plus size={13} />
                      </button>
                      <button
                        onClick={() => setShowZip(true)}
                        className="text-gray-500 hover:text-emerald-400 p-1 rounded transition"
                        title="Upload zip"
                      >
                        <Archive size={13} />
                      </button>
                    </div>
                  )}
                </div>
                <FileTree
                  files={files}
                  onSelect={setSelectedFile}
                  selectedPath={selectedFile?.path ?? ''}
                />
              </div>
            </div>

            {/* Code viewer */}
            <div className="flex-1 min-w-0">
              {files.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 bg-gray-900 border border-gray-800 rounded-xl text-center">
                  <Code2 size={36} className="text-gray-700 mb-4" />
                  <p className="text-gray-500 mb-2">This repository is empty</p>
                  {isOwner && (
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => setShowAddFile(true)} className="flex items-center gap-1.5 text-sm bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition">
                        <Plus size={14} /> Add file
                      </button>
                      <button onClick={() => setShowZip(true)} className="flex items-center gap-1.5 text-sm bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 px-4 py-2 rounded-lg transition">
                        <Archive size={14} /> Upload zip
                      </button>
                    </div>
                  )}
                </div>
              ) : selectedFile ? (
                <CodeViewer
                  file={selectedFile}
                  onRun={f => setRunFile(f)}
                />
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-600">Select a file to view</div>
              )}
            </div>
          </div>
        )}

        {tab === 'issues' && repo && (
          <IssuesPanel repo={repo} />
        )}

        {tab === 'pages' && (
          <div className="max-w-2xl">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Globe size={20} className="text-emerald-400" />
                <h2 className="font-semibold text-lg">Jit Pages</h2>
              </div>
              {repo.has_pages ? (
                <div>
                  <p className="text-sm text-gray-400 mb-4">Your site is published.</p>
                  <a href={repo.pages_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-emerald-400 hover:underline text-sm">
                    <Globe size={14} /> {repo.pages_url}
                  </a>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-400 mb-6">Deploy a static site from this repository to Jit Pages. Any HTML/CSS/JS files in the root will be served automatically.</p>
                  {isOwner ? (
                    <button
                      onClick={async () => {
                        if (!repo) return;
                        const pagesUrl = `https://${owner}.gitorjit.dev/${repoName}`;
                        await supabase.from('repositories').update({ has_pages: true, pages_url: pagesUrl }).eq('id', repo.id);
                        setRepo({ ...repo, has_pages: true, pages_url: pagesUrl });
                      }}
                      className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white text-sm px-5 py-2.5 rounded-lg transition"
                    >
                      <Globe size={14} /> Enable Jit Pages
                    </button>
                  ) : (
                    <p className="text-sm text-gray-600">Only the repository owner can enable Pages.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Zip uploader modal */}
      {showZip && repo && (
        <ZipUploader
          repo={repo}
          branch={repo.default_branch}
          onClose={() => setShowZip(false)}
          onExtracted={handleZipExtracted}
        />
      )}

      {/* Add file modal */}
      {showAddFile && repo && (
        <AddFileModal
          repo={repo}
          branch={repo.default_branch}
          onClose={() => setShowAddFile(false)}
          onAdded={handleFileAdded}
        />
      )}

      {/* Code runner */}
      {runFile && (
        <CodeRunner
          file={runFile}
          repoId={repo?.id ?? ''}
          onClose={() => setRunFile(null)}
        />
      )}
    </div>
  );
}
