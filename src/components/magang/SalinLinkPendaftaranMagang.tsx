"use client";

import { SalinTautan } from "@/components/ui/SalinTautan";

export function SalinLinkPendaftaranMagang({ iconOnly = false }: { iconOnly?: boolean }) {
  return <SalinTautan path="/daftar-magang" label="pendaftaran magang" appearance={iconOnly ? "icon" : "button"} />;
}
