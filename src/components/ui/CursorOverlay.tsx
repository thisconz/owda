/**
 * CursorOverlay
 *
 * Renders the kinetic crosshair tracker and mouse-coordinate badge.
 *
 * PERFORMANCE: Uses Motion values + useSpring instead of React state.
 * Mouse position updates animate the DOM directly via Motion's engine —
 * zero React state updates, zero component re-renders on mousemove.
 *
 * Previously this lived in App.tsx and caused ~60 full App-tree re-renders/sec.
 */

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { Radio } from "lucide-react";

export const CursorOverlay: React.FC = () => {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  // Spring-damped crosshair follows cursor with mechanical feel
  const springX = useSpring(rawX, { damping: 60, stiffness: 400, mass: 0.1 });
  const springY = useSpring(rawY, { damping: 60, stiffness: 400, mass: 0.1 });

  // Direct DOM ref for coordinate text — avoids React re-render on every move
  const coordRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      rawX.set(e.clientX);
      rawY.set(e.clientY);
      // Mutate DOM directly — bypasses React's reconciler entirely
      if (coordRef.current) {
        coordRef.current.textContent = `X:${e.clientX} Y:${e.clientY}`;
      }
    };

    window.addEventListener("mousemove", handler, { passive: true });
    return () => window.removeEventListener("mousemove", handler);
  }, [rawX, rawY]);

  return (
    <>
      {/* Kinetic crosshair — animated via Motion values, not React state */}
      <motion.div
        style={{ x: springX, y: springY }}
        className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 opacity-[0.08]"
      >
        <div className="absolute top-[-100vh] left-0 w-[2px] h-[200vh] bg-[#1A1A1A]" />
        <div className="absolute top-0 left-[-100vw] w-[200vw] h-[2px] bg-[#1A1A1A]" />
      </motion.div>

      {/* Coordinate badge — DOM mutated directly via ref */}
      <div className="fixed bottom-12 right-12 z-[100] pointer-events-none flex flex-col items-end gap-3">
        <div className="flex gap-2">
          <div className="bg-white px-4 py-2 border-4 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] flex items-center gap-3">
            <Radio size={14} className="text-[#FF6B6B]" />
            <span className="text-[10px] font-black tabular-nums font-mono">
              <span ref={coordRef}>X:0 Y:0</span>
            </span>
          </div>
        </div>
      </div>
    </>
  );
};