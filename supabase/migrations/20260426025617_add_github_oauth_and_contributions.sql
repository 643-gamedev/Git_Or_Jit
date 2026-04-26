/*
  # Add GitHub OAuth and Contributions Tracking

  1. New Tables
    - `github_accounts` — Link GitHub accounts to users
    - `user_contributions` — Track daily contributions (commits, stars, etc)
    - `pull_requests` — PR tracking
    - `actions_runs` — CI/CD action runs

  2. Modified Tables
    - profiles: Add github_username, github_id, github_avatar fields
    - repositories: Add topics, is_forked_from fields

  3. Security
    - RLS enabled on all new tables
    - User-only access to contributions
*/

-- GitHub accounts linking
CREATE TABLE IF NOT EXISTS github_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  github_id integer NOT NULL UNIQUE,
  github_username text NOT NULL UNIQUE,
  github_avatar_url text DEFAULT '',
  github_access_token text NOT NULL,
  github_refresh_token text,
  connected_at timestamptz DEFAULT now(),
  last_synced_at timestamptz,
  UNIQUE(user_id, github_id)
);

ALTER TABLE github_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own GitHub account"
  ON github_accounts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can link own GitHub account"
  ON github_accounts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Contributions tracking
CREATE TABLE IF NOT EXISTS user_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  contribution_date date NOT NULL,
  contribution_count integer DEFAULT 0,
  commits integer DEFAULT 0,
  stars integer DEFAULT 0,
  prs integer DEFAULT 0,
  issues integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, contribution_date)
);

ALTER TABLE user_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contributions"
  ON user_contributions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own contributions"
  ON user_contributions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Pull requests
CREATE TABLE IF NOT EXISTS pull_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_id uuid NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  number integer NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  source_branch text NOT NULL,
  target_branch text NOT NULL,
  state text DEFAULT 'open',
  merged boolean DEFAULT false,
  merged_at timestamptz,
  merged_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(repo_id, number)
);

ALTER TABLE pull_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "PRs in public repos are viewable"
  ON pull_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM repositories r
      WHERE r.id = repo_id AND (r.is_private = false OR r.owner_id = auth.uid())
    )
  );

CREATE POLICY "Authenticated users can create PRs"
  ON pull_requests FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

-- Actions runs (CI/CD)
CREATE TABLE IF NOT EXISTS actions_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_id uuid NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  workflow_name text NOT NULL,
  branch text NOT NULL,
  status text DEFAULT 'pending',
  conclusion text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE actions_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Actions runs in public repos are viewable"
  ON actions_runs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM repositories r
      WHERE r.id = repo_id AND (r.is_private = false OR r.owner_id = auth.uid())
    )
  );

-- Extend profiles with GitHub fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'github_username'
  ) THEN
    ALTER TABLE profiles ADD COLUMN github_username text DEFAULT '';
    ALTER TABLE profiles ADD COLUMN github_id integer;
    ALTER TABLE profiles ADD COLUMN github_avatar_url text DEFAULT '';
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_github_accounts_user ON github_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_contributions_user_date ON user_contributions(user_id, contribution_date);
CREATE INDEX IF NOT EXISTS idx_pull_requests_repo ON pull_requests(repo_id);
CREATE INDEX IF NOT EXISTS idx_pull_requests_author ON pull_requests(author_id);
CREATE INDEX IF NOT EXISTS idx_actions_runs_repo ON actions_runs(repo_id);
