"use client";

import { useEffect, useState } from "react";
import { Download, X, Share, Smartphone, Globe } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pearl_install_dismissed";
const DISMISS_DAYS = 7;
const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.franciscocucullu.pearl";

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

function isAndroid(): boolean {
  if (typeof window === "undefined") return false;
  return /Android/.test(navigator.userAgent);
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [iosExpanded, setIosExpanded] = useState(false);
  const [android, setAndroid] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Allow resetting the 7-day dismissal from any device via ?reinstall.
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.has("reinstall")) localStorage.removeItem(DISMISS_KEY);
    }

    if (isStandalone() || isDismissed()) return;

    if (isIOS()) {
      setShowIOSGuide(true);
      setVisible(true);
      return;
    }

    // Android: the native Google Play app is always available, so show the
    // chooser right away. The PWA option lights up once beforeinstallprompt fires.
    if (isAndroid()) {
      setAndroid(true);
      setVisible(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function remember() {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  }

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      remember();
      setVisible(false);
    }
    setDeferredPrompt(null);
  }

  function handleGetNative() {
    remember();
    window.open(PLAY_STORE_URL, "_blank", "noopener,noreferrer");
    setVisible(false);
  }

  function handleDismiss() {
    remember();
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="bg-surface rounded-2xl border border-border p-4 flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-pearl/15 flex items-center justify-center shrink-0">
        <Download className="w-5 h-5 text-pearl" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold mb-0.5">Get Pearl</p>

        {showIOSGuide ? (
          iosExpanded ? (
            <div className="space-y-3 mt-1">
              <div className="flex items-start gap-2">
                <span className="bg-pearl text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">1</span>
                <p className="text-xs text-muted">Tap the <Share className="w-3.5 h-3.5 inline -mt-0.5 text-foreground" /> <span className="font-medium text-foreground">Share</span> button in Safari</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-pearl text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">2</span>
                <p className="text-xs text-muted">Scroll down and tap <span className="font-medium text-foreground">&quot;Add to Home Screen&quot;</span></p>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-pearl text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">3</span>
                <p className="text-xs text-muted">Tap <span className="font-medium text-foreground">&quot;Add&quot;</span> to confirm</p>
              </div>
              <p className="text-[10px] text-muted">Pearl will appear on your home screen like a regular app!</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted mb-2">Add to your home screen for the best experience</p>
              <button
                onClick={() => setIosExpanded(true)}
                className="bg-pearl text-white text-xs font-medium px-4 py-1.5 rounded-lg hover:bg-pearl-light transition-colors"
              >
                Show me how
              </button>
            </>
          )
        ) : android ? (
          <>
            <p className="text-xs text-muted mb-2.5">Choose how you&apos;d like to use it</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleGetNative}
                className="bg-pearl text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-pearl-light transition-colors flex items-center gap-2"
              >
                <Smartphone className="w-4 h-4 shrink-0" />
                <span className="flex flex-col items-start leading-tight">
                  <span>Get the Android app</span>
                  <span className="text-[10px] font-normal opacity-80">Google Play · push notifications</span>
                </span>
              </button>
              {deferredPrompt && (
                <button
                  onClick={handleInstall}
                  className="border border-border text-foreground text-xs font-medium px-4 py-2 rounded-lg hover:bg-pearl/10 transition-colors flex items-center gap-2"
                >
                  <Globe className="w-4 h-4 shrink-0 text-pearl" />
                  <span>Install as web app (PWA)</span>
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <p className="text-xs text-muted mb-2">Install the app for the best experience</p>
            <div className="flex flex-col gap-2">
              {deferredPrompt && (
                <button
                  onClick={handleInstall}
                  className="bg-pearl text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-pearl-light transition-colors flex items-center gap-2"
                >
                  <Globe className="w-4 h-4 shrink-0" />
                  <span>Install as web app</span>
                </button>
              )}
              <a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={remember}
                className="text-[11px] text-muted hover:text-foreground inline-flex items-center gap-1"
              >
                <Smartphone className="w-3.5 h-3.5" /> Get the Android app on Google Play →
              </a>
            </div>
          </>
        )}
      </div>
      <button onClick={handleDismiss} className="p-1 text-muted hover:text-foreground shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
