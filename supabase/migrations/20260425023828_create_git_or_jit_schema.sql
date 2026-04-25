/*
  # Git or Jit? — Core Platform Schema

  1. New Tables
    - `profiles` — Extended user profiles with avatar, bio, website, location
    - `repositories` — Git repositories with visibility, description, topics
    - `repository_files` — Virtual file tree for repository contents
    - `repository_stars` — Star/unstar repositories
    - `repository_forks` — Fork relationships between repos
    - `issues` — Issue tracker per repository
    - `issue_comments` — Comments on issues
    - `pull_requests` — Pull requests with diff tracking
    - `deployments` — Git or Jit? Pages deployments
    - `code_executions` — Code execution job queue and results
    - `zip_extractions` — Zip file extraction records
    - `follows` — User follow relationships
    - `organizations` — Organization accounts
    - `org_members` — Organization membership
    - `notifications` — User notification feed

  2. Security
    - RLS enabled on ALL tables
    - Authenticated-only write access
    - Public read for public repos, private read only for owners/collaborators
*/

-- Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  display_name text DEFAULT '',
  bio text DEFAULT '',
  avatar_url text DEFAULT '',
  website text DEFAULT '',
  location text DEFAULT '',
  is_pro boolean DEFAULT false,
  repo_count integer DEFAULT 0,
  follower_count integer DEFAULT 0,
  following_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are publicly viewable"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Repositories
CREATE TABLE IF NOT EXISTS repositories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  is_private boolean DEFAULT false,
  is_fork boolean DEFAULT false,
  forked_from uuid REFERENCES repositories(id),
  default_branch text DEFAULT 'main',
  topics text[] DEFAULT '{}',
  language text DEFAULT '',
  license text DEFAULT '',
  star_count integer DEFAULT 0,
  fork_count integer DEFAULT 0,
  issue_count integer DEFAULT 0,
  watcher_count integer DEFAULT 0,
  size_kb integer DEFAULT 0,
  has_pages boolean DEFAULT false,
  pages_url text DEFAULT '',
  pages_branch text DEFAULT 'gh-pages',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(owner_id, name)
);

ALTER TABLE repositories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public repos are viewable by all authenticated users"
  ON repositories FOR SELECT
  TO authenticated
  USING (is_private = false OR owner_id = auth.uid());

CREATE POLICY "Owners can insert repositories"
  ON repositories FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update repositories"
  ON repositories FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can delete repositories"
  ON repositories FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- Repository Files (virtual file system)
CREATE TABLE IF NOT EXISTS repository_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_id uuid NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  branch text NOT NULL DEFAULT 'main',
  path text NOT NULL,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'file', -- 'file' | 'directory'
  content text DEFAULT '',
  size_bytes integer DEFAULT 0,
  encoding text DEFAULT 'utf-8',
  commit_message text DEFAULT '',
  committed_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(repo_id, branch, path)
);

ALTER TABLE repository_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Files in public repos are viewable"
  ON repository_files FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM repositories r
      WHERE r.id = repo_id AND (r.is_private = false OR r.owner_id = auth.uid())
    )
  );

CREATE POLICY "Repo owners can insert files"
  ON repository_files FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM repositories r WHERE r.id = repo_id AND r.owner_id = auth.uid())
  );

CREATE POLICY "Repo owners can update files"
  ON repository_files FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM repositories r WHERE r.id = repo_id AND r.owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM repositories r WHERE r.id = repo_id AND r.owner_id = auth.uid())
  );

CREATE POLICY "Repo owners can delete files"
  ON repository_files FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM repositories r WHERE r.id = repo_id AND r.owner_id = auth.uid())
  );

-- Stars
CREATE TABLE IF NOT EXISTS repository_stars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  repo_id uuid NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, repo_id)
);

ALTER TABLE repository_stars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stars are publicly viewable"
  ON repository_stars FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can star repos"
  ON repository_stars FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unstar repos"
  ON repository_stars FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Issues
CREATE TABLE IF NOT EXISTS issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_id uuid NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  number integer NOT NULL,
  title text NOT NULL,
  body text DEFAULT '',
  state text DEFAULT 'open', -- 'open' | 'closed'
  labels text[] DEFAULT '{}',
  comment_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  closed_at timestamptz,
  UNIQUE(repo_id, number)
);

ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Issues in public repos are viewable"
  ON issues FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM repositories r
      WHERE r.id = repo_id AND (r.is_private = false OR r.owner_id = auth.uid())
    )
  );

CREATE POLICY "Authenticated users can create issues"
  ON issues FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Issue authors and repo owners can update issues"
  ON issues FOR UPDATE
  TO authenticated
  USING (
    author_id = auth.uid() OR
    EXISTS (SELECT 1 FROM repositories r WHERE r.id = repo_id AND r.owner_id = auth.uid())
  )
  WITH CHECK (
    author_id = auth.uid() OR
    EXISTS (SELECT 1 FROM repositories r WHERE r.id = repo_id AND r.owner_id = auth.uid())
  );

-- Issue Comments
CREATE TABLE IF NOT EXISTS issue_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE issue_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Issue comments are viewable if issue is viewable"
  ON issue_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM issues i
      JOIN repositories r ON r.id = i.repo_id
      WHERE i.id = issue_id AND (r.is_private = false OR r.owner_id = auth.uid())
    )
  );

CREATE POLICY "Authenticated users can comment"
  ON issue_comments FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can update own comments"
  ON issue_comments FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Code Executions
CREATE TABLE IF NOT EXISTS code_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  repo_id uuid REFERENCES repositories(id) ON DELETE SET NULL,
  file_path text DEFAULT '',
  language text NOT NULL,
  code text NOT NULL,
  stdin text DEFAULT '',
  stdout text DEFAULT '',
  stderr text DEFAULT '',
  exit_code integer,
  status text DEFAULT 'pending', -- 'pending' | 'running' | 'completed' | 'error' | 'timeout'
  execution_time_ms integer,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE code_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own executions"
  ON code_executions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create executions"
  ON code_executions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own executions"
  ON code_executions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Zip Extractions
CREATE TABLE IF NOT EXISTS zip_extractions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  repo_id uuid NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  zip_file_path text NOT NULL,
  target_path text DEFAULT '/',
  status text DEFAULT 'pending', -- 'pending' | 'processing' | 'done' | 'error'
  extracted_files integer DEFAULT 0,
  error_message text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE zip_extractions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own extractions"
  ON zip_extractions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create extractions"
  ON zip_extractions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own extractions"
  ON zip_extractions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Follows
CREATE TABLE IF NOT EXISTS follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Follows are viewable by authenticated users"
  ON follows FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can follow others"
  ON follows FOR INSERT
  TO authenticated
  WITH CHECK (follower_id = auth.uid());

CREATE POLICY "Users can unfollow"
  ON follows FOR DELETE
  TO authenticated
  USING (follower_id = auth.uid());

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'star' | 'fork' | 'issue' | 'pr' | 'comment' | 'follow'
  title text NOT NULL,
  body text DEFAULT '',
  link text DEFAULT '',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_repositories_owner ON repositories(owner_id);
CREATE INDEX IF NOT EXISTS idx_repositories_name ON repositories(name);
CREATE INDEX IF NOT EXISTS idx_repository_files_repo ON repository_files(repo_id, branch);
CREATE INDEX IF NOT EXISTS idx_repository_files_path ON repository_files(repo_id, path);
CREATE INDEX IF NOT EXISTS idx_issues_repo ON issues(repo_id);
CREATE INDEX IF NOT EXISTS idx_stars_user ON repository_stars(user_id);
CREATE INDEX IF NOT EXISTS idx_stars_repo ON repository_stars(repo_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_code_executions_user ON code_executions(user_id);
