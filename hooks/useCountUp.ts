import { useEffect, useState } from "react";

/** Gentle count-up for stat numbers when a screen mounts. */
export function useCountUp(target: number, durationMs = 900): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (target <= 0) {
      setValue(0);
      return;
    }

    const start = Date.now();
    let frame = 0;

    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = 1 - (1 - progress) ** 3;
      setValue(Math.round(target * eased));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);

  return value;
}
