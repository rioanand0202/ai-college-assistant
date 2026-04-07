"use client";

import { useCallback, useId, useRef } from "react";
import { useMotionValue, animate, useTransform, motion } from "framer-motion";
import Lamp from "./Lamp";
import PullChain from "./PullChain";
import { useThemeMode } from "@/components/providers/ThemeModeContext";

function playChainClick(goingDark) {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    const f0 = goingDark ? 480 : 720;
    osc.frequency.setValueAtTime(f0, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(f0 * 0.78, ctx.currentTime + 0.045);
    gain.gain.setValueAtTime(0.065, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.095);
    void ctx.resume?.();
  } catch {
    /* optional audio */
  }
}

function vibratePull() {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    navigator.vibrate(14);
  }
}

export default function LampThemeSwitcher({ className = "" }) {
  const { mode, toggleMode } = useThemeMode();
  const hintId = useId();
  const lampSwing = useMotionValue(0);
  const busy = useRef(false);

  const pullChainX = useTransform(lampSwing, (deg) => deg * 0.35);

  const onThresholdPull = useCallback(() => {
    if (busy.current) return;
    busy.current = true;

    const goingDark = mode === "light";
    vibratePull();
    playChainClick(goingDark);
    toggleMode();

    animate(lampSwing, [0, 6.5, -5.5, 3, -1.2, 0], {
      duration: 0.62,
      ease: [0.25, 0.8, 0.25, 1],
      onComplete: () => {
        busy.current = false;
      },
    });
  }, [lampSwing, mode, toggleMode]);

  return (
    <div
      className={[
        "pointer-events-auto absolute top-2 right-2 z-[3] flex flex-col items-center overflow-visible sm:top-3 sm:right-4 md:right-2",
        className,
      ].join(" ")}
    >
      <Lamp mode={mode} rotate={lampSwing} />
      <motion.div className="-mt-1 flex flex-col items-center" style={{ x: pullChainX }}>
        <PullChain
          onThresholdPull={onThresholdPull}
          thresholdPx={80}
          maxPullPx={140}
          ariaLabelledBy={hintId}
        />
      </motion.div>
      <p
        id={hintId}
        className="mt-1 max-w-[9rem] text-center text-[0.65rem] leading-snug text-stone-600 dark:text-stone-400"
      >
        <span className="font-semibold text-[#C84C31]">Theme</span>
        <span className="mt-0.5 block font-normal text-stone-600 dark:text-stone-400">
          {/* Pull the chain to switch light or dark mode. */}
        </span>
      </p>
    </div>
  );
}
