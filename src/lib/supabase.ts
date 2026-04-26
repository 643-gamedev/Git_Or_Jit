import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  website: string;
  location: string;
  is_pro: boolean;
  repo_count: number;
  follower_count: number;
  following_count: number;
  created_at: string;
  updated_at: string;
};

export type Repository = {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  is_private: boolean;
  is_fork: boolean;
  forked_from: string | null;
  default_branch: string;
  topics: string[];
  language: string;
  license: string;
  star_count: number;
  fork_count: number;
  issue_count: number;
  watcher_count: number;
  size_kb: number;
  has_pages: boolean;
  pages_url: string;
  pages_branch: string;
  created_at: string;
  updated_at: string;
  owner?: Profile;
};

export type RepositoryFile = {
  id: string;
  repo_id: string;
  branch: string;
  path: string;
  name: string;
  type: 'file' | 'directory';
  content: string;
  size_bytes: number;
  encoding: string;
  commit_message: string;
  committed_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Issue = {
  id: string;
  repo_id: string;
  author_id: string;
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  labels: string[];
  comment_count: number;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  author?: Profile;
};

export type CodeExecution = {
  id: string;
  user_id: string;
  repo_id: string | null;
  file_path: string;
  language: string;
  code: string;
  stdin: string;
  stdout: string;
  stderr: string;
  exit_code: number | null;
  status: 'pending' | 'running' | 'completed' | 'error' | 'timeout';
  execution_time_ms: number | null;
  created_at: string;
  completed_at: string | null;
};

export type Notification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  link: string;
  is_read: boolean;
  created_at: string;
};

export type GitHubAccount = {
  id: string;
  user_id: string;
  github_id: number;
  github_username: string;
  github_avatar_url: string;
  connected_at: string;
  last_synced_at: string | null;
};

export type Contribution = {
  id: string;
  user_id: string;
  contribution_date: string;
  contribution_count: number;
  commits: number;
  stars: number;
  prs: number;
  issues: number;
  created_at: string;
};

export type PullRequest = {
  id: string;
  repo_id: string;
  author_id: string;
  number: number;
  title: string;
  description: string;
  source_branch: string;
  target_branch: string;
  state: 'open' | 'closed' | 'merged';
  merged: boolean;
  merged_at: string | null;
  merged_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ActionRun = {
  id: string;
  repo_id: string;
  workflow_name: string;
  branch: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  conclusion: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
};
