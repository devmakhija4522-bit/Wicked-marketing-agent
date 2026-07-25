import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

// Swap in a real hosted .mp4 you control — left empty on purpose so nothing
// is hotlinked from third-party hosting. The gradient overlay + void
// background already carry the page with no video at all.
const VIDEO_SRC = "";

function WickedMark({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 2 L20 9 L12 16 L4 9 Z" opacity="0.55" />
      <path d="M12 9 L20 16 L12 23 L4 16 Z" opacity="0.9" />
    </svg>
  );
}

// lucide-react's current major dropped brand/logo icons entirely, so these
// four are small original glyphs rather than a missing dependency.
type IconProps = { size?: number };

function LinkedInGlyph({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M8 10.5V17" />
      <circle cx="8" cy="7" r="0.9" fill="currentColor" stroke="none" />
      <path d="M12.5 17v-4a2 2 0 0 1 4 0v4" />
      <path d="M12.5 10.5V17" />
    </svg>
  );
}

function TwitterGlyph({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4l16 16" />
      <path d="M20 4L4 20" />
    </svg>
  );
}

function InstagramGlyph({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17" cy="7" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function YoutubeGlyph({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="6" width="19" height="12" rx="3.5" />
      <path d="M10.5 9.8l5 2.2-5 2.2z" fill="currentColor" stroke="none" />
    </svg>
  );
}

const PLATFORM_LINKS = [
  { label: "Trend Discovery", to: "/trends" },
  { label: "Content Lab", to: "/lab" },
  { label: "Script Vault", to: "/vault" },
  { label: "Autonomous Mode", to: "/autonomous" },
  { label: "GMM Console", to: "/gmm" },
];

const COMPANY_LINKS = ["About WICKED", "The Grest Partnership", "Engineering Blog", "Careers"];
const SUPPORT_LINKS = ["Get in Touch", "Privacy Policy", "Terms of Service", "Report an Issue"];

const SOCIALS = [
  { icon: LinkedInGlyph, label: "LinkedIn" },
  { icon: TwitterGlyph, label: "Twitter" },
  { icon: InstagramGlyph, label: "Instagram" },
  { icon: YoutubeGlyph, label: "YouTube" },
];

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-white">{title}</h3>
      <ul className="space-y-2 text-xs text-white/60">{children}</ul>
    </div>
  );
}

export function Welcome() {
  return (
    <main className="relative flex min-h-[115vh] w-full flex-col items-center overflow-x-hidden bg-[#0b0b12] font-sans selection:bg-[#e94560]/30 selection:text-white">
      {VIDEO_SRC ? (
        <video
          className="fixed inset-0 z-0 h-full w-full object-cover opacity-60"
          src={VIDEO_SRC}
          autoPlay
          loop
          muted
          playsInline
        />
      ) : null}
      <div className="fixed inset-0 z-[1] bg-gradient-to-b from-black/40 via-transparent to-black/70" />

      <div className="relative z-10 flex w-full max-w-7xl flex-1 flex-col px-6 md:px-10">
        <div className="flex flex-1 flex-col items-center justify-center py-32 text-center">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mb-6 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-widest text-white/60"
          >
            Autonomous Mode is live
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
            className="max-w-3xl text-4xl font-extrabold leading-tight text-white md:text-6xl"
          >
            Autonomous content, on-brand, at scale —{" "}
            <span className="text-[#e94560]">for Grest and beyond.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
            className="mt-5 max-w-xl text-sm text-white/60 md:text-base"
          >
            Five specialist agents scout, analyze, write, and review — every script checked
            against your brand voice before it ships.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
            className="mt-8"
          >
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full bg-[#e94560] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#e94560]/85"
            >
              Launch Console
              <ArrowUpRight size={16} />
            </Link>
          </motion.div>
        </div>

        <motion.footer
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
          className="liquid-glass mt-32 w-full rounded-3xl p-6 text-white/70 md:mt-64 md:p-10"
        >
          <div className="mb-10 grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-12">
            <div className="md:col-span-5">
              <div className="mb-3 flex items-center gap-2">
                <WickedMark className="h-5 w-5 text-[#e94560]" />
                <span className="text-xl font-extrabold text-[#e94560]">WICKED</span>
              </div>
              <p className="max-w-sm text-sm leading-relaxed text-white/60">
                WICKED is the autonomous marketing engine behind Grest's content — trend-aware,
                brand-safe, and always on.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-10 sm:grid-cols-3 md:col-span-7">
              <FooterColumn title="Platform">
                {PLATFORM_LINKS.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="transition-colors hover:text-[#e94560]">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </FooterColumn>

              <FooterColumn title="Company">
                {COMPANY_LINKS.map((label) => (
                  <li key={label}>
                    <a href="#" className="transition-colors hover:text-[#e94560]">
                      {label}
                    </a>
                  </li>
                ))}
              </FooterColumn>

              <FooterColumn title="Support">
                {SUPPORT_LINKS.map((label) => (
                  <li key={label}>
                    <a href="#" className="transition-colors hover:text-[#e94560]">
                      {label}
                    </a>
                  </li>
                ))}
              </FooterColumn>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-6 border-t border-white/10 pt-6 md:flex-row md:gap-4">
            <p className="text-[10px] uppercase tracking-widest opacity-50">
              Built for Grest × WICKED v1.0
            </p>
            <div className="flex items-center gap-4">
              <span className="text-[10px] uppercase tracking-widest opacity-50">
                Follow the pipeline:
              </span>
              {SOCIALS.map(({ icon: Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="opacity-70 transition-colors hover:text-[#e94560] hover:opacity-100"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>
        </motion.footer>
      </div>
    </main>
  );
}
