"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { checkCredentials, createSessionToken } from "@/lib/auth";
import { COOKIE_NAME } from "@/lib/session";
import { loginSchema } from "@/lib/validation";

export interface ActionState {
  error?: string;
  success?: boolean;
}

export async function loginAction(
  prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const rawUsername = formData.get("username");
  const rawPassword = formData.get("password");

  const parsed = loginSchema.safeParse({
    username: rawUsername,
    password: rawPassword,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "بيانات الدخول غير مكتملة" };
  }

  const { username, password } = parsed.data;

  if (!checkCredentials(username, password)) {
    return { error: "اسم المستخدم أو كلمة المرور غير صحيحة" };
  }

  const token = await createSessionToken({ username: username.toUpperCase() });
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });

  redirect("/admin");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  redirect("/admin/login");
}
