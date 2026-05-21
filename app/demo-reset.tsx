"use client";

import { useEffect } from "react";

const DEMO_BUCKET_COOKIE = "rt_academy_demo_bucket";
const DEMO_BUCKET_STORAGE_KEY = "rt_academy_demo_bucket_seen";

function readCookie(name: string) {
  return document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export function DemoReset() {
  useEffect(() => {
    const bucket = readCookie(DEMO_BUCKET_COOKIE);
    if (!bucket) return;

    const seen = localStorage.getItem(DEMO_BUCKET_STORAGE_KEY);
    if (seen === bucket) return;

    for (const key of Object.keys(localStorage)) {
      if (key.startsWith("rt_academy_") && key !== DEMO_BUCKET_STORAGE_KEY) {
        localStorage.removeItem(key);
      }
    }
    localStorage.setItem(DEMO_BUCKET_STORAGE_KEY, bucket);
  }, []);

  return null;
}
