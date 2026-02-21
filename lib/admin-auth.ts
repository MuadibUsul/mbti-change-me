import { redirect } from "next/navigation";
import { auth } from "@/auth";

function parseAdminEmails() {
  const raw = process.env.ADMIN_EMAILS ?? "admin@starringcapital.com";
  return raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email?: string | null) {
  if (!email) return false;
  return parseAdminEmails().includes(email.toLowerCase());
}

export async function requireAdminSession() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/login");
  }
  if (!isAdminEmail(session.user.email)) {
    redirect("/");
  }
  return session;
}
