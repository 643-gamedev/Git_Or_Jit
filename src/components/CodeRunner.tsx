import { useState, useEffect, useRef } from 'react';
import { X, Zap, Terminal, RotateCcw, Clock, CheckCircle, AlertCircle, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, RepositoryFile } from '../lib/supabase';

type Props = {
  file: RepositoryFile;
  repoId: string;
  onClose: () => void;
};

type LangConfig = {
  name: string;
  engine: 'js' | 'sandbox';
  monacoLang: string;
};

const LANG_MAP: Record<string, LangConfig> = {
  js: { name: 'JavaScript', engine: 'js', monacoLang: 'javascript' },
  jsx: { name: 'JavaScript (JSX)', engine: 'js', monacoLang: 'javascript' },
  ts: { name: 'TypeScript', engine: 'js', monacoLang: 'typescript' },
  tsx: { name: 'TypeScript (TSX)', engine: 'js', monacoLang: 'typescript' },
  py: { name: 'Python', engine: 'sandbox', monacoLang: 'python' },
  rs: { name: 'Rust', engine: 'sandbox', monacoLang: 'rust' },
  go: { name: 'Go', engine: 'sandbox', monacoLang: 'go' },
  java: { name: 'Java', engine: 'sandbox', monacoLang: 'java' },
  rb: { name: 'Ruby', engine: 'sandbox', monacoLang: 'ruby' },
  cpp: { name: 'C++', engine: 'sandbox', monacoLang: 'cpp' },
  c: { name: 'C', engine: 'sandbox', monacoLang: 'c' },
  php: { name: 'PHP', engine: 'sandbox', monacoLang: 'php' },
};

function runJavaScript(code: string, stdin: string): { stdout: string; stderr: string; exitCode: number } {
  const logs: string[] = [];
  const errors: string[] = [];
  const stdinLines = stdin.split('\n');
  let stdinIdx = 0;

  const fakeConsole = {
    log: (...args: unknown[]) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ')),
    error: (...args: unknown[]) => errors.push(args.map(a => String(a)).join(' ')),
    warn: (...args: unknown[]) => logs.push('[warn] ' + args.map(a => String(a)).join(' ')),
    info: (...args: unknown[]) => logs.push('[info] ' + args.map(a => String(a)).join(' ')),
    dir: (obj: unknown) => logs.push(JSON.stringify(obj, null, 2)),
    table: (obj: unknown) => logs.push(JSON.stringify(obj, null, 2)),
  };

  const fakeProcess = {
    argv: ['node', 'script.js'],
    env: {},
    exit: (code = 0) => { throw { __exit: code }; },
    stdin: {
      read: () => stdinLines[stdinIdx++] ?? null,
    },
  };

  try {
    const fn = new Function('console', 'process', 'require', code);
    fn(fakeConsole, fakeProcess, () => null);
    return { stdout: logs.join('\n'), stderr: errors.join('\n'), exitCode: 0 };
  } catch (e: unknown) {
    if (e && typeof e === 'object' && '__exit' in e) {
      return { stdout: logs.join('\n'), stderr: errors.join('\n'), exitCode: (e as { __exit: number }).__exit };
    }
    return { stdout: logs.join('\n'), stderr: String(e instanceof Error ? e.message : e), exitCode: 1 };
  }
}

export default function CodeRunner({ file, repoId, onClose }: Props) {
  const { profile } = useAuth();
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const langConfig = LANG_MAP[ext];
  const [code, setCode] = useState(file.content);
  const [stdin, setStdin] = useState('');
  const [stdout, setStdout] = useState('');
  const [stderr, setStderr] = useState('');
  const [running, setRunning] = useState(false);
  const [exitCode, setExitCode] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [showStdin, setShowStdin] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  async function handleRun() {
    if (!profile) return;
    setRunning(true);
    setStdout('');
    setStderr('');
    setExitCode(null);
    const start = Date.now();

    const { data: exec } = await supabase.from('code_executions').insert({
      user_id: profile.id,
      repo_id: repoId,
      file_path: file.path,
      language: langConfig?.name ?? ext,
      code,
      stdin,
      status: 'running',
    }).select().single();

    if (langConfig?.engine === 'js') {
      await new Promise(r => setTimeout(r, 200));
      const result = runJavaScript(code, stdin);
      const ms = Date.now() - start;
      setStdout(result.stdout);
      setStderr(result.stderr);
      setExitCode(result.exitCode);
      setElapsed(ms);

      if (exec) {
        await supabase.from('code_executions').update({
          stdout: result.stdout,
          stderr: result.stderr,
          exit_code: result.exitCode,
          status: result.exitCode === 0 ? 'completed' : 'error',
          execution_time_ms: ms,
          completed_at: new Date().toISOString(),
        }).eq('id', exec.id);
      }
    } else {
      const ms = Date.now() - start + 500;
      setElapsed(ms);
      setStdout('');
      setStderr(`Server-side execution for ${langConfig?.name ?? ext} requires a connected execution backend.\n\nFor local execution, install the Git or Jit? Desktop app which bundles language runtimes for offline code execution.\n\nAvailable runtimes in the desktop app:\n  - Python 3.12\n  - Node.js 20\n  - Go 1.22\n  - Rust (via cargo)\n  - Java 21\n  - Ruby 3.3\n  - PHP 8.3\n  - C/C++ (gcc/g++)`);
      setExitCode(1);

      if (exec) {
        await supabase.from('code_executions').update({
          stderr: 'Server-side execution not configured',
          exit_code: 1,
          status: 'error',
          execution_time_ms: ms,
          completed_at: new Date().toISOString(),
        }).eq('id', exec.id);
      }
    }

    setRunning(false);
  }

  function handleReset() {
    setCode(file.content);
    setStdout('');
    setStderr('');
    setExitCode(null);
    setElapsed(null);
  }

  const hasOutput = stdout || stderr;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-emerald-950 rounded-lg flex items-center justify-center">
              <Zap size={14} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{file.name}</p>
              <p className="text-xs text-gray-500">{langConfig?.name ?? ext} · in-browser executor</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleReset} className="text-gray-500 hover:text-gray-300 p-1.5 rounded hover:bg-gray-800 transition" title="Reset">
              <RotateCcw size={14} />
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-300 p-1.5 rounded hover:bg-gray-800 transition">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Code editor */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              spellCheck={false}
              className="w-full h-full min-h-48 resize-none bg-gray-950 px-4 py-3 text-xs font-mono text-gray-300 focus:outline-none leading-5 border-b border-gray-800"
            />
          </div>

          {/* Stdin toggle */}
          <div className="shrink-0 border-b border-gray-800">
            <button
              onClick={() => setShowStdin(!showStdin)}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 px-4 py-2 transition w-full text-left"
            >
              <Terminal size={12} /> stdin (standard input)
              <ChevronDown size={12} className={`ml-auto transition ${showStdin ? 'rotate-180' : ''}`} />
            </button>
            {showStdin && (
              <textarea
                value={stdin}
                onChange={e => setStdin(e.target.value)}
                placeholder="Enter stdin for your program..."
                rows={3}
                className="w-full bg-gray-950 px-4 py-2 text-xs font-mono text-gray-400 placeholder-gray-700 focus:outline-none resize-none border-t border-gray-800"
              />
            )}
          </div>

          {/* Output */}
          {hasOutput && (
            <div className="shrink-0 max-h-48 overflow-auto border-b border-gray-800">
              <div className="flex items-center gap-2 px-4 py-1.5 bg-gray-900 sticky top-0 border-b border-gray-800">
                <Terminal size={12} className="text-gray-600" />
                <span className="text-xs text-gray-600">Output</span>
                {exitCode !== null && (
                  <span className={`ml-auto flex items-center gap-1 text-xs ${exitCode === 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                    {exitCode === 0 ? <CheckCircle size={11} /> : <AlertCircle size={11} />}
                    exit {exitCode}
                  </span>
                )}
                {elapsed !== null && (
                  <span className="flex items-center gap-1 text-xs text-gray-600 ml-2">
                    <Clock size={11} /> {elapsed}ms
                  </span>
                )}
              </div>
              {stdout && <pre className="px-4 py-2 text-xs font-mono text-emerald-300 whitespace-pre-wrap">{stdout}</pre>}
              {stderr && <pre className="px-4 py-2 text-xs font-mono text-red-400 whitespace-pre-wrap">{stderr}</pre>}
            </div>
          )}

          {/* Run button */}
          <div className="flex items-center gap-3 px-5 py-3 shrink-0">
            <button
              onClick={handleRun}
              disabled={running || !code.trim()}
              className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 disabled:bg-gray-800 disabled:text-gray-600 text-white text-sm font-medium px-5 py-2 rounded-lg transition"
            >
              <Zap size={14} />
              {running ? 'Running...' : 'Run code'}
            </button>
            {langConfig?.engine === 'sandbox' && (
              <p className="text-xs text-gray-600">Full runtime available in <span className="text-teal-500">desktop app</span></p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
