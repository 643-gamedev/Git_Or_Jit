import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Globe, Calendar, Users, BookOpen, Star, GitFork, AlertCircle, Activity } from 'lucide-react';
import { supabase, Profile, Repository, Contribution } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import RepoCard from '../components/RepoCard';

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { profile: myProfile, user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [repos, setRepos] = useState<Repository[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [following, setFollowing] = useState(false);
  const [tab, setTab] = useState<'repos' | 'stars'>('repos');
  const [starredRepos, setStarredRepos] = useState<Repository[]>([]);

  const isMe = myProfile?.username === username;

  useEffect(() => {
    fetchProfile();
  }, [username]);

  async function fetchProfile() {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (!data) { setNotFound(true); setLoading(false); return; }
    setProfile(data);

    const { data: contribData } = await supabase
      .from('user_contributions')
      .select('*')
      .eq('user_id', data.id)
      .order('contribution_date', { ascending: true })
      .limit(365);
    setContributions(contribData ?? []);

    const { data: reposData } = await supabase
      .from('repositories')
      .select('*, owner:profiles(*)')
      .eq('owner_id', data.id)
      .eq('is_private', false)
      .order('updated_at', { ascending: false });
    setRepos(reposData ?? []);

    const { data: starsData } = await supabase
      .from('repository_stars')
      .select('repositories(*, owner:profiles(*))')
      .eq('user_id', data.id)
      .order('created_at', { ascending: false });
    setStarredRepos((starsData ?? []).map((s: { repositories: Repository }) => s.repositories).filter(Boolean));

    if (user && !isMe) {
      const { data: followData } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', data.id)
        .maybeSingle();
      setFollowing(!!followData);
    }

    setLoading(false);
  }

  async function toggleFollow() {
    if (!user || !profile || isMe) return;
    if (following) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', profile.id);
      setProfile({ ...profile, follower_count: profile.follower_count - 1 });
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: profile.id });
      setProfile({ ...profile, follower_count: profile.follower_count + 1 });
    }
    setFollowing(!following);
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="flex items-center gap-2 text-gray-500">
        <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        Loading profile...
      </div>
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
      <div className="text-center">
        <AlertCircle size={40} className="mx-auto mb-4 text-gray-600" />
        <h1 className="text-2xl font-bold mb-2">User not found</h1>
        <p className="text-gray-500 mb-4">@{username} doesn't exist on Git or Jit?</p>
        <Link to="https://status.gitorjit.dev" target="_blank" className="text-emerald-400 hover:underline text-sm">
          Check system status
        </Link>
        {' · '}
        <button onClick={() => navigate('/explore')} className="text-emerald-400 hover:underline text-sm">
          Explore repos
        </button>
      </div>
    </div>
  );

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-screen-xl mx-auto px-6 py-10">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Sidebar */}
          <aside className="lg:w-72 shrink-0">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-3xl font-black text-white mb-4 overflow-hidden mx-auto lg:mx-0">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                profile.username[0]?.toUpperCase()
              )}
            </div>

            <h1 className="text-xl font-bold text-white text-center lg:text-left">{profile.display_name || profile.username}</h1>
            <p className="text-gray-500 text-sm mb-4 text-center lg:text-left">@{profile.username}</p>

            {profile.bio && <p className="text-sm text-gray-300 mb-4">{profile.bio}</p>}

            {user && !isMe && (
              <button
                onClick={toggleFollow}
                className={`w-full py-2 rounded-lg text-sm font-medium transition mb-4 ${
                  following ? 'bg-gray-800 border border-gray-700 text-gray-300 hover:bg-red-950 hover:border-red-900 hover:text-red-400' : 'bg-emerald-700 hover:bg-emerald-600 text-white'
                }`}
              >
                {following ? 'Unfollow' : 'Follow'}
              </button>
            )}
            {isMe && (
              <Link to="/settings" className="block w-full text-center py-2 rounded-lg text-sm font-medium bg-gray-800 border border-gray-700 text-gray-300 hover:border-gray-600 hover:text-white transition mb-4">
                Edit profile
              </Link>
            )}

            <div className="space-y-2 text-sm text-gray-500">
              {profile.location && (
                <div className="flex items-center gap-2"><MapPin size={14} /> {profile.location}</div>
              )}
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-emerald-400 transition">
                  <Globe size={14} /> {profile.website.replace(/^https?:\/\//, '')}
                </a>
              )}
              <div className="flex items-center gap-2">
                <Calendar size={14} />
                Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </div>
            </div>

            <div className="flex gap-4 mt-4 text-sm">
              <span className="flex items-center gap-1 text-gray-400">
                <Users size={14} className="text-gray-600" />
                <strong className="text-white">{profile.follower_count}</strong> followers
              </span>
              <span className="flex items-center gap-1 text-gray-400">
                <strong className="text-white">{profile.following_count}</strong> following
              </span>
            </div>

            {contributions.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-800">
                <div className="flex items-center gap-2 mb-3">
                  <Activity size={14} className="text-emerald-500" />
                  <p className="text-xs font-medium text-gray-400">Contributions (last year)</p>
                </div>
                <div className="grid grid-cols-13 gap-0.5">
                  {Array.from({ length: 365 }).map((_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() - (364 - i));
                    const contrib = contributions.find(c => c.contribution_date === date.toISOString().split('T')[0]);
                    const count = contrib?.contribution_count ?? 0;
                    const intensity = count === 0 ? 0 : count === 1 ? 1 : count <= 3 ? 2 : count <= 7 ? 3 : 4;
                    const colors = ['bg-gray-800', 'bg-emerald-950', 'bg-emerald-800', 'bg-emerald-600', 'bg-emerald-500'];
                    return (
                      <div key={i} title={`${count} contributions on ${date.toDateString()}`} className={`w-1.5 h-1.5 rounded-xs ${colors[intensity]}`} />
                    );
                  })}
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  {contributions.reduce((s, c) => s + c.contribution_count, 0)} contributions this year
                </p>
              </div>
            )}
          </aside>

          {/* Repos */}
          <main className="flex-1 min-w-0">
            <div className="flex border-b border-gray-800 mb-5 gap-0">
              {[
                { id: 'repos' as const, icon: <BookOpen size={13} />, label: 'Repositories', count: repos.length },
                { id: 'stars' as const, icon: <Star size={13} />, label: 'Starred', count: starredRepos.length },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm border-b-2 transition -mb-px ${
                    tab === t.id ? 'border-emerald-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {t.icon} {t.label}
                  <span className={`px-1.5 py-0.5 rounded-full text-xs ${tab === t.id ? 'bg-emerald-900 text-emerald-400' : 'bg-gray-800 text-gray-600'}`}>{t.count}</span>
                </button>
              ))}
            </div>

            {(tab === 'repos' ? repos : starredRepos).length === 0 ? (
              <div className="text-center py-16 text-gray-600">
                {tab === 'repos' ? <BookOpen size={32} className="mx-auto mb-3 opacity-30" /> : <Star size={32} className="mx-auto mb-3 opacity-30" />}
                <p className="text-gray-500">
                  {tab === 'repos' ? `${profile.username} doesn't have any public repositories.` : `${profile.username} hasn't starred any repositories.`}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {(tab === 'repos' ? repos : starredRepos).map(r => (
                  <RepoCard key={r.id} repo={r} showOwner={tab === 'stars'} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
