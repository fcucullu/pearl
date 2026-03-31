"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Sparkles, Globe } from "lucide-react";

interface AppEntry {
  slug: string;
  title: string;
  description: string;
  url: string;
  img: string;
  tags: string[];
  status: "live" | "beta" | "offline";
}

const statusConfig = {
  live: { label: "Live", bg: "bg-pearl/10", text: "text-pearl", dot: "bg-pearl" },
  beta: { label: "Beta", bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
  offline: { label: "Offline", bg: "bg-zinc-500/10", text: "text-zinc-400", dot: "bg-zinc-400" },
};

const APPS_API = "https://franciscocucullu.com/api/apps.json";

export default function AppsPage() {
  const [apps, setApps] = useState<AppEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(APPS_API)
      .then((res) => {
        if (!res.ok) throw new Error("fetch failed");
        return res.json();
      })
      .then((data) => setApps(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pearl/10 text-pearl text-[10px] font-medium uppercase tracking-widest mb-4">
          <Sparkles className="w-3 h-3" />
          Indie Dev
        </div>
        <h1 className="text-3xl font-bold text-pearl mb-3">Apps I Build</h1>
        <p className="text-sm text-muted leading-relaxed max-w-xs mx-auto">
          Side projects shipped from scratch. Designed, coded, and maintained solo.
        </p>
      </div>

      <div className="space-y-4">
        {loading && <div className="text-center py-8 text-muted text-sm">Loading apps...</div>}
        {error && (
          <div className="text-center py-8 text-muted text-sm">
            Could not load apps.{" "}
            <a href="https://franciscocucullu.com/apps/" target="_blank" className="text-pearl underline">
              View on website
            </a>
          </div>
        )}
        {apps.map((app) => {
          const status = statusConfig[app.status];
          return (
            <a
              key={app.slug}
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-surface rounded-2xl border border-border hover:border-pearl/20 transition-all duration-300 overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-pearl/10">
                      <Globe className="w-5 h-5 text-pearl" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-base leading-tight">{app.title}</h3>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {app.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-pearl/10 text-muted">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium ${status.bg} ${status.text} shrink-0`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                    {status.label}
                  </span>
                </div>
                <p className="text-xs text-muted leading-relaxed">{app.description}</p>
                <div className="inline-flex items-center gap-1.5 mt-4 text-xs font-medium text-pearl">
                  Open App
                  <ExternalLink className="w-3 h-3" />
                </div>
              </div>
            </a>
          );
        })}
      </div>

      <div className="text-center mt-8 mb-4">
        <a href="https://franciscocucullu.com/apps/" target="_blank" className="text-[11px] text-muted/60 hover:text-pearl transition-colors">
          View all on franciscocucullu.com
        </a>
      </div>
    </div>
  );
}
