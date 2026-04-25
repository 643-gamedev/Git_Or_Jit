import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, TrendingUp, Star, GitFork, Filter, X } from 'lucide-react';
import { supabase, Repository } from '../lib/supabase';
import RepoCard from '../components/RepoCard';

const LANGUAGES = ['All', 'JavaScript', 'TypeScript', 'Python', 'Rust', 'Go', 'Java', 'C++', 'Ruby', 'PHP', 'Swift'];

export default function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [repos, setRepos] = useState<Repository[]>([]);
  const [trending, setTrending] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState('All');
  const [sort, setSort] = useState<'stars' | 'updated' | 'forks'>('stars');

  useEffect(() => {
    fetchTrending();
  }, []);

  useEffect(() => {
    if (query) search();
    else setRepos([]);
  }, [query, lang, sort]);

  async function fetchTrending() {
    const { data } = await supabase
      .from('repositories')
      .select('*, owner:profiles(*)')
      .eq('is_private', false)
      .order('star_count', { ascending: false })
      .limit(12);
    setTrending(data ?? []);
    setLoading(false);
  }

  async function search() {
    setLoading(true);
    let q = supabase
      .from('repositories')
      .select('*, owner:profiles(*)')
      .eq('is_private', false)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`);

    if (lang !== 'All') q = q.eq('language', lang);
    if (sort === 'stars') q = q.order('star_count', { ascending: false });
    else if (sort === 'forks') q = q.order('fork_count', { ascending: false });
    else q = q.order('updated_at', { ascending: false });

    const { data } = await q.limit(30);
    setRepos(data ?? []);
    setLoading(false);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) setSearchParams({ q: query.trim() });
    else setSearchParams({});
  }

  const displayRepos = query ? repos : trending;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gradient-to-b from-gray-900 to-gray-950 border-b border-gray-800 py-12">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h1 className="text-3xl font-bold mb-2">Explore</h1>
          <p className="text-gray-500 mb-6">Discover public repositories from the Git or Jit? community</p>
          <form onSubmit={handleSearch}>
            <div className="relative max-w-xl mx-auto">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search repositories, topics, languages..."
                className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-11 pr-12 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition"
              />
              {query && (
                <button type="button" onClick={() => { setQuery(''); setSearchParams({}); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition">
                  <X size={14} />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <Filter size={13} /> Filter:
          </div>
          <div className="flex gap-1 flex-wrap">
            {LANGUAGES.map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`text-xs px-2.5 py-1 rounded-full border transition ${
                  lang === l ? 'bg-emerald-950 border-emerald-800 text-emerald-400' : 'bg-gray-900 border-gray-800 text-gray-500 hover:border-gray-700 hover:text-gray-300'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-gray-600">Sort:</span>
            <select
              value={sort}
              onChange={e => setSort(e.target.value as 'stars' | 'updated' | 'forks')}
              className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="stars">Most stars</option>
              <option value="updated">Recently updated</option>
              <option value="forks">Most forks</option>
            </select>
          </div>
        </div>

        {/* Header */}
        {!query && (
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-emerald-500" />
            <h2 className="font-semibold text-sm">Trending repositories</h2>
          </div>
        )}

        {loading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-900 border border-gray-800 rounded-xl animate-pulse" />)}
          </div>
        ) : displayRepos.length === 0 ? (
          <div className="text-center py-16 text-gray-600">
            <Search size={36} className="mx-auto mb-4 opacity-30" />
            <p className="text-gray-500 text-lg">No repositories found for "{query}"</p>
            <p className="text-sm mt-1">Try different keywords or filters</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {displayRepos.map(r => <RepoCard key={r.id} repo={r} showOwner />)}
          </div>
        )}
      </div>
    </div>
  );
}
