"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function BinderSearchInput({
  binderId,
  initialQ,
  condition,
}: {
  binderId: string;
  initialQ: string;
  condition: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialQ);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (value === initialQ) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const params = new URLSearchParams({ condition, page: "1" });
      if (value.trim()) params.set("q", value.trim());
      router.push(`/binders/${binderId}?${params.toString()}`);
    }, 300);
    return () => clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <input
      type="search"
      className="input"
      placeholder="Search this binder…"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      style={{ width: 220 }}
    />
  );
}
