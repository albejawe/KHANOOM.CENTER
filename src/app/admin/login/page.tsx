"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";
import { Lock, User, Store } from "lucide-react";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 text-slate-100">
      <div className="w-full max-w-md bg-slate-800/90 backdrop-blur border border-slate-700/60 rounded-3xl p-6 md:p-8 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 mb-4 border border-amber-500/20">
            <Store className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
            مجمع خانم
          </h1>
          <p className="text-sm text-slate-400">
            لوحة الإدارة والتحكم في المنتجات والأقسام
          </p>
        </div>

        {/* Error message */}
        {state?.error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm font-medium text-center">
            {state.error}
          </div>
        )}

        {/* Login Form */}
        <form action={formAction} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              اسم المستخدم
            </label>
            <div className="relative">
              <input
                type="text"
                name="username"
                required
                autoComplete="username"
                defaultValue="ALBEJAWE"
                placeholder="أدخل اسم المستخدم"
                className="w-full h-13 px-4 ps-11 rounded-2xl bg-slate-900/60 border border-slate-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-white placeholder-slate-500 text-base outline-none transition"
              />
              <User className="w-5 h-5 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              كلمة المرور
            </label>
            <div className="relative">
              <input
                type="password"
                name="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full h-13 px-4 ps-11 rounded-2xl bg-slate-900/60 border border-slate-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-white placeholder-slate-500 text-base outline-none transition"
              />
              <Lock className="w-5 h-5 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full h-13 mt-2 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-bold text-base shadow-lg shadow-amber-500/20 transition flex items-center justify-center disabled:opacity-50"
          >
            {isPending ? "جاري الدخول..." : "تسجيل الدخول"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <a
            href="/"
            className="text-xs text-slate-400 hover:text-slate-200 transition inline-flex items-center gap-1.5"
          >
            ← العودة لمعرض الزوار
          </a>
        </div>
      </div>
    </div>
  );
}
