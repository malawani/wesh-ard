import type { ReactNode } from "react";

export type IconName = "brand" | "reply" | "send" | "guide" | "heart" | "arrow" | "back" | "search" | "check" | "copy" | "bulb" | "shield" | "spark" | "close";

const paths: Record<IconName, ReactNode> = {
  brand: <><path d="M20.5 11.2a8.5 8.5 0 0 1-8.6 8.3 9.5 9.5 0 0 1-3.4-.6l-4.8 1.5 1.4-4.1a8.2 8.2 0 0 1-1.6-5.1 8.5 8.5 0 0 1 17 0Z"/><path d="M12 14.8c-1.9-1.2-3.6-2.3-3.6-4a2 2 0 0 1 3.6-1 2 2 0 0 1 3.6 1c0 1.7-1.7 2.8-3.6 4Z"/></>,
  reply: <><path d="M20.5 11.5a8.5 8.5 0 0 1-8.7 8.1 9.2 9.2 0 0 1-3.5-.7l-4.8 1.5 1.5-4.3a8 8 0 0 1-1.5-4.6 8.5 8.5 0 0 1 17 0Z"/><path d="M8 11.5h.1m3.9 0h.1m3.9 0h.1" strokeWidth="2.6"/></>,
  send: <><path d="M21 3 10.5 13.5M21 3l-6.7 18-3.8-7.5L3 9.7 21 3Z"/></>,
  guide: <><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"/></>,
  heart: <path d="M20.8 8.6c0 4.4-8.8 10-8.8 10s-8.8-5.6-8.8-10a4.7 4.7 0 0 1 8.8-2.2 4.7 4.7 0 0 1 8.8 2.2Z"/>,
  arrow: <path d="M20 12H4m7 7-7-7 7-7"/>,
  back: <path d="M4 12h16m-7-7 7 7-7 7"/>,
  search: <><circle cx="10.8" cy="10.8" r="6"/><path d="m15.3 15.3 4.2 4.2"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  copy: <><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></>,
  bulb: <><path d="M9 18h6m-5 3h4m-2-18a6 6 0 0 0-4 10.5c.7.6 1 1.2 1 2.5h6c0-1.3.3-1.9 1-2.5A6 6 0 0 0 12 3Z"/></>,
  shield: <><path d="M12 3 5 6v5c0 4.2 2.8 7.8 7 10 4.2-2.2 7-5.8 7-10V6l-7-3Z"/><path d="M12 8v4m0 3h.01"/></>,
  spark: <path d="M12 2c.8 6.2 3.8 9.2 10 10-6.2.8-9.2 3.8-10 10-.8-6.2-3.8-9.2-10-10 6.2-.8 9.2-3.8 10-10Z"/>,
  close: <path d="m6 6 12 12M18 6 6 18"/>
};

export function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}
