"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const SESSION_KEY = "pearl_last_session";
const MIN_INTERVAL_MS = 60 * 60 * 1000; // 1 hour between pings

export function SessionTracker() {
  useEffect(() => {
    async function ping() {
      const last = localStorage.getItem(SESSION_KEY);
      if (last && Date.now() - parseInt(last, 10) < MIN_INTERVAL_MS) return;

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("pearl_sessions").insert({ user_id: user.id });
      localStorage.setItem(SESSION_KEY, Date.now().toString());
    }

    ping();
  }, []);

  return null;
}
