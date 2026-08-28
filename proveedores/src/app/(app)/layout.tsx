import { requireUser } from "@/lib/session";
import { Sidebar } from "@/components/Sidebar";
import { AnimatedBackground } from "@/components/AnimatedBackground";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground density={0.75} />
      <div className="relative z-[2] md:flex md:items-start md:gap-[18px] md:p-[18px] min-h-screen">
        <Sidebar name={user.name ?? user.email ?? "Usuario"} isAdmin={user.isAdmin} />
        <main className="flex-1 min-w-0 px-4 sm:px-8 py-6 md:py-10">
          <div className="max-w-5xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
