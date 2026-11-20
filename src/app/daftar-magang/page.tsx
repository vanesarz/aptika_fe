"use client";

import { useRouter } from "next/navigation";
import { FormPendaftaranMagang } from "@/components/magang/FormPendaftaranMagang";
import { SalinLinkPendaftaranMagang } from "@/components/magang/SalinLinkPendaftaranMagang";

export default function DaftarMagangPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <FormPendaftaranMagang onClose={() => router.push("/")} bannerAction={
          <div className="rounded-xl border border-white/20 bg-white p-0.5 shadow-sm">
            <SalinLinkPendaftaranMagang iconOnly />
          </div>
        } />
      </div>
    </main>
  );
}
