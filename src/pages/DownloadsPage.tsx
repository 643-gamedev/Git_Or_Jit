import { Monitor, Download, CheckCircle, Package, Cpu, Smartphone, Globe, Terminal } from 'lucide-react';

const DOWNLOADS = [
  {
    os: 'Windows',
    icon: '🪟',
    description: 'Windows 10 / 11 (x64)',
    formats: [
      { label: '.exe Installer', size: '~85 MB', recommended: true, tag: 'setup' },
      { label: '.zip Portable', size: '~90 MB', tag: 'portable' },
      { label: 'winget install', size: null, tag: 'winget', code: 'winget install GitorJit.Desktop' },
    ],
    color: 'from-blue-600/20 to-blue-900/10',
    border: 'border-blue-800/30',
  },
  {
    os: 'macOS',
    icon: '🍎',
    description: 'macOS 12+ · Universal (Intel + Apple Silicon)',
    formats: [
      { label: '.dmg Universal', size: '~95 MB', recommended: true, tag: 'dmg' },
      { label: 'Homebrew', size: null, tag: 'brew', code: 'brew install --cask gitorjit' },
    ],
    color: 'from-gray-600/20 to-gray-900/10',
    border: 'border-gray-700/30',
  },
  {
    os: 'Linux (x64)',
    icon: '🐧',
    description: 'Ubuntu, Debian, Fedora, Arch and more',
    formats: [
      { label: '.deb (Debian/Ubuntu)', size: '~80 MB', recommended: true, tag: 'deb' },
      { label: '.rpm (Fedora/RHEL)', size: '~80 MB', tag: 'rpm' },
      { label: '.AppImage', size: '~88 MB', tag: 'appimage' },
      { label: 'Snap', size: null, tag: 'snap', code: 'snap install gitorjit' },
      { label: 'AUR (Arch)', size: null, tag: 'aur', code: 'yay -S gitorjit' },
    ],
    color: 'from-orange-600/20 to-orange-900/10',
    border: 'border-orange-800/30',
  },
  {
    os: 'Raspberry Pi OS',
    icon: '🫐',
    description: 'ARM 32-bit (armhf) & 64-bit (arm64) · Pi 3, 4, 5, Zero 2W',
    formats: [
      { label: '.deb armhf (32-bit)', size: '~55 MB', tag: 'deb-arm' },
      { label: '.deb arm64 (64-bit)', size: '~60 MB', recommended: true, tag: 'deb-arm64' },
    ],
    color: 'from-pink-600/20 to-pink-900/10',
    border: 'border-pink-800/30',
  },
  {
    os: 'ChromeOS',
    icon: '🌐',
    description: 'Via Linux (Crostini) or Android subsystem',
    formats: [
      { label: '.deb via Linux (Crostini)', size: '~80 MB', recommended: true, tag: 'deb', note: 'Enable Linux in Chrome settings first' },
      { label: '.apk via Android', size: '~35 MB', tag: 'apk', note: 'Sideload via ADB' },
    ],
    color: 'from-teal-600/20 to-teal-900/10',
    border: 'border-teal-800/30',
  },
  {
    os: 'Android',
    icon: '📱',
    description: 'Android 8.0+ (API 26+) · arm64-v8a, armeabi-v7a',
    formats: [
      { label: '.apk arm64', size: '~35 MB', recommended: true, tag: 'apk-arm64' },
      { label: '.apk universal', size: '~55 MB', tag: 'apk-universal' },
    ],
    color: 'from-emerald-600/20 to-emerald-900/10',
    border: 'border-emerald-800/30',
  },
];

const FEATURES = [
  { icon: <Terminal size={16} className="text-emerald-400" />, title: 'Built-in Git client', desc: 'Clone, commit, push, pull — all without the terminal.' },
  { icon: <Cpu size={16} className="text-blue-400" />, title: 'Offline code execution', desc: 'Python, Node.js, Go, Rust, Java — bundled runtimes.' },
  { icon: <Package size={16} className="text-orange-400" />, title: 'Zip extraction', desc: 'Drag & drop zip files to extract into any repository.' },
  { icon: <Globe size={16} className="text-teal-400" />, title: 'Pages preview', desc: 'Preview Jit Pages sites locally before publishing.' },
  { icon: <Smartphone size={16} className="text-pink-400" />, title: 'Mobile-optimized UI', desc: 'Touch-friendly interface for Android and ChromeOS.' },
  { icon: <Monitor size={16} className="text-gray-400" />, title: 'Dark & light themes', desc: 'System-adaptive theming with custom color options.' },
];

export default function DownloadsPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-gray-900 to-gray-950 border-b border-gray-800 py-14">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-950/60 border border-teal-800/50 rounded-full text-sm text-teal-400 mb-6">
            <Monitor size={12} /> Desktop App
          </div>
          <h1 className="text-4xl font-black mb-3">Download Git or Jit?</h1>
          <p className="text-gray-400 max-w-xl mx-auto">
            A fully-featured Git client, code editor, and issue manager — native apps for every major platform.
          </p>
        </div>
      </div>

      {/* Desktop features */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {FEATURES.map(f => (
            <div key={f.title} className="flex items-start gap-3 bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center shrink-0">{f.icon}</div>
              <div>
                <p className="text-sm font-medium text-white">{f.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Downloads */}
        <h2 className="text-2xl font-bold mb-6">All platforms</h2>
        <div className="space-y-4">
          {DOWNLOADS.map(d => (
            <div key={d.os} className={`bg-gradient-to-br ${d.color} border ${d.border} rounded-2xl p-6`}>
              <div className="flex items-start gap-4">
                <span className="text-3xl mt-1">{d.icon}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white text-lg">{d.os}</h3>
                  <p className="text-sm text-gray-400 mb-4">{d.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {d.formats.map(fmt => (
                      <div key={fmt.tag} className="relative">
                        {fmt.code ? (
                          <div className="bg-gray-950/60 border border-gray-700 rounded-lg px-3 py-2">
                            <p className="text-xs text-gray-500 mb-1">{fmt.label}</p>
                            <code className="text-xs font-mono text-emerald-400">{fmt.code}</code>
                          </div>
                        ) : (
                          <button
                            onClick={() => alert(`Git or Jit? Desktop v1.0.0 — ${fmt.label}\n\nDownload link will be available when the desktop app releases.\n\nSign up to be notified at launch!`)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                              fmt.recommended
                                ? 'bg-emerald-700 hover:bg-emerald-600 text-white'
                                : 'bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300'
                            }`}
                          >
                            <Download size={13} />
                            {fmt.label}
                            {fmt.size && <span className="text-xs opacity-70">{fmt.size}</span>}
                            {fmt.recommended && (
                              <span className="flex items-center gap-0.5 text-xs bg-emerald-900/50 px-1.5 py-0.5 rounded">
                                <CheckCircle size={9} /> Recommended
                              </span>
                            )}
                          </button>
                        )}
                        {fmt.note && (
                          <p className="text-xs text-gray-600 mt-1 ml-1">{fmt.note}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Notice */}
        <div className="mt-8 bg-yellow-950/30 border border-yellow-800/40 rounded-xl p-5 text-sm text-yellow-300">
          <p className="font-medium mb-1">Desktop app coming soon</p>
          <p className="text-yellow-600 text-xs">The Git or Jit? desktop app is currently in development. Download buttons will activate at launch. Sign up to be notified!</p>
        </div>
      </div>
    </div>
  );
}
