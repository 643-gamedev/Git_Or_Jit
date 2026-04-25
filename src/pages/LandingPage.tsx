import { Link } from 'react-router-dom';
import {
  GitBranch, Zap, Globe, Archive, Code2, Monitor,
  Star, GitFork, Shield, ChevronRight, Terminal, Layers
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="bg-gray-950 min-h-screen text-white">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/30 via-gray-950 to-gray-950 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-950/60 border border-emerald-800/50 rounded-full text-sm text-emerald-400 mb-8">
            <Zap size={12} /> Now with built-in code execution & zip extraction
          </div>

          <h1 className="text-5xl sm:text-7xl font-black tracking-tight mb-6">
            <span className="text-white">Git</span>
            {' '}
            <span className="text-gray-500">or</span>
            {' '}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Jit?</span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            The open developer platform. Host your code, collaborate with teams,
            run code in-browser, unzip archives, and deploy to Pages — all in one place.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/auth?mode=signup"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3.5 rounded-xl font-semibold text-base transition-all duration-200 shadow-lg shadow-emerald-900/40 hover:shadow-emerald-800/60 hover:-translate-y-0.5"
            >
              Get started free <ChevronRight size={16} />
            </Link>
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-200 px-8 py-3.5 rounded-xl font-semibold text-base transition-all duration-200 hover:-translate-y-0.5"
            >
              Explore repos
            </Link>
          </div>

          <p className="mt-6 text-sm text-gray-600">Free forever. No credit card required.</p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="border-y border-gray-800 bg-gray-900/40">
        <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { label: 'Repositories', value: '100% free' },
            { label: 'Storage', value: 'Unlimited' },
            { label: 'Collaborators', value: 'Unlimited' },
            { label: 'Pages sites', value: 'Included' },
          ].map(s => (
            <div key={s.label}>
              <p className="text-2xl font-bold text-emerald-400">{s.value}</p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features grid */}
      <div className="max-w-6xl mx-auto px-6 py-24">
        <h2 className="text-3xl font-bold text-center mb-4">Everything you need to ship code</h2>
        <p className="text-center text-gray-500 mb-14 max-w-xl mx-auto">
          Built for developers who want power without complexity — or a credit card.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: <GitBranch size={22} className="text-emerald-400" />,
              title: 'Git Hosting',
              desc: 'Full repository management with branches, commits, file tree, and diffs. Clone via HTTPS.',
            },
            {
              icon: <Globe size={22} className="text-blue-400" />,
              title: 'Jit Pages',
              desc: 'Publish static sites directly from your repository. Custom domains, HTTPS, instant deploys.',
            },
            {
              icon: <Zap size={22} className="text-yellow-400" />,
              title: 'Code Execution',
              desc: 'Run JavaScript, Python, TypeScript, and more directly in your browser. No setup needed.',
            },
            {
              icon: <Archive size={22} className="text-orange-400" />,
              title: 'Zip Extraction',
              desc: 'Upload a .zip file directly into any repo. We extract it and add all files automatically.',
            },
            {
              icon: <Code2 size={22} className="text-pink-400" />,
              title: 'Issue Tracker',
              desc: 'Built-in issue tracking with labels, milestones, and a clean commenting system.',
            },
            {
              icon: <Monitor size={22} className="text-teal-400" />,
              title: 'Desktop App',
              desc: 'Native desktop app for Windows, macOS, Linux, Raspberry Pi OS, and ChromeOS.',
            },
            {
              icon: <Shield size={22} className="text-emerald-400" />,
              title: 'Private Repos',
              desc: 'Keep your code private with per-repo visibility controls and team collaboration.',
            },
            {
              icon: <Layers size={22} className="text-blue-400" />,
              title: 'Organizations',
              desc: 'Create teams, manage permissions, and collaborate across projects.',
            },
            {
              icon: <Terminal size={22} className="text-gray-400" />,
              title: 'API Access',
              desc: 'Full REST API to automate workflows, integrate with CI/CD, and build tooling.',
            },
          ].map(f => (
            <div key={f.title} className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all duration-200 group">
              <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                {f.icon}
              </div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop app section */}
      <div className="bg-gray-900/50 border-y border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-950/60 border border-teal-800/50 rounded-full text-sm text-teal-400 mb-6">
                <Monitor size={12} /> Desktop App
              </div>
              <h2 className="text-4xl font-bold mb-4">Available on every platform</h2>
              <p className="text-gray-400 mb-8 leading-relaxed">
                The Git or Jit? desktop app gives you a fully-featured Git client, code editor,
                and issue manager — offline capable, native performance.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { os: 'Windows', format: '.exe installer', icon: '🪟' },
                  { os: 'macOS', format: '.dmg universal', icon: '🍎' },
                  { os: 'Linux (x64)', format: '.deb / .AppImage', icon: '🐧' },
                  { os: 'Raspberry Pi', format: '.deb armhf', icon: '🫐' },
                  { os: 'ChromeOS', format: '.deb / .apk', icon: '🌐' },
                  { os: 'Android', format: '.apk sideload', icon: '📱' },
                ].map(d => (
                  <div key={d.os} className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-lg p-3">
                    <span className="text-lg">{d.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-white">{d.os}</p>
                      <p className="text-xs text-gray-500">{d.format}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                to="/downloads"
                className="inline-flex items-center gap-2 mt-6 bg-teal-700 hover:bg-teal-600 text-white px-6 py-2.5 rounded-lg font-medium transition"
              >
                Download app <ChevronRight size={14} />
              </Link>
            </div>

            {/* Mock desktop UI */}
            <div className="relative">
              <div className="bg-gray-950 border border-gray-700 rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-900 border-b border-gray-800">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="ml-3 text-xs text-gray-500 font-mono">Git or Jit? Desktop</span>
                </div>
                <div className="flex">
                  <div className="w-44 bg-gray-900 border-r border-gray-800 p-3">
                    <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider mb-2">Repositories</p>
                    {['my-app', 'portfolio', 'api-server'].map((r, i) => (
                      <div key={r} className={`text-xs px-2 py-1.5 rounded mb-0.5 ${i === 0 ? 'bg-emerald-950 text-emerald-400' : 'text-gray-500 hover:bg-gray-800'}`}>
                        {r}
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 p-3">
                    <p className="text-xs text-gray-600 mb-2 font-mono">main · 12 commits</p>
                    {['README.md', 'src/index.ts', 'package.json', 'vite.config.ts'].map(f => (
                      <div key={f} className="flex items-center gap-2 text-xs text-gray-400 py-1 border-b border-gray-900">
                        <Code2 size={10} className="text-emerald-500" />
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Social proof */}
      <div className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold mb-12">Why developers choose Git or Jit?</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: <Star size={18} className="text-yellow-400" />, title: 'No hidden costs', desc: 'Truly free. Public and private repos. No storage limits. No seat limits. Forever.' },
            { icon: <Zap size={18} className="text-emerald-400" />, title: 'Run code instantly', desc: 'Click run on any supported file and see output in seconds. No VMs to spin up.' },
            { icon: <GitFork size={18} className="text-teal-400" />, title: 'Open ecosystem', desc: 'Full API, webhooks, and CI/CD integrations. Works with your existing tools.' },
          ].map(c => (
            <div key={c.title} className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-left">
              <div className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center mb-4">{c.icon}</div>
              <h3 className="font-semibold text-white mb-2">{c.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="border-t border-gray-800 bg-gradient-to-b from-gray-900 to-gray-950">
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to ship?</h2>
          <p className="text-gray-400 mb-8">Join thousands of developers building on Git or Jit? — completely free.</p>
          <Link
            to="/auth?mode=signup"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg shadow-emerald-900/50 hover:-translate-y-1"
          >
            Create your account <ChevronRight size={18} />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-950">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-md flex items-center justify-center">
                <GitBranch size={14} className="text-white" />
              </div>
              <span className="font-bold text-white">Git or Jit?</span>
            </div>
            <div className="flex gap-6 text-sm text-gray-500">
              <Link to="/explore" className="hover:text-white transition">Explore</Link>
              <Link to="/downloads" className="hover:text-white transition">Downloads</Link>
              <Link to="/docs" className="hover:text-white transition">Docs</Link>
              <Link to="/status" className="hover:text-white transition">Status</Link>
            </div>
            <p className="text-xs text-gray-700">© 2026 Git or Jit?. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
