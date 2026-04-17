"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "pearl_ttc_mode";

export function useTTCMode(): [boolean, (v: boolean) => void] {
  const [ttcMode, setTtcModeState] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "true") setTtcModeState(true);
    } catch {
      // SSR or storage unavailable
    }
  }, []);

  function setTtcMode(v: boolean) {
    setTtcModeState(v);
    try {
      localStorage.setItem(STORAGE_KEY, String(v));
    } catch {
      // storage unavailable
    }
  }

  return [ttcMode, setTtcMode];
}
