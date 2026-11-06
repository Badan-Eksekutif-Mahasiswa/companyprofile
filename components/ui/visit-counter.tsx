"use client";

import { useEffect, useState } from "react";

const KEY = "bemui:visit-counted";

export function VisitCounter() {
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    let counted = false;
    try {
      counted = sessionStorage.getItem(KEY) === "1";
      if (!counted) sessionStorage.setItem(KEY, "1");
    } catch {}
    fetch("/api/visits", { method: counted ? "GET" : "POST", cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && typeof d.total === "number") setTotal(d.total);
      })
      .catch(() => {});
  }, []);

  if (total === null) return null;
  return <span>{new Intl.NumberFormat("id-ID").format(total)} kunjungan</span>;
}
