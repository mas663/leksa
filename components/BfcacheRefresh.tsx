"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BfcacheRefresh() {
  const router = useRouter();

  useEffect(() => {
    // Real bfcache restore (navigasi ke situs luar lalu back).
    // persisted === true hanya untuk kasus ini.
    const handlePageShow = (e: PageTransitionEvent) => {
      console.log("[pageshow]", e.persisted);
      if (e.persisted) router.refresh();
    };

    // Next.js Router back/forward (soft navigation dalam SPA).
    // popstate terpicu saat back/forward tapi TIDAK saat pushState —
    // sehingga aman dipakai tanpa infinite loop.
    const handlePopState = () => {
      console.log("[popstate] router.refresh()");
      router.refresh();
    };

    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [router]);

  return null;
}
