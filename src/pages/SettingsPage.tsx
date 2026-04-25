import { useState } from 'react';
import { User, Lock, Bell, Palette, Save, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

type Tab = 'profile' | 'security' | 'notifications';

export default function SettingsPage() {
  const { profile, refreshProfile } = useAuth();
  const [tab, setTab] = useState<Tab>('profile');
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [website, setWebsite] = useState(profile?.website ?? '');
  const [location, setLocation] = useState(profile?.location ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setError('');

    const { error: err } = await supabase.from('profiles').update({
      display_name: displayName,
      bio,
      website,
      location,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    }).eq('id', profile.id);

    if (err) { setError(err.message); setSaving(false); return; }

    await refreshProfile();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSaving(false);
  }

  const tabs = [
    { id: 'profile' as Tab, icon: <User size={14} />, label: 'Profile' },
    { id: 'security' as Tab, icon: <Lock size={14} />, label: 'Security' },
    { id: 'notifications' as Tab, icon: <Bell size={14} />, label: 'Notifications' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold mb-8">Settings</h1>

        <div className="flex flex-col sm:flex-row gap-8">
          {/* Sidebar nav */}
          <nav className="sm:w-48 shrink-0">
            <ul className="space-y-0.5">
              {tabs.map(t => (
                <li key={t.id}>
                  <button
                    onClick={() => setTab(t.id)}
                    className={`flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                      tab === t.id ? 'bg-gray-800 text-white font-medium' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-900'
                    }`}
                  >
                    {t.icon} {t.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {tab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div className="pb-5 border-b border-gray-800">
                  <h2 className="text-lg font-semibold mb-1">Public profile</h2>
                  <p className="text-sm text-gray-500">This information is visible to other users.</p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950/40 border border-red-900/50 px-3 py-2 rounded-lg">
                    <AlertCircle size={14} /> {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Username</label>
                  <input
                    value={profile?.username ?? ''}
                    disabled
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-600 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-600 mt-1">Username cannot be changed.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Display name</label>
                  <input
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Bio</label>
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    placeholder="Tell the community a little about yourself"
                    rows={3}
                    maxLength={160}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition resize-none"
                  />
                  <p className="text-xs text-gray-600 mt-1">{bio.length}/160</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Website</label>
                    <input
                      value={website}
                      onChange={e => setWebsite(e.target.value)}
                      placeholder="https://yoursite.com"
                      type="url"
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Location</label>
                    <input
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      placeholder="City, Country"
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Avatar URL</label>
                  <input
                    value={avatarUrl}
                    onChange={e => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition"
                  />
                  {avatarUrl && (
                    <div className="mt-2 flex items-center gap-3">
                      <img src={avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-gray-700" onError={() => setAvatarUrl('')} />
                      <span className="text-xs text-gray-600">Preview</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 disabled:bg-gray-800 disabled:text-gray-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition"
                >
                  {saved ? <><Check size={14} /> Saved!</> : saving ? 'Saving...' : <><Save size={14} /> Save changes</>}
                </button>
              </form>
            )}

            {tab === 'security' && (
              <div className="space-y-5">
                <div className="pb-5 border-b border-gray-800">
                  <h2 className="text-lg font-semibold mb-1">Security</h2>
                  <p className="text-sm text-gray-500">Manage your password and authentication settings.</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <h3 className="font-medium mb-4">Change password</h3>
                  <div className="space-y-3">
                    <input type="password" placeholder="Current password" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500" />
                    <input type="password" placeholder="New password" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500" />
                    <input type="password" placeholder="Confirm new password" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500" />
                    <button className="bg-emerald-700 hover:bg-emerald-600 text-white text-sm px-5 py-2 rounded-lg transition">Update password</button>
                  </div>
                </div>
              </div>
            )}

            {tab === 'notifications' && (
              <div className="space-y-5">
                <div className="pb-5 border-b border-gray-800">
                  <h2 className="text-lg font-semibold mb-1">Notifications</h2>
                  <p className="text-sm text-gray-500">Choose what you're notified about.</p>
                </div>
                {[
                  { label: 'New followers', desc: 'When someone follows you' },
                  { label: 'Repository stars', desc: 'When someone stars your repository' },
                  { label: 'Issue comments', desc: 'When someone comments on your issues' },
                  { label: 'Pull requests', desc: 'When someone opens a PR on your repository' },
                  { label: 'Mentions', desc: 'When someone @mentions you' },
                ].map(n => (
                  <label key={n.label} className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 cursor-pointer hover:border-gray-700 transition">
                    <div>
                      <p className="text-sm font-medium text-white">{n.label}</p>
                      <p className="text-xs text-gray-500">{n.desc}</p>
                    </div>
                    <input type="checkbox" defaultChecked className="accent-emerald-500 scale-110" />
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
