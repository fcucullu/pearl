import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BottomNav } from "@/components/bottom-nav";
import { SessionTracker } from "@/components/session-tracker";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <SessionTracker />
      <main className="max-w-lg mx-auto px-4 py-6">{children}</main>
      <BottomNav />
    </div>
  );
}
