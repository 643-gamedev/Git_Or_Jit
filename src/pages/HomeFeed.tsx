// src/pages/HomeFeed.tsx

import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase, Repository } from "../lib/supabase";

type Activity = {
  id: string;
  type: "star" | "create";
  repo: Repository;
  user: { username: string };
  created_at: string;
};

export default function HomeFeed() {
  const { profile } = useAuth();
  const [repos, setRepos] = useState<Repository[]>([]);
  const [feed, setFeed] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  if (!profile) return <Navigate to="/auth" />;

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);

    // your repos (sidebar)
    const { data: repoData } = await supabase
      .from("repositories")
      .select("*")
      .eq("owner_id", profile.id)
      .limit(5);

    setRepos(repoData ?? []);

    // FAKE FEED (replace later with real activity table)
    setFeed([
      {
        id: "1",
        type: "create",
        repo: repoData?.[0],
        user: { username: profile.username },
        created_at: "now",
      },
    ]);

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-black text-neon font-mono flex">

      {/* LEFT SIDEBAR */}
      <aside className="w-72 border-r border-neon p-4 hidden lg:block">
        <h2 className="mb-3 text-sm text-green-400">Top repositories</h2>

        <div className="space-y-2">
          {repos.map(r => (
            <Link
              key={r.id}
              to={`/repo/${r.name}`}
              className="block text-sm hover:underline"
            >
              {profile.username}/{r.name}
            </Link>
          ))}
        </div>

        <Link
          to="/new"
          className="block mt-4 border border-neon px-3 py-1 rounded text-center hover:bg-green-900/20"
        >
          + New
        </Link>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-6 max-w-3xl mx-auto">

        <h1 className="text-2xl mb-6">Home</h1>

        {/* ACTION BAR */}
        <div className="flex gap-2 mb-6">
          <button className="border border-neon px-3 py-1 rounded hover:bg-green-900/20">
            Create repo
          </button>
          <button className="border border-neon px-3 py-1 rounded hover:bg-green-900/20">
            New issue
          </button>
        </div>

        {/* FEED */}
        {loading ? (
          <p className="text-green-400">Loading...</p>
        ) : (
          <div className="space-y-4">
            {feed.map(item => (
              <div
                key={item.id}
                className="border border-neon p-4 rounded"
              >
                <p className="text-sm text-green-400 mb-1">
                  {item.user.username} created a repository
                </p>

                <Link
                  to={`/repo/${item.repo?.name}`}
                  className="text-lg hover:underline"
                >
                  {item.repo?.name}
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* RIGHT SIDEBAR */}
      <aside className="w-80 border-l border-neon p-4 hidden xl:block">
        <h2 className="text-sm mb-3">Latest updates</h2>

        <div className="text-sm text-green-400 space-y-2">
          <p>New features coming soon</p>
          <p>Database hosting beta</p>
        </div>
      </aside>
    </div>
  );
}