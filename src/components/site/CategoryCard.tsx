import Link from "next/link";
import { imageUrl } from "@/lib/images";
import { ChevronLeft } from "lucide-react";

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
}: Props) {
  const hasImage = Boolean(imageKey);

  return (
    <Link
      href={href}
      className="group relative flex flex-col justify-end h-44 sm:h-52 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition active:scale-[0.98] border border-slate-200/80 bg-slate-900"
    >
      {/* Background Image or Stylish Gradient */}
      {hasImage ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl(imageKey!, "thumb")}
            alt={name}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-90"
          />
          {/* Dark gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-rose-900/40 via-slate-900 to-slate-950" />
      )}

      {/* Content */}
      <div className="relative z-10 p-4 flex items-end justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white leading-tight drop-shadow-sm">
            {name}
          </h2>
          {countLabel && (
            <span className="text-xs font-semibold text-rose-300 drop-shadow-sm mt-0.5 block">
              {countLabel}
            </span>
          )}
        </div>

        <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center shrink-0 group-hover:-translate-x-1 transition shadow-sm border border-white/20">
          <ChevronLeft className="w-5 h-5" />
        </div>
      </div>
    </Link>
  );
}
