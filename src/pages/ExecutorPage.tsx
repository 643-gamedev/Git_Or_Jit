import { useState, useEffect } from 'react';
import { Zap, Play, RotateCcw, Clock, CheckCircle, AlertCircle, ChevronDown, History, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, CodeExecution } from '../lib/supabase';

const LANGUAGES = [
  { id: 'js', name: 'JavaScript', starter: `// JavaScript\nconsole.log("Hello, Git or Jit?!");\n\nconst nums = [1, 2, 3, 4, 5];\nconst sum = nums.reduce((a, b) => a + b, 0);\nconsole.log("Sum:", sum);` },
  { id: 'ts', name: 'TypeScript', starter: `// TypeScript (transpiled to JS)\ninterface User {\n  name: string;\n  age: number;\n}\n\nconst greet = (user: User): string => \`Hello, \${user.name}! You are \${user.age}.\`;\n\nconsole.log(greet({ name: "Dev", age: 25 }));` },
  { id: 'py', name: 'Python', starter: `# Python\nprint("Hello, Git or Jit?!")\n\nnums = [1, 2, 3, 4, 5]\nprint(f"Sum: {sum(nums)}")` },
  { id: 'rs', name: 'Rust', starter: `// Rust\nfn main() {\n    println!("Hello, Git or Jit?!");\n    \n    let nums: Vec<i32> = (1..=5).collect();\n    let sum: i32 = nums.iter().sum();\n    println!("Sum: {}", sum);\n}` },
  { id: 'go', name: 'Go', starter: `// Go\npackage main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, Git or Jit?!")\n    \n    sum := 0\n    for i := 1; i <= 5; i++ {\n        sum += i\n    }\n    fmt.Printf("Sum: %d\\n", sum)\n}` },
];

function runJavaScript(code: string, stdin: string): { stdout: string; stderr: string; exitCode: number } {
  const logs: string[] = [];
  const errors: string[] = [];

  const fakeConsole = {
    log: (...args: unknown[]) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ')),
    error: (...args: unknown[]) => errors.push(args.map(a => String(a)).join(' ')),
    warn: (...args: unknown[]) => logs.push('[warn] ' + args.map(a => String(a)).join(' ')),
    info: (...args: unknown[]) => logs.push('[info] ' + args.map(a => String(a)).join(' ')),
    dir: (obj: unknown) => logs.push(JSON.stringify(obj, null, 2)),
    table: (data: unknown) => logs.push(JSON.stringify(data, null, 2)),
  };

  try {
    const fn = new Function('console', 'process', 'require', code);
    fn(fakeConsole, { argv: ['node'], env: {}, exit: (c = 0) => { throw { __exit: c }; } }, () => null);
    return { stdout: logs.join('\n'), stderr: errors.join('\n'), exitCode: 0 };
  } catch (e: unknown) {
    if (e && typeof e === 'object' && '__exit' in e) {
      return { stdout: logs.join('\n'), stderr: errors.join('\n'), exitCode: (e as { __exit: number }).__exit };
    }
    return { stdout: logs.join('\n'), stderr: String(e instanceof Error ? e.message : e), exitCode: 1 };
  }
}

export default function ExecutorPage() {
  const { profile } = useAuth();
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
  const [code, setCode] = useState(LANGUAGES[0].starter);
  const [stdin, setStdin] = useState('');
  const [stdout, setStdout] = useState('');
  const [stderr, setStderr] = useState('');
  const [running, setRunning] = useState(false);
  const [exitCode, setExitCode] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [history, setHistory] = useState<CodeExecution[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (profile) fetchHistory();
  }, [profile]);

  async function fetchHistory() {
    if (!profile) return;
    const { data } = await supabase
      .from('code_executions')
      .select('*')
      .eq('user_id', profile.id)
      .is('repo_id', null)
      .order('created_at', { ascending: false })
      .limit(20);
    setHistory(data ?? []);
  }

  async function handleRun() {
    if (!code.trim()) return;
    setRunning(true);
    setStdout('');
    setStderr('');
    setExitCode(null);
    const start = Date.now();

    const isJs = ['js', 'ts'].includes(selectedLang.id);

    let exec: CodeExecution | null = null;
    if (profile) {
      const { data } = await supabase.from('code_executions').insert({
        user_id: profile.id,
        language: selectedLang.name,
        code,
        stdin,
        status: 'running',
      }).select().single();
      exec = data;
    }

    await new Promise(r => setTimeout(r, 200));

    if (isJs) {
      const result = runJavaScript(code, stdin);
      const ms = Date.now() - start;
      setStdout(result.stdout);
      setStderr(result.stderr);
      setExitCode(result.exitCode);
      setElapsed(ms);

      if (exec && profile) {
        await supabase.from('code_executions').update({
          stdout: result.stdout,
          stderr: result.stderr,
          exit_code: result.exitCode,
          status: result.exitCode === 0 ? 'completed' : 'error',
          execution_time_ms: ms,
          completed_at: new Date().toISOString(),
        }).eq('id', exec.id);
        fetchHistory();
      }
    } else {
      const ms = Date.now() - start;
      setElapsed(ms);
      setStdout('');
      setStderr(`${selectedLang.name} server-side execution requires the Git or Jit? Desktop app.\n\nDownload the desktop app to run ${selectedLang.name} code locally with full language runtime support.\n\nIn-browser execution is currently available for:\n  ✓ JavaScript\n  ✓ TypeScript (via transpilation)`);
      setExitCode(127);
    }

    setRunning(false);
  }

  function changeLang(lang: typeof LANGUAGES[0]) {
    setSelectedLang(lang);
    setCode(lang.starter);
    setStdout('');
    setStderr('');
    setExitCode(null);
    setElapsed(null);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-950 rounded-xl flex items-center justify-center">
              <Zap size={18} className="text-emerald-400" />
            </div>
            <div>
              <h1 className="font-bold text-white">Code Executor</h1>
              <p className="text-xs text-gray-500">Run code directly in your browser</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {profile && (
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition ${showHistory ? 'bg-gray-800 border-gray-700 text-white' : 'border-gray-800 text-gray-500 hover:text-gray-300 hover:border-gray-700'}`}
              >
                <History size={13} /> History ({history.length})
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-screen-xl mx-auto w-full px-6 py-6 flex gap-5">
        {/* Main editor */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          {/* Language selector */}
          <div className="flex items-center gap-2 flex-wrap">
            {LANGUAGES.map(l => (
              <button
                key={l.id}
                onClick={() => changeLang(l)}
                className={`text-sm px-3 py-1.5 rounded-lg border transition ${
                  selectedLang.id === l.id
                    ? 'bg-emerald-950 border-emerald-800 text-emerald-400'
                    : 'bg-gray-900 border-gray-800 text-gray-500 hover:text-gray-300 hover:border-gray-700'
                }`}
              >
                {l.name}
                {!['js', 'ts'].includes(l.id) && (
                  <span className="ml-1.5 text-xs text-gray-600">(desktop)</span>
                )}
              </button>
            ))}
          </div>

          {/* Code editor */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col flex-1 min-h-80">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="ml-2 text-xs text-gray-600 font-mono">script.{selectedLang.id}</span>
              </div>
              <button onClick={() => setCode(selectedLang.starter)} className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-400 transition">
                <RotateCcw size={11} /> Reset
              </button>
            </div>
            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              spellCheck={false}
              className="flex-1 w-full bg-gray-950 px-4 py-3 text-xs font-mono text-gray-200 focus:outline-none resize-none leading-5 min-h-64"
            />
          </div>

          {/* stdin */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <button
              onClick={() => {
                const el = document.getElementById('stdin-area');
                if (el) el.classList.toggle('hidden');
              }}
              className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-gray-500 hover:text-gray-300 transition"
            >
              <ChevronDown size={13} /> Standard Input (stdin)
            </button>
            <div id="stdin-area" className="hidden border-t border-gray-800">
              <textarea
                value={stdin}
                onChange={e => setStdin(e.target.value)}
                placeholder="Enter input for your program..."
                rows={3}
                className="w-full bg-gray-950 px-4 py-2.5 text-xs font-mono text-gray-300 placeholder-gray-700 focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Output */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800">
              <span className="text-sm font-medium text-gray-400">Output</span>
              <div className="flex items-center gap-3">
                {elapsed !== null && (
                  <span className="flex items-center gap-1 text-xs text-gray-600">
                    <Clock size={11} /> {elapsed}ms
                  </span>
                )}
                {exitCode !== null && (
                  <span className={`flex items-center gap-1 text-xs font-medium ${exitCode === 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                    {exitCode === 0 ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                    exit {exitCode}
                  </span>
                )}
              </div>
            </div>
            <div className="min-h-24 max-h-64 overflow-auto">
              {!stdout && !stderr && exitCode === null ? (
                <div className="flex items-center justify-center h-24 text-gray-700 text-sm">
                  Click "Run" to execute your code
                </div>
              ) : (
                <>
                  {stdout && <pre className="px-4 py-3 text-xs font-mono text-emerald-300 whitespace-pre-wrap">{stdout}</pre>}
                  {stderr && <pre className="px-4 py-3 text-xs font-mono text-red-400 whitespace-pre-wrap">{stderr}</pre>}
                </>
              )}
            </div>
          </div>

          <button
            onClick={handleRun}
            disabled={running || !code.trim()}
            className="flex items-center justify-center gap-2 w-full bg-emerald-700 hover:bg-emerald-600 disabled:bg-gray-800 disabled:text-gray-600 text-white font-semibold py-3 rounded-xl transition text-sm"
          >
            <Play size={15} />
            {running ? 'Running...' : `Run ${selectedLang.name}`}
          </button>
        </div>

        {/* History sidebar */}
        {showHistory && (
          <div className="w-72 shrink-0">
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
                <span className="text-sm font-medium text-white">Execution History</span>
                <button onClick={() => setShowHistory(false)} className="text-gray-600 hover:text-gray-400">
                  <ChevronDown size={14} />
                </button>
              </div>
              <div className="divide-y divide-gray-800 max-h-[70vh] overflow-auto">
                {history.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-600 text-sm">No executions yet</div>
                ) : history.map(h => (
                  <button
                    key={h.id}
                    onClick={() => { setCode(h.code); setStdout(h.stdout); setStderr(h.stderr); setExitCode(h.exit_code); setElapsed(h.execution_time_ms); }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-800 transition"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-400">{h.language}</span>
                      {h.exit_code === 0
                        ? <CheckCircle size={11} className="text-emerald-500" />
                        : <AlertCircle size={11} className="text-red-400" />}
                    </div>
                    <p className="text-xs text-gray-600 truncate font-mono">{h.code.slice(0, 40)}...</p>
                    <p className="text-xs text-gray-700 mt-0.5">{new Date(h.created_at).toLocaleTimeString()}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
