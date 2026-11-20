"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

export function MagangAccessGuard({ children }: { children: React.ReactNode }) {
  const { user, initialized, fetchProfile } = useAuthStore();
  const path = usePathname();
  const router = useRouter();
  const allowed = path === "/" || path === "/login" || path === "/profile" || path === "/profil" || path === "/magang" || path.startsWith("/magang/") || path === "/manajementugasdigital" || path.startsWith("/manajementugasdigital/");
  const restricted = !!user?.is_magang && !allowed;
  useEffect(() => { if (!initialized && localStorage.getItem("token")) fetchProfile(); }, [initialized, fetchProfile]);
  useEffect(() => { if (restricted) router.replace("/magang/dashboard"); }, [restricted, router]);
  if (restricted) return <div className="p-6">Membuka halaman magang…</div>;
  return children;
}
