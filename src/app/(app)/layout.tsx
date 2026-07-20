import { requireUser } from "@/lib/session";
import { Sidebar } from "@/components/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="min-h-screen md:flex">
      <Sidebar name={user.name ?? user.email ?? "Usuario"} role={user.role} />
      <main className="flex-1 md:pl-60">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10">{children}</div>
      </main>
    </div>
  );
}
