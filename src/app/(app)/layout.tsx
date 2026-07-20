import { requireUser } from "@/lib/session";
import { Nav } from "@/components/Nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="flex flex-col min-h-screen">
      <Nav name={user.name ?? user.email ?? "Usuario"} role={user.role} />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
