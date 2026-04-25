import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GitBranch, Bell, Plus, ChevronDown, Search, X,
  Menu, LogOut, Settings, User, BookOpen, Star, GitFork, Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [newMenuOpen, setNewMenuOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) navigate(`/explore?q=${encodeURIComponent(search.trim())}`);
  }

  return (
    <nav className="bg-gray-950 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-screen-2xl mx-auto px-4">
        <div className="flex items-center h-14 gap-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-lg flex items-center justify-center">
              <GitBranch size={16} className="text-white" />
            </div>
            <span className="font-bold text-white text-lg hidden sm:block">
              Git <span className="text-emerald-400">or</span> Jit?
            </span>
          </Link>

          {/* Search */}
          {user && (
            <form onSubmit={handleSearch} className="flex-1 max-w-lg mx-2 hidden md:flex">
              <div className="relative w-full">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search repositories, users..."
                  className="w-full bg-gray-900 border border-gray-700 rounded-md pl-9 pr-4 py-1.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition"
                />
                {search && (
                  <button type="button" onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                    <X size={12} className="text-gray-500 hover:text-gray-300" />
                  </button>
                )}
              </div>
            </form>
          )}

          <div className="flex-1 md:flex-none" />

          {user ? (
            <div className="flex items-center gap-1">
              {/* New dropdown */}
              <div className="relative">
                <button
                  onClick={() => { setNewMenuOpen(!newMenuOpen); setUserMenuOpen(false); }}
                  className="flex items-center gap-1 text-gray-300 hover:text-white px-2 py-1.5 rounded-md hover:bg-gray-800 transition text-sm"
                >
                  <Plus size={16} />
                  <ChevronDown size={12} />
                </button>
                {newMenuOpen && (
                  <div className="absolute right-0 mt-1 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-xl py-1 z-50">
                    <Link to="/new" onClick={() => setNewMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition">
                      <BookOpen size={14} /> New repository
                    </Link>
                    <Link to="/new?type=org" onClick={() => setNewMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition">
                      <GitFork size={14} /> New organization
                    </Link>
                  </div>
                )}
              </div>

              {/* Notifications */}
              <Link to="/notifications" className="relative text-gray-300 hover:text-white p-1.5 rounded-md hover:bg-gray-800 transition">
                <Bell size={18} />
              </Link>

              {/* User menu */}
              <div className="relative ml-1">
                <button
                  onClick={() => { setUserMenuOpen(!userMenuOpen); setNewMenuOpen(false); }}
                  className="flex items-center gap-1.5"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      profile?.username?.[0]?.toUpperCase() ?? 'U'
                    )}
                  </div>
                  <ChevronDown size={12} className="text-gray-400" />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-1 w-56 bg-gray-900 border border-gray-700 rounded-lg shadow-xl py-1 z-50">
                    <div className="px-3 py-2 border-b border-gray-800">
                      <p className="text-sm font-medium text-white">{profile?.display_name || profile?.username}</p>
                      <p className="text-xs text-gray-500">@{profile?.username}</p>
                    </div>
                    <Link to={`/${profile?.username}`} onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition">
                      <User size={14} /> Your profile
                    </Link>
                    <Link to="/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition">
                      <BookOpen size={14} /> Your repositories
                    </Link>
                    <Link to="/stars" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition">
                      <Star size={14} /> Your stars
                    </Link>
                    <Link to="/executor" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition">
                      <Zap size={14} /> Code executor
                    </Link>
                    <div className="border-t border-gray-800 mt-1 pt-1">
                      <Link to="/settings" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition">
                        <Settings size={14} /> Settings
                      </Link>
                      <button onClick={handleSignOut} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-red-400 transition">
                        <LogOut size={14} /> Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/auth" className="text-sm text-gray-300 hover:text-white transition px-3 py-1.5">Sign in</Link>
              <Link to="/auth?mode=signup" className="text-sm bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-md transition font-medium">Sign up</Link>
            </div>
          )}

          {/* Mobile menu */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-gray-400 hover:text-white p-1">
            <Menu size={20} />
          </button>
        </div>

        {/* Mobile search */}
        {user && menuOpen && (
          <div className="pb-3 md:hidden">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full bg-gray-900 border border-gray-700 rounded-md pl-9 pr-4 py-1.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </form>
          </div>
        )}
      </div>
    </nav>
  );
}
