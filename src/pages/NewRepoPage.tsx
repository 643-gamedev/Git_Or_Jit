import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Lock, Globe, AlertCircle, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const LICENSES = ['MIT', 'Apache 2.0', 'GPL v3', 'BSD 2-Clause', 'BSD 3-Clause', 'LGPL v2.1', 'MPL 2.0', 'Unlicense', 'None'];
const GITIGNORES = ['Node', 'Python', 'Rust', 'Go', 'Java', 'C++', 'Ruby', 'PHP', 'Swift', 'None'];

export default function NewRepoPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [initRepo, setInitRepo] = useState(true);
  const [license, setLicense] = useState('MIT');
  const [gitignore, setGitignore] = useState('Node');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const nameValid = /^[a-zA-Z0-9_.-]+$/.test(name) && name.length > 0;
  const nameMsg = name.length === 0 ? '' : !nameValid ? 'Only letters, numbers, hyphens, underscores, and dots allowed' : '';

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !nameValid) return;
    setError('');
    setLoading(true);

    const { data: existing } = await supabase
      .from('repositories')
      .select('id')
      .eq('owner_id', profile.id)
      .eq('name', name)
      .maybeSingle();

    if (existing) {
      setError(`You already have a repository named "${name}"`);
      setLoading(false);
      return;
    }

    const { data: repo, error: err } = await supabase
      .from('repositories')
      .insert({
        owner_id: profile.id,
        name,
        description: desc,
        is_private: isPrivate,
        license: license === 'None' ? '' : license,
      })
      .select()
      .single();

    if (err) { setError(err.message); setLoading(false); return; }

    if (initRepo && repo) {
      const readmeContent = `# ${name}\n\n${desc || 'A new repository created with Git or Jit?'}\n`;
      await supabase.from('repository_files').insert([
        {
          repo_id: repo.id,
          branch: 'main',
          path: 'README.md',
          name: 'README.md',
          type: 'file',
          content: readmeContent,
          size_bytes: readmeContent.length,
          commit_message: 'Initial commit',
          committed_by: profile.id,
        },
        ...(gitignore !== 'None' ? [{
          repo_id: repo.id,
          branch: 'main',
          path: '.gitignore',
          name: '.gitignore',
          type: 'file' as const,
          content: `# ${gitignore} .gitignore\nnode_modules/\ndist/\n.env\n*.log\n`,
          size_bytes: 40,
          commit_message: 'Initial commit',
          committed_by: profile.id,
        }] : []),
      ]);
    }

    navigate(`/${profile.username}/${name}`);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
            <BookOpen size={20} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Create a new repository</h1>
            <p className="text-sm text-gray-500">A repository contains all project files and revision history.</p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-950/50 border border-red-900 text-red-400 text-sm rounded-lg px-4 py-3 mb-6">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-6">
          {/* Owner / Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Repository name</label>
            <div className="flex items-center gap-2">
              <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-400">
                {profile?.username} /
              </div>
              <div className="relative flex-1">
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="my-awesome-project"
                  required
                  className={`w-full bg-gray-900 border rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none transition ${
                    nameMsg ? 'border-red-700 focus:border-red-600' : name && nameValid ? 'border-emerald-700 focus:border-emerald-500' : 'border-gray-700 focus:border-emerald-500'
                  }`}
                />
                {name && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    {nameValid ? <Check size={14} className="text-emerald-500" /> : <X size={14} className="text-red-500" />}
                  </span>
                )}
              </div>
            </div>
            {nameMsg && <p className="text-xs text-red-400 mt-1">{nameMsg}</p>}
            {name && nameValid && (
              <p className="text-xs text-gray-600 mt-1">
                Will be at <span className="text-emerald-600">{profile?.username}/{name}</span>
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description <span className="text-gray-600 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="A short description of your repository"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Visibility</label>
            <div className="space-y-2">
              {[
                { value: false, icon: <Globe size={18} className="text-gray-400" />, title: 'Public', desc: 'Anyone can see this repository.' },
                { value: true, icon: <Lock size={18} className="text-gray-400" />, title: 'Private', desc: 'Only you and collaborators can see this repository.' },
              ].map(opt => (
                <label key={String(opt.value)} className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition ${
                  isPrivate === opt.value ? 'border-emerald-700 bg-emerald-950/30' : 'border-gray-800 hover:border-gray-700 bg-gray-900'
                }`}>
                  <input
                    type="radio"
                    name="visibility"
                    checked={isPrivate === opt.value}
                    onChange={() => setIsPrivate(opt.value)}
                    className="mt-0.5 accent-emerald-500"
                  />
                  <div className="flex items-start gap-3">
                    {opt.icon}
                    <div>
                      <p className="text-sm font-medium text-white">{opt.title}</p>
                      <p className="text-xs text-gray-500">{opt.desc}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Initialize */}
          <div className="border-t border-gray-800 pt-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={initRepo}
                onChange={e => setInitRepo(e.target.checked)}
                className="mt-0.5 accent-emerald-500"
              />
              <div>
                <p className="text-sm font-medium text-white">Initialize this repository with:</p>
                <p className="text-xs text-gray-500">Skip this if you're importing an existing repository.</p>
              </div>
            </label>

            {initRepo && (
              <div className="mt-4 grid sm:grid-cols-2 gap-4 pl-6">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Add .gitignore</label>
                  <select
                    value={gitignore}
                    onChange={e => setGitignore(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-emerald-500"
                  >
                    {GITIGNORES.map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Choose a license</label>
                  <select
                    value={license}
                    onChange={e => setLicense(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-emerald-500"
                  >
                    {LICENSES.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || !nameValid}
              className="bg-emerald-700 hover:bg-emerald-600 disabled:bg-gray-800 disabled:text-gray-600 text-white font-medium px-6 py-2.5 rounded-lg transition text-sm"
            >
              {loading ? 'Creating...' : 'Create repository'}
            </button>
            <button type="button" onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-300 transition px-4 py-2.5">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
