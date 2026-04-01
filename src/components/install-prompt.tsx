"use client";

import { useEffect, useState } from "react";
import { Download, X, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pearl_install_dismissed";
const DISMISS_DAYS = 7;

function isDismissed(): boolean {
  if (typeof window === "undefined") return true;
  const dismissed = localStorage.getItem(DISMISS_KEY);
  if (!dismissed) return false;
  const dismissedAt = parseInt(dismissed, 10);
  return Date.now() - dismissedAt < DISMISS_DAYS * 86400000;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  if (typeof window === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone() || isDismissed()) return;

    if (isIOS()) {
      setShowIOSGuide(true);
      setVisible(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    }
    setDeferredPrompt(null);
  }

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="bg-surface rounded-2xl border border-border p-4 flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-pearl/15 flex items-center justify-center shrink-0">
        <Download className="w-5 h-5 text-pearl" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold mb-0.5">Install Pearl</p>
        {showIOSGuide ? (
          <p className="text-xs text-muted leading-relaxed">
            Tap <Share className="w-3 h-3 inline -mt-0.5" /> <span className="font-medium">Share</span> then <span className="font-medium">"Add to Home Screen"</span>
          </p>
        ) : (
          <>
            <p className="text-xs text-muted mb-2">Add to your home screen for the best experience</p>
            <button
              onClick={handleInstall}
              className="bg-pearl text-white text-xs font-medium px-4 py-1.5 rounded-lg hover:bg-pearl-light transition-colors"
            >
              Install
            </button>
          </>
        )}
      </div>
      <button onClick={handleDismiss} className="p-1 text-muted hover:text-foreground shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
