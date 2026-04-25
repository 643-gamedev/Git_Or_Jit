import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { GitBranch, Mail, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const [params] = useSearchParams();
  const [mode, setMode] = useState<'signin' | 'signup'>(params.get('mode') === 'signup' ? 'signup' : 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'signup') {
      if (username.length < 3) { setError('Username must be at least 3 characters'); setLoading(false); return; }
      if (!/^[a-zA-Z0-9_-]+$/.test(username)) { setError('Username can only contain letters, numbers, hyphens, and underscores'); setLoading(false); return; }
      const { error } = await signUp(email, password, username);
      if (error) setError(error.message);
      else navigate('/');
    } else {
      const { error } = await signIn(email, password);
      if (error) setError(error.message);
      else navigate('/');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/40">
              <GitBranch size={24} className="text-white" />
            </div>
            <span className="text-2xl font-black text-white">Git <span className="text-emerald-400">or</span> Jit?</span>
          </Link>
          <h2 className="mt-6 text-2xl font-bold text-white">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {mode === 'signin' ? "Don't have an account? " : 'Already have one? '}
            <button
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
              className="text-emerald-400 hover:text-emerald-300 font-medium transition"
            >
              {mode === 'signin' ? 'Sign up free' : 'Sign in'}
            </button>
          </p>
        </div>

        {/* Form */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          {error && (
            <div className="flex items-start gap-2 bg-red-950/50 border border-red-900/50 text-red-400 text-sm rounded-lg px-4 py-3 mb-5">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Username</label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value.toLowerCase())}
                    placeholder="your-username"
                    required
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition"
                  />
                </div>
                {username && (
                  <p className="text-xs text-gray-600 mt-1">
                    Your profile will be at <span className="text-emerald-500">gitorjit.dev/{username}</span>
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Email address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'Min 6 characters' : 'Your password'}
                  required
                  minLength={6}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-10 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900 disabled:text-emerald-700 text-white font-semibold py-2.5 rounded-lg transition-all duration-200 text-sm mt-2"
            >
              {loading ? 'Please wait...' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          {mode === 'signin' && (
            <p className="text-center text-xs text-gray-600 mt-4">
              <button className="text-gray-500 hover:text-gray-300 transition">Forgot your password?</button>
            </p>
          )}
        </div>

        <p className="text-center text-xs text-gray-700 mt-6">
          By signing up you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
