import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, BookOpen, Star, GitFork, Clock, Search, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, Repository } from '../lib/supabase';
import RepoCard from '../components/RepoCard';

export default function DashboardPage() {
  const { profile } = useAuth();
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'public' | 'private'>('all');
  const [tab, setTab] = useState<'repos' | 'stars'>('repos');
  const [starredRepos, setStarredRepos] = useState<Repository[]>([]);

  useEffect(() => {
    if (!profile) return;
    fetchRepos();
    fetchStarred();
  }, [profile]);

  async function fetchRepos() {
    if (!profile) return;
    setLoading(true);
    const { data } = await supabase
      .from('repositories')
      .select('*, owner:profiles(*)')
      .eq('owner_id', profile.id)
      .order('updated_at', { ascending: false });
    setRepos(data ?? []);
    setLoading(false);
  }

  async function fetchStarred() {
    if (!profile) return;
    const { data } = await supabase
      .from('repository_stars')
      .select('repo_id, repositories(*, owner:profiles(*))')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });
    const starred = (data ?? []).map((s: { repositories: Repository }) => s.repositories).filter(Boolean);
    setStarredRepos(starred);
  }

  const filtered = (tab === 'repos' ? repos : starredRepos).filter(r => {
    const matchName = r.name.toLowerCase().includes(filter.toLowerCase()) ||
      r.description.toLowerCase().includes(filter.toLowerCase());
    const matchType = typeFilter === 'all' ? true : typeFilter === 'public' ? !r.is_private : r.is_private;
    return matchName && matchType;
  });

  const totalStars = repos.reduce((s, r) => s + r.star_count, 0);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-screen-xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-72 shrink-0">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-2xl font-bold text-white overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  profile?.username?.[0]?.toUpperCase()
                )}
              </div>
              <div>
                <p className="font-bold text-lg text-white">{profile?.display_name || profile?.username}</p>
                <p className="text-sm text-gray-500">@{profile?.username}</p>
              </div>
            </div>

            {profile?.bio && <p className="text-sm text-gray-400 mb-4">{profile.bio}</p>}

            <div className="grid grid-cols-3 gap-2 mb-6">
              {[
                { icon: <BookOpen size={14} />, label: 'Repos', value: repos.length },
                { icon: <Star size={14} />, label: 'Stars', value: totalStars },
                { icon: <GitFork size={14} />, label: 'Forks', value: repos.reduce((s, r) => s + r.fork_count, 0) },
              ].map(s => (
                <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-emerald-400">{s.value}</p>
                  <p className="text-xs text-gray-600">{s.label}</p>
                </div>
              ))}
            </div>

            <Link to={`/${profile?.username}`} className="block w-full text-center text-sm bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-300 hover:text-white px-4 py-2 rounded-lg transition mb-3">
              View public profile
            </Link>

            <Link to="/new" className="flex items-center justify-center gap-2 w-full text-sm bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition font-medium">
              <Plus size={15} /> New repository
            </Link>

            <div className="mt-6 space-y-1">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Quick links</p>
              <Link to="/executor" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white py-1.5 transition">
                <Clock size={14} className="text-emerald-500" /> Code executor
              </Link>
              <Link to="/explore" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white py-1.5 transition">
                <Search size={14} className="text-emerald-500" /> Explore
              </Link>
            </div>
          </aside>

          {/* Main */}
          <main className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-5">
              <div className="flex border-b border-gray-800 w-full gap-0">
                {[
                  { id: 'repos' as const, label: 'Repositories', count: repos.length },
                  { id: 'stars' as const, label: 'Starred', count: starredRepos.length },
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition -mb-px ${
                      tab === t.id ? 'border-emerald-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {t.label}
                    <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${tab === t.id ? 'bg-emerald-900 text-emerald-400' : 'bg-gray-800 text-gray-600'}`}>
                      {t.count}
                    </span>
                  </button>
                ))}
                <div className="flex-1 flex items-center justify-end pb-2 gap-2">
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-600" />
                    <input
                      value={filter}
                      onChange={e => setFilter(e.target.value)}
                      placeholder="Find a repository..."
                      className="bg-gray-900 border border-gray-800 rounded-md pl-8 pr-3 py-1 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-emerald-500 w-48"
                    />
                  </div>
                  <div className="relative">
                    <Filter size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-600" />
                    <select
                      value={typeFilter}
                      onChange={e => setTypeFilter(e.target.value as 'all' | 'public' | 'private')}
                      className="bg-gray-900 border border-gray-800 rounded-md pl-8 pr-6 py-1 text-sm text-gray-300 focus:outline-none focus:border-emerald-500 appearance-none"
                    >
                      <option value="all">All</option>
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                  {tab === 'repos' && (
                    <Link to="/new" className="flex items-center gap-1 bg-emerald-700 hover:bg-emerald-600 text-white text-sm px-3 py-1 rounded-md transition font-medium">
                      <Plus size={13} /> New
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-32 bg-gray-900 border border-gray-800 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 text-gray-600">
                <BookOpen size={40} className="mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium text-gray-500">
                  {filter ? 'No repositories match your search' : tab === 'repos' ? "You don't have any repositories yet" : "You haven't starred any repositories yet"}
                </p>
                {tab === 'repos' && !filter && (
                  <Link to="/new" className="inline-flex items-center gap-2 mt-4 bg-emerald-700 hover:bg-emerald-600 text-white px-5 py-2 rounded-lg transition text-sm font-medium">
                    <Plus size={14} /> Create your first repo
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(r => <RepoCard key={r.id} repo={r} showOwner={tab === 'stars'} />)}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
