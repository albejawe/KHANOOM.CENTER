import Link from "next/link";
import { getSession } from "@/lib/session";
import { logoutAction } from "@/app/actions/auth";
import { Package, Layers, Ruler, LogOut, ExternalLink, Store } from "lucide-react";

export const instant = false;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // If no session (e.g. login page), render child directly without admin shell
  if (!session) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-24 md:pb-12">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur border-b border-slate-800 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-white text-base block leading-tight">
              مجمع خانم
            </span>
            <span className="text-[11px] text-slate-400">لوحة الإدارة</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            target="_blank"
            className="h-9 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition border border-slate-700/60"
          >
            <span>عرض المعرض</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <form action={logoutAction}>
            <button
              type="submit"
              title="تسجيل الخروج"
              className="h-9 w-9 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center transition border border-rose-500/20"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6">
        {children}
      </main>

      {/* Bottom Navigation for Mobile & Desktop */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur border-t border-slate-800 px-4 py-2">
        <div className="max-w-md mx-auto grid grid-cols-3 gap-2">
          <Link
            href="/admin"
            className="flex flex-col items-center justify-center py-1.5 px-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition"
          >
            <Package className="w-5 h-5 mb-0.5" />
            <span className="text-xs font-medium">المنتجات</span>
          </Link>

          <Link
            href="/admin/categories"
            className="flex flex-col items-center justify-center py-1.5 px-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition"
          >
            <Layers className="w-5 h-5 mb-0.5" />
            <span className="text-xs font-medium">الأقسام والفئات</span>
          </Link>

          <Link
            href="/admin/sizes"
            className="flex flex-col items-center justify-center py-1.5 px-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition"
          >
            <Ruler className="w-5 h-5 mb-0.5" />
            <span className="text-xs font-medium">القياسات</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
