# khanom-center Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** موقع عرض منتجات مجمع خانم (زوار) + لوحة تحكم لرفع المنتجات جماعياً، حسب المواصفات `docs/superpowers/specs/2026-10-23-khanom-center-design.md`.

**Architecture:** Next.js App Router على Vercel. الصفحات العامة مولّدة عند الطلب ومخزنة (ISR) وتُحدَّث بـ `revalidatePath` بعد كل تعديل. البيانات في Turso عبر `@libsql/client`. الصور تُضغط بالمتصفح وتُرفع مباشرة إلى R2 بروابط موقّعة (`aws4fetch`) وتُعرض من `r2.dev`.

**Tech Stack:** Next.js + TypeScript + Tailwind CSS v4، `@libsql/client`، `aws4fetch`، `jose`، `zod`، `react-zoom-pan-pinch`، `lucide-react`، Vitest.

## Global Constraints
- عربي RTL (`<html lang="ar" dir="rtl">`)، الموبايل أولاً، خط Noto Sans Arabic، مناطق ضغط ≥ 48px.
- الصور لا تمر عبر Vercel، ولا `next/image` optimization.
- مفاتيح الصور: `image_key = "<folder>/<uuid>"`، والنسخ `<image_key>/t` (≤ 480px) و `<image_key>/f` (≤ 1280px)، مع Content-Type صحيح و `Cache-Control: public, max-age=31536000, immutable`.
- كل server action إدارية تتحقق من الجلسة أولاً، وبعد أي تعديل `revalidatePath("/", "layout")`.
- الأسرار فقط في `.env.local` (مستثنى) و Vercel env. `ENV.txt` لا يُرفع أبداً.
- منطقة دوال Vercel: `hnd1` (نفس منطقة Turso: aws-ap-northeast-1).

## File Structure
```
src/lib/env.ts            متغيرات البيئة (server-only)
src/lib/db.ts             عميل Turso
src/lib/schema.sql        الجداول
src/lib/format.ts         formatPrice
src/lib/images.ts         imageUrl, newImageKey, isValidImageKey
src/lib/auth.ts           checkCredentials, createSessionToken, verifySessionToken
src/lib/session.ts        requireAdmin (cookies)
src/lib/r2.ts             presignPut, deleteImage
src/lib/validation.ts     zod schemas
src/lib/queries.ts        قراءات عامة وإدارية
src/lib/client/compress.ts  ضغط الصور بالمتصفح
src/lib/client/upload.ts    رفع متوازي مع تقدم
src/app/actions/*.ts      server actions (auth, categories, sizes, products, uploads)
src/app/page.tsx, c/[id], s/[id]    واجهة الزائر
src/components/site/*     Header, CategoryCard, ProductGrid, Viewer
src/app/admin/**          لوحة التحكم
src/proxy.ts|middleware.ts  حماية /admin
scripts/migrate.mjs       إنشاء الجداول + بذور أولية
```

## Tasks
- [ ] **1. Scaffold:** create-next-app، تبعيات، `.env.local`، `vercel.json` (`regions: ["hnd1"]`)، Vitest، RTL layout + الخط. تحقق: `npm run build`.
- [ ] **2. Pure libs + tests (TDD):** `format.ts`، `images.ts`، `auth.ts`، `validation.ts`. تحقق: `npx vitest run` ناجح.
- [ ] **3. DB:** `schema.sql` + `scripts/migrate.mjs` (بذور: الأقسام نسائي/أطفال/كوزمتكس، وقياسات أساسية). تشغيله على Turso والتحقق من الجداول.
- [ ] **4. R2 + session + proxy:** `r2.ts` (presign + delete)، `session.ts`، حماية `/admin`، صفحة الدخول و actions الدخول والخروج. تحقق: الدخول والخروج يدوياً.
- [ ] **5. Admin: الأقسام والقياسات:** صفحات + actions (إضافة، تعديل، حذف، ترتيب، صورة غلاف).
- [ ] **6. Admin: المنتجات:** قائمة + فلتر، رفع جماعي (ضغط ← presign ← رفع 3 بالتوازي ← إدخال دفعة)، تعديل، إخفاء، حذف.
- [ ] **7. واجهة الزائر:** الرئيسية، الفئات، الشبكة، العارض (scroll-snap + تكبير + `?p=` + زر الرجوع)، إخفاء الفارغ، الغلاف الاحتياطي من أحدث منتج.
- [ ] **8. التحقق والتسليم:** build + tests + تجربة كاملة بالمتصفح بمقاس موبايل (رفع حقيقي إلى R2)، push إلى GitHub، قائمة متغيرات Vercel.
