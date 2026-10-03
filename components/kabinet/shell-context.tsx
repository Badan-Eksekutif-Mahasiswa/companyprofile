"use client";

import * as React from "react";
import type Lenis from "lenis";
import type { DistortManager } from "./distort-manager";

export type ShellCtx = {
  lenis: Lenis | null;
  distort: DistortManager | null;
  /** true setelah Lenis + ScrollTrigger siap; efek scroll-based harus menunggu ini. */
  ready: boolean;
};

export const ShellContext = React.createContext<ShellCtx>({ lenis: null, distort: null, ready: false });
export const useShell = () => React.useContext(ShellContext);
