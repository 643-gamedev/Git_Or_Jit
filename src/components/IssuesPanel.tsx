import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Plus, MessageSquare, Tag, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, Repository, Issue } from '../lib/supabase';

const LABEL_COLORS: Record<string, string> = {
  bug: 'bg-red-950 text-red-400 border-red-900',
  enhancement: 'bg-blue-950 text-blue-400 border-blue-900',
  question: 'bg-yellow-950 text-yellow-400 border-yellow-900',
  documentation: 'bg-teal-950 text-teal-400 border-teal-900',
  duplicate: 'bg-gray-800 text-gray-400 border-gray-700',
  'good first issue': 'bg-emerald-950 text-emerald-400 border-emerald-900',
  'help wanted': 'bg-orange-950 text-orange-400 border-orange-900',
};

type Props = { repo: Repository };

export default function IssuesPanel({ repo }: Props) {
  const { profile } = useAuth();
  const [issues, setIssues] = useState<(Issue & { author: { username: string } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<'open' | 'closed'>('open');
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newLabels, setNewLabels] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetchIssues(); }, [state]);

  async function fetchIssues() {
    setLoading(true);
    const { data } = await supabase
      .from('issues')
      .select('*, author:profiles(username, display_name, avatar_url)')
      .eq('repo_id', repo.id)
      .eq('state', state)
      .order('created_at', { ascending: false });
    setIssues((data ?? []) as (Issue & { author: { username: string } })[]);
    setLoading(false);
  }

  async function createIssue() {
    if (!profile || !newTitle.trim()) return;
    setCreating(true);

    const { data: maxNum } = await supabase
      .from('issues')
      .select('number')
      .eq('repo_id', repo.id)
      .order('number', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextNum = (maxNum?.number ?? 0) + 1;

    await supabase.from('issues').insert({
      repo_id: repo.id,
      author_id: profile.id,
      number: nextNum,
      title: newTitle.trim(),
      body: newBody.trim(),
      labels: newLabels,
      state: 'open',
    });

    setNewTitle('');
    setNewBody('');
    setNewLabels([]);
    setShowNew(false);
    setCreating(false);
    fetchIssues();
  }

  async function toggleIssue(issue: Issue) {
    const newState = issue.state === 'open' ? 'closed' : 'open';
    await supabase.from('issues').update({ state: newState, closed_at: newState === 'closed' ? new Date().toISOString() : null }).eq('id', issue.id);
    fetchIssues();
  }

  const toggleLabel = (label: string) => setNewLabels(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]);

  return (
    <div className="max-w-4xl">
      {/* Controls */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          {(['open', 'closed'] as const).map(s => (
            <button
              key={s}
              onClick={() => setState(s)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm transition ${state === s ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}
            >
              {s === 'open' ? <AlertCircle size={13} className="text-emerald-500" /> : <CheckCircle size={13} className="text-gray-500" />}
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        {profile && (
          <button
            onClick={() => setShowNew(!showNew)}
            className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-sm px-4 py-2 rounded-lg transition font-medium"
          >
            <Plus size={14} /> New issue
          </button>
        )}
      </div>

      {/* New issue form */}
      {showNew && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Create new issue</h3>
            <button onClick={() => setShowNew(false)} className="text-gray-600 hover:text-gray-400"><X size={16} /></button>
          </div>
          <input
            type="text"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Issue title"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 mb-3"
          />
          <textarea
            value={newBody}
            onChange={e => setNewBody(e.target.value)}
            placeholder="Describe the issue..."
            rows={4}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 mb-3 resize-none"
          />
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2 flex items-center gap-1"><Tag size={11} /> Labels</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(LABEL_COLORS).map(l => (
                <button
                  key={l}
                  onClick={() => toggleLabel(l)}
                  className={`text-xs px-2 py-0.5 rounded-full border transition ${newLabels.includes(l) ? LABEL_COLORS[l] : 'bg-gray-800 text-gray-500 border-gray-700 hover:border-gray-600'}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={createIssue}
              disabled={creating || !newTitle.trim()}
              className="bg-emerald-700 hover:bg-emerald-600 disabled:bg-gray-800 disabled:text-gray-600 text-white text-sm px-5 py-2 rounded-lg transition"
            >
              {creating ? 'Creating...' : 'Submit issue'}
            </button>
            <button onClick={() => setShowNew(false)} className="text-sm text-gray-500 hover:text-gray-300 px-4 py-2 transition">Cancel</button>
          </div>
        </div>
      )}

      {/* Issues list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-900 border border-gray-800 rounded-xl animate-pulse" />)}
        </div>
      ) : issues.length === 0 ? (
        <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-xl">
          <AlertCircle size={32} className="mx-auto mb-3 text-gray-700" />
          <p className="text-gray-500">No {state} issues</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden divide-y divide-gray-800">
          {issues.map(issue => (
            <div key={issue.id} className="flex items-start gap-3 p-4 hover:bg-gray-800/50 transition">
              <button onClick={() => toggleIssue(issue)} className="mt-0.5 shrink-0">
                {issue.state === 'open'
                  ? <AlertCircle size={16} className="text-emerald-500" />
                  : <CheckCircle size={16} className="text-gray-600" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-white hover:text-emerald-400 cursor-pointer text-sm">{issue.title}</span>
                  {issue.labels.map(l => (
                    <span key={l} className={`text-xs px-1.5 py-0.5 rounded-full border ${LABEL_COLORS[l] ?? 'bg-gray-800 text-gray-400 border-gray-700'}`}>{l}</span>
                  ))}
                </div>
                <p className="text-xs text-gray-600 mt-0.5">
                  #{issue.number} opened {new Date(issue.created_at).toLocaleDateString()} by {(issue.author as { username: string })?.username}
                </p>
              </div>
              {issue.comment_count > 0 && (
                <div className="flex items-center gap-1 text-xs text-gray-600 shrink-0">
                  <MessageSquare size={12} /> {issue.comment_count}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
