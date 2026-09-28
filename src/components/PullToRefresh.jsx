import React, { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const THRESHOLD = 70;
const MAX_PULL = 120;

export default function PullToRefresh({ onRefresh, children }) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const startY = useRef(0);
  const active = useRef(false);

  const handleStart = (y) => {
    if (refreshing || window.scrollY > 0) return;
    startY.current = y;
    active.current = true;
    setDragging(true);
  };

  const handleMove = (y) => {
    if (!active.current || refreshing) return;
    const delta = y - startY.current;
    if (delta <= 0) {
      setPull(0);
      return;
    }
    setPull(Math.min(MAX_PULL, delta * 0.5));
  };

  const handleEnd = async () => {
    if (!active.current) return;
    active.current = false;
    setDragging(false);
    if (pull >= THRESHOLD) {
      setRefreshing(true);
      setPull(THRESHOLD);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPull(0);
      }
    } else {
      setPull(0);
    }
  };

  const progress = Math.min(1, pull / THRESHOLD);

  return (
    <div
      onTouchStart={(e) => handleStart(e.touches[0].clientY)}
      onTouchMove={(e) => handleMove(e.touches[0].clientY)}
      onTouchEnd={handleEnd}
    >
      <div
        className="flex items-center justify-center overflow-hidden"
        style={{
          height: pull,
          transition: dragging ? "none" : "height 0.25s ease",
        }}
      >
        <Loader2
          className={cn("w-6 h-6 text-slate-400", refreshing && "animate-spin")}
          style={{
            opacity: refreshing ? 1 : progress,
            transform: refreshing ? undefined : `rotate(${progress * 360}deg)`,
          }}
        />
      </div>
      {children}
    </div>
  );
}