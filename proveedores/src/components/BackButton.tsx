"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink transition-colors mb-4"
    >
      <ArrowLeft size={16} /> Volver
    </button>
  );
}
