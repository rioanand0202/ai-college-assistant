"use client";

import { useCallback, useRef, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

const BASE_ROPE_PX = 52;

const RUBBER_SPRING = {
  type: "spring",
  stiffness: 210,
  damping: 11,
  mass: 0.55,
};

function rubberClamp(y, max) {
  if (y <= max) return y;
  const over = y - max;
  return max + over * 0.22;
}

/**
 * Pull chain: cord length grows while dragging. Rubber snap on release;
 * fires onThresholdPull past thresholdPx.
 */
export default function PullChain({
  onThresholdPull,
  thresholdPx = 80,
  disabled = false,
  className = "",
  maxPullPx = 140,
  ariaLabelledBy,
}) {
  const stretch = useMotionValue(0);
  const [locked, setLocked] = useState(false);

  const dragRef = useRef({
    active: false,
    pointerId: null,
    pointerStartY: 0,
    stretchAtStart: 0,
  });

  const ropeHeight = useTransform(stretch, (s) => BASE_ROPE_PX + s);
  const ropeSqueeze = useTransform(stretch, [0, maxPullPx], [1, 0.92]);
  const knobScale = useTransform(stretch, [0, maxPullPx], [1, 1.04]);

  const snapBack = useCallback(() => {
    setLocked(true);
    animate(stretch, 0, RUBBER_SPRING).then(() => {
      setLocked(false);
    });
  }, [stretch]);

  const handlePointerDown = useCallback(
    (e) => {
      if (disabled || locked) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = {
        active: true,
        pointerId: e.pointerId,
        pointerStartY: e.clientY,
        stretchAtStart: stretch.get(),
      };
    },
    [disabled, locked, stretch],
  );

  const handlePointerMove = useCallback(
    (e) => {
      const d = dragRef.current;
      if (!d.active || e.pointerId !== d.pointerId) return;
      const delta = e.clientY - d.pointerStartY;
      const raw = d.stretchAtStart + delta;
      const clamped = Math.max(0, Math.min(maxPullPx, raw));
      const withBand = raw > maxPullPx ? rubberClamp(raw, maxPullPx) : clamped;
      stretch.set(withBand);
    },
    [maxPullPx, stretch],
  );

  const endDrag = useCallback(() => {
    const d = dragRef.current;
    if (!d.active) return;
    d.active = false;
    const pulled = Math.min(maxPullPx, Math.max(0, stretch.get()));
    const fire = pulled >= thresholdPx && !disabled;

    if (fire) {
      onThresholdPull?.();
    }
    snapBack();
  }, [disabled, maxPullPx, onThresholdPull, snapBack, stretch, thresholdPx]);

  const handlePointerUp = useCallback(
    (e) => {
      const d = dragRef.current;
      if (!d.active || e.pointerId !== d.pointerId) return;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      endDrag();
    },
    [endDrag],
  );

  const handlePointerCancel = useCallback(
    (e) => {
      const d = dragRef.current;
      if (!d.active || e.pointerId !== d.pointerId) return;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      endDrag();
    },
    [endDrag],
  );

  return (
    <motion.div
      className={[
        "flex flex-col items-center touch-none select-none",
        "cursor-grab active:cursor-grabbing",
        className,
      ].join(" ")}
      style={{ touchAction: "none" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      aria-label={ariaLabelledBy ? undefined : "Pull the chain to switch light or dark theme"}
      aria-labelledby={ariaLabelledBy}
    >
      <motion.div
        className="relative w-1.5 overflow-hidden rounded-full shadow-[inset_0_1px_2px_rgba(255,255,255,0.22)] dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.08)]"
        style={{
          height: ropeHeight,
          scaleX: ropeSqueeze,
          transformOrigin: "center top",
        }}
      >
        <div
          className="absolute inset-0 bg-gradient-to-b from-amber-900/90 via-stone-600 to-stone-800 dark:from-amber-800/85 dark:via-stone-500 dark:to-stone-600"
          aria-hidden
        />
        <div
          className="absolute left-0 right-0 top-0 h-3 bg-gradient-to-b from-white/25 to-transparent opacity-80 dark:opacity-40"
          aria-hidden
        />
      </motion.div>

      <motion.div
        className="-mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-600 via-amber-800 to-stone-900 shadow-[0_5px_14px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.38)] ring-2 ring-amber-900/30 dark:ring-stone-500/45"
        style={{ scale: knobScale }}
      >
        <span
          className="h-2.5 w-2.5 rounded-full bg-stone-950/35 shadow-inner dark:bg-white/25"
          aria-hidden
        />
      </motion.div>
    </motion.div>
  );
}
