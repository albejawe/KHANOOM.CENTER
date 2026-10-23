"use client";

export default function PreviewError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div dir="rtl" className="min-h-screen bg-slate-50 flex justify-center items-center px-7 text-slate-800">
    <div className="max-w-sm text-center space-y-5">
      <h2 className="text-xl font-semibold">صار خلل بسيط بالتحميل</h2>
      <p className="text-sm text-slate-600">تأكدي من الإنترنت وجربي مرة ثانية.</p>
      <button type="button" onClick={reset} className="bg-slate-900 text-white rounded-xl px-8 py-3 text-sm font-medium active:scale-95">إعادة المحاولة</button>
    </div>
  </div>;
}
