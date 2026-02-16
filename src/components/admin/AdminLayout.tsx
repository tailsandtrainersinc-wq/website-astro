import type { ReactNode } from "react";

interface AdminLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
}

export default function AdminLayout({ sidebar, children }: AdminLayoutProps) {
  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      {sidebar}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
