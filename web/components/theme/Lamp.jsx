"use client";

import { motion } from "framer-motion";

/**
 * Hanging lamp with theme-aware glow. Pass `rotate` as a Framer MotionValue for swing animation.
 */
export default function Lamp({ mode, rotate = 0, className = "" }) {
  const isLight = mode === "light";

  return (
    <motion.div
      className={["relative flex flex-col items-center", className].join(" ")}
      style={{ rotate, transformOrigin: "50% 0%" }}
    >
      <div className="h-1.5 w-9 rounded-full bg-gradient-to-b from-stone-300 to-stone-400 shadow-md dark:from-stone-600 dark:to-stone-700" />
      <div className="h-2 w-0.5 bg-stone-500 dark:bg-stone-400" />

      <div
        className="pointer-events-none absolute top-5 left-1/2 -z-10 h-28 w-28 -translate-x-1/2 rounded-full blur-2xl transition-[opacity,filter] duration-[480ms] ease-out"
        style={{
          opacity: isLight ? 1 : 0.92,
          background: isLight
            ? "radial-gradient(circle, rgba(255,210,160,0.7) 0%, rgba(255,180,100,0.32) 42%, transparent 68%)"
            : "radial-gradient(circle, rgba(130,210,255,0.45) 0%, rgba(90,140,255,0.2) 48%, transparent 72%)",
          boxShadow: isLight
            ? "0 0 56px 18px rgba(255,185,120,0.42)"
            : "0 0 64px 22px rgba(100,180,255,0.32), 0 0 100px 30px rgba(80,120,200,0.12)",
        }}
      />

      <div
        className="relative z-[1] mt-1 h-11 w-[4.75rem] rounded-b-[2.1rem] border border-amber-200/50 bg-gradient-to-b from-amber-50 via-amber-100 to-amber-200/95 shadow-[inset_0_-6px_12px_rgba(139,90,43,0.18),0_10px_22px_rgba(0,0,0,0.18)] dark:border-stone-600/55 dark:from-stone-600 dark:via-stone-700 dark:to-stone-800 dark:shadow-[inset_0_-8px_14px_rgba(0,0,0,0.45),0_12px_28px_rgba(0,0,0,0.55)]"
        style={{
          transition: "box-shadow 480ms ease, background 480ms ease, border-color 480ms ease",
        }}
      />

      <div className="relative z-[1] -mt-px h-2.5 w-3 rounded-b-md bg-gradient-to-b from-amber-400 to-amber-600 shadow-lg dark:from-stone-500 dark:to-stone-700" />
    </motion.div>
  );
}
