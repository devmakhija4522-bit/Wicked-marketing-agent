// Original, hand-drawn icon set — simple geometric glyphs, not copied from
// any icon library.

function ArrowUpRight({ className = "h-5 w-5" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 17L17 7" />
      <path d="M7 7h10v10" />
    </svg>
  );
}

function PlayIcon({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="6 4 20 12 6 20 6 4" />
    </svg>
  );
}

function ClockIcon({ className = "h-7 w-7" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

function GlobeIcon({ className = "h-7 w-7" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.5 2.6 4 5.9 4 9s-1.5 6.4-4 9c-2.5-2.6-4-5.9-4-9s1.5-6.4 4-9z" />
    </svg>
  );
}

/* Capability card icons — each one an original shape, not sourced from any
   icon library, chosen to represent a real WICKED capability. */

function RadarIcon({ className = "h-6 w-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="9" opacity="0.35" />
      <circle cx="12" cy="12" r="5.5" opacity="0.6" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <path d="M12 12L18.5 6.5" strokeLinecap="round" />
    </svg>
  );
}

function PipelineIcon({ className = "h-6 w-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="4.5" cy="12" r="2.2" />
      <circle cx="12" cy="6" r="2.2" />
      <circle cx="12" cy="18" r="2.2" />
      <circle cx="19.5" cy="12" r="2.2" />
      <path d="M6.4 10.8 10 7.3" />
      <path d="M6.4 13.2 10 16.7" />
      <path d="M14 7.3 17.6 10.8" />
      <path d="M14 16.7 17.6 13.2" />
    </svg>
  );
}

function ShieldCheckIcon({ className = "h-6 w-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3z" />
      <path d="M8.7 12.2l2.3 2.3 4.3-4.5" />
    </svg>
  );
}

/* Footer wordmark + social glyphs — same "original, hand-drawn" rule. */

function WickedMark({ className = "h-5 w-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l7 7-7 7-7-7 7-7z" opacity="0.9" />
      <path d="M12 8l7 7-7 7-7-7 7-7z" opacity="0.45" />
    </svg>
  );
}

function LinkedinIcon({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M7.5 10v6.5M7.5 7.2v.03" />
      <path d="M11.5 16.5V13c0-1.4 1-2.5 2.4-2.5s2.1 1 2.1 2.5v3.5" />
      <path d="M11.5 10.2V16.5" />
    </svg>
  );
}

function TwitterIcon({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 5.5c-.7.4-1.5.6-2.3.8a3.3 3.3 0 0 0-5.6 3v.7A9.3 9.3 0 0 1 4.7 6.4s-3 6.5 3.5 9.5a10 10 0 0 1-6 1.6c6.5 3.6 14.4 1.7 17-5.4a10.8 10.8 0 0 0 .8-4.3c.7-.5 1.3-1.2 1.8-2z" />
    </svg>
  );
}

function InstagramIcon({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17" cy="7" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function YoutubeIcon({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="6" width="19" height="12" rx="3" />
      <path d="M10.5 9.5l5 2.5-5 2.5v-5z" fill="currentColor" stroke="none" />
    </svg>
  );
}

window.ArrowUpRight = ArrowUpRight;
window.PlayIcon = PlayIcon;
window.ClockIcon = ClockIcon;
window.GlobeIcon = GlobeIcon;
window.RadarIcon = RadarIcon;
window.PipelineIcon = PipelineIcon;
window.ShieldCheckIcon = ShieldCheckIcon;
window.WickedMark = WickedMark;
window.LinkedinIcon = LinkedinIcon;
window.TwitterIcon = TwitterIcon;
window.InstagramIcon = InstagramIcon;
window.YoutubeIcon = YoutubeIcon;
