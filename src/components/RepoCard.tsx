import { Link } from 'react-router-dom';
import { Star, GitFork, Lock, Globe, Circle } from 'lucide-react';
import { Repository } from '../lib/supabase';

const LANG_COLORS: Record<string, string> = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Rust: '#dea584',
  Go: '#00ADD8',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
};

type Props = {
  repo: Repository;
  showOwner?: boolean;
};

export default function RepoCard({ repo, showOwner }: Props) {
  const ownerSlug = repo.owner?.username ?? repo.owner_id;
  const langColor = LANG_COLORS[repo.language] ?? '#8b949e';
  const ago = timeAgo(repo.updated_at);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition-all duration-200 group">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {showOwner && (
              <Link to={`/${ownerSlug}`} className="text-sm text-gray-400 hover:text-emerald-400 transition truncate">
                {ownerSlug}
              </Link>
            )}
            {showOwner && <span className="text-gray-600">/</span>}
            <Link
              to={`/${ownerSlug}/${repo.name}`}
              className="font-semibold text-emerald-400 hover:text-emerald-300 transition truncate group-hover:underline"
            >
              {repo.name}
            </Link>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${repo.is_private ? 'border-gray-600 text-gray-500' : 'border-emerald-800 text-emerald-600'}`}>
              {repo.is_private ? <><Lock size={10} className="inline mr-1" />Private</> : <><Globe size={10} className="inline mr-1" />Public</>}
            </span>
          </div>

          {repo.description && (
            <p className="text-sm text-gray-400 mt-1.5 line-clamp-2">{repo.description}</p>
          )}

          {repo.topics.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {repo.topics.slice(0, 4).map(t => (
                <span key={t} className="text-xs px-2 py-0.5 bg-teal-950 text-teal-400 rounded-full border border-teal-900/50">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
        {repo.language && (
          <span className="flex items-center gap-1.5">
            <Circle size={10} style={{ fill: langColor, color: langColor }} />
            {repo.language}
          </span>
        )}
        <span className="flex items-center gap-1 hover:text-yellow-400 transition cursor-pointer">
          <Star size={13} />
          {repo.star_count.toLocaleString()}
        </span>
        <span className="flex items-center gap-1">
          <GitFork size={13} />
          {repo.fork_count.toLocaleString()}
        </span>
        <span className="ml-auto">Updated {ago}</span>
      </div>
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}
