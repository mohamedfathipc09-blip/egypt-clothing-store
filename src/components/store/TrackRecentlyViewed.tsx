"use client";
import { useEffect } from "react";
const STORAGE_KEY = "eg_clothing_recently_viewed_v1";
export default function TrackRecentlyViewed({ productId }: { productId: string }) {
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      let list: string[] = raw ? JSON.parse(raw) : [];
      list = list.filter((id) => id !== productId);
      list.unshift(productId);
      list = list.slice(0, 10);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {}
  }, [productId]);
  return null;
}