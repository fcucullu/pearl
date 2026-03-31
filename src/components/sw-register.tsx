"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    async function register() {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");

        // Wait a moment for the service worker to be ready
        const ready = await navigator.serviceWorker.ready;

        // Check if already subscribed
        let subscription = await ready.pushManager.getSubscription();

        if (!subscription) {
          // Request permission
          const permission = await Notification.requestPermission();
          if (permission !== "granted") return;

          subscription = await ready.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
          });
        }

        // Send subscription to our API
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user && subscription) {
          const keys = subscription.toJSON().keys;
          await fetch("/api/push/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: user.id,
              endpoint: subscription.endpoint,
              p256dh: keys?.p256dh,
              auth: keys?.auth,
            }),
          });
        }
      } catch (err) {
        console.error("SW registration failed:", err);
      }
    }

    register();
  }, []);

  return null;
}
