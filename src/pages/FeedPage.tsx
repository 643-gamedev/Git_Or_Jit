import { useState, useEffect } from 'react';
import { TrendingUp, Star, Users, GitFork } from 'lucide-react';
import { supabase, Repository, Profile } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import RepoCard from '../components/RepoCard';

export default function FeedPage() {
  const { profile, user } = useAuth();
  const [trending, setTrending] = useState<Repository[]>([]);
  const [followingRepos, setFollowingRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'trending' | 'following'>('trending');

  useEffect(() => {
    fetchFeed();
  }, [profile, user]);

  async function fetchFeed() {
    setLoading(true);

    const { data: trendingData } = await supabase
      .from('repositories')
      .select('*, owner:profiles(*)')
      .eq('is_private', false)
      .order('star_count', { ascending: false })
      .limit(20);
    setTrending(trendingData ?? []);

    if (profile && user) {
      const { data: following } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)
        .limit(50);

      if (following && following.length > 0) {
        const followingIds = following.map(f => f.following_id);
        const { data: followingReposData } = await supabase
          .from('repositories')
          .select('*, owner:profiles(*)')
          .eq('is_private', false)
          .in('owner_id', followingIds)
          .order('updated_at', { ascending: false })
          .limit(20);
        setFollowingRepos(followingReposData ?? []);
      }
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-screen-xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Home Feed</h1>
          <p className="text-gray-500">Discover the latest activity from your network</p>
        </div>

        <div className="flex border-b border-gray-800 mb-6 gap-0">
          {[
            { id: 'trending' as const, icon: <TrendingUp size={13} />, label: 'Trending', count: trending.length },
            ...(profile ? [{ id: 'following' as const, icon: <Users size={13} />, label: 'Following', count: followingRepos.length }] : []),
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm border-b-2 transition -mb-px ${
                tab === t.id ? 'border-emerald-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              {t.icon} {t.label}
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${tab === t.id ? 'bg-emerald-900 text-emerald-400' : 'bg-gray-800 text-gray-600'}`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-900 border border-gray-800 rounded-xl animate-pulse" />)}
          </div>
        ) : (tab === 'trending' ? trending : followingRepos).length === 0 ? (
          <div className="text-center py-16 text-gray-600">
            {tab === 'trending' ? (
              <>
                <TrendingUp size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-gray-500">No trending repositories yet</p>
              </>
            ) : (
              <>
                <Users size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-gray-500">Start following users to see their repositories</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {(tab === 'trending' ? trending : followingRepos).map(r => (
              <RepoCard key={r.id} repo={r} showOwner />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
