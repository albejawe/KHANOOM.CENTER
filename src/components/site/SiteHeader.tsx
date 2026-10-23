import Link from "next/link";
import { ArrowRight, Store } from "lucide-react";

interface Props {
  title?: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
}

export default function SiteHeader({
  title = "مجمع خانم",
  subtitle = "أزياء نسائية • ملابس أطفال • كوزمتكس",
  backHref,
  backLabel = "رجوع",
}: Props) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
        {backHref ? (
          <Link
            href={backHref}
            className="h-11 px-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 text-xs font-bold flex items-center gap-2 transition"
          >
            <ArrowRight className="w-4 h-4" />
            <span>{backLabel}</span>
          </Link>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 shadow-xs">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 text-lg leading-tight block">
                {title}
              </span>
              <span className="text-[11px] font-medium text-slate-500 block">
                {subtitle}
              </span>
            </div>
          </div>
        )}

        {backHref && (
          <div className="text-end">
            <span className="font-bold text-slate-900 text-sm block leading-tight">
              {title}
            </span>
            {subtitle && (
              <span className="text-[10px] text-slate-400 block truncate max-w-[160px]">
                {subtitle}
              </span>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
