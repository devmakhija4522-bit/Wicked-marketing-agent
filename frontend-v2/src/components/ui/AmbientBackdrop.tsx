import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const GRAIN_SVG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'>
      <filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter>
      <rect width='100%' height='100%' filter='url(#n)'/>
    </svg>`,
  );

/**
 * Layered atmosphere replacing the old floating-dots canvas: a few large,
 * slow-drifting soft color blooms plus a fixed grain overlay for tactility.
 * Drift is skipped entirely under prefers-reduced-motion; the blooms still
 * render, just static.
 */
export function AmbientBackdrop() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const drift = (path: Array<{ x: string; y: string }>) =>
    reducedMotion
      ? undefined
      : {
          x: path.map((p) => p.x),
          y: path.map((p) => p.y),
          transition: { duration: 34, repeat: Infinity, ease: "easeInOut" as const },
        };

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-void">
      <motion.div
        className="absolute h-[60vw] w-[60vw] rounded-full"
        style={{
          left: "-10%",
          top: "-15%",
          background:
            "radial-gradient(closest-side, rgba(233,69,96,0.22), transparent 70%)",
          filter: "blur(40px)",
        }}
        animate={drift([
          { x: "0%", y: "0%" },
          { x: "6%", y: "4%" },
          { x: "0%", y: "0%" },
        ])}
      />
      <motion.div
        className="absolute h-[55vw] w-[55vw] rounded-full"
        style={{
          right: "-15%",
          top: "-10%",
          background:
            "radial-gradient(closest-side, rgba(157,107,255,0.18), transparent 70%)",
          filter: "blur(40px)",
        }}
        animate={drift([
          { x: "0%", y: "0%" },
          { x: "-5%", y: "5%" },
          { x: "0%", y: "0%" },
        ])}
      />
      <motion.div
        className="absolute h-[50vw] w-[50vw] rounded-full"
        style={{
          left: "20%",
          bottom: "-25%",
          background:
            "radial-gradient(closest-side, rgba(78,225,255,0.14), transparent 70%)",
          filter: "blur(50px)",
        }}
        animate={drift([
          { x: "0%", y: "0%" },
          { x: "4%", y: "-4%" },
          { x: "0%", y: "0%" },
        ])}
      />

      <div
        className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{ backgroundImage: `url("${GRAIN_SVG}")`, backgroundSize: "180px 180px" }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, transparent 0%, rgba(10,10,18,0.55) 70%, var(--color-void) 100%)",
        }}
      />
    </div>
  );
}
