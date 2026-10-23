import Link from "next/link";
import { imageUrl } from "@/lib/images";
import { ChevronLeft, Sparkles } from "lucide-react";

interface Props {
  href: string;
  name: string;
  countLabel?: string;
  imageKey?: string | null;
  priority?: boolean;
}

export default function CategoryCard({
  href,
  name,
  countLabel,
  imageKey,
  priority = false,
}: Props) {
  const hasImage = Boolean(imageKey);

  return (
    <Link
      href={href}
      className="group relative flex items-center justify-between gap-3 p-3 sm:p-3.5 bg-white hover:bg-slate-50/80 rounded-2xl border border-slate-200/80 hover:border-amber-300/80 shadow-xs hover:shadow-md transition-all duration-200 active:scale-[0.985]"
    >
      {/* Right side: Framed Visual Thumbnail */}
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100/80 relative shadow-2xs">
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl(imageKey!, "thumb")}
            alt={name}
            loading={priority ? "eager" : "lazy"}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-500/10 to-amber-600/20 text-amber-600">
            <Sparkles className="w-7 h-7" />
          </div>
        )}
      </div>

      {/* Center: Prominent, Crystal-Clear Typography */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-amber-700 transition leading-snug">
          {name}
        </h3>

        {countLabel && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="inline-flex items-center text-[11px] sm:text-xs font-bold px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/70">
              {countLabel}
            </span>
          </div>
        )}
      </div>

      {/* Left side: Navigation Indicator */}
      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100/80 border border-slate-200/60 text-slate-400 group-hover:bg-amber-500 group-hover:border-amber-500 group-hover:text-white flex items-center justify-center shrink-0 transition-colors shadow-2xs">
        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
      </div>
    </Link>
  );
}
