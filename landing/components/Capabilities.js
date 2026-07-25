const CAPABILITIES = [
  {
    icon: "RadarIcon",
    title: "Trend Intelligence",
    tags: ["Multi-Source Scan", "Real-Time Signals", "Zero Guesswork", "Always Fresh"],
    body: "Wicked scans YouTube, Reddit, and Google Trends in parallel, surfacing what's actually breaking right now — not what was trending last week.",
  },
  {
    icon: "PipelineIcon",
    title: "Autonomous Pipeline",
    tags: ["5 Specialist Agents", "Runs Unattended", "Self-Dedupes", "Ships While You Sleep"],
    body: "Trend Scout to Brand Guardian, five agents hand off a single idea until it's a fully reviewed, ready-to-post script — no human required to press go.",
  },
  {
    icon: "ShieldCheckIcon",
    title: "Brand Guardian",
    tags: ["Voice Consistency", "Fact-Checked", "Score On Every Draft", "Never Off-Brand"],
    body: "Every script is scored against your brand voice before it ships. Nothing goes out flat, off-tone, or embarrassing — automatically.",
  },
];

function CapabilityCard({ icon, title, tags, body, index }) {
  const { motion } = window.Motion;
  const Icon = window[icon];
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.12 }}
      className="liquid-glass rounded-[1.5rem] p-6 flex flex-col gap-5"
    >
      <div className="h-11 w-11 rounded-full liquid-glass-strong flex items-center justify-center text-white">
        <Icon />
      </div>
      <h3 className="font-heading italic text-white text-2xl tracking-tight">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span key={tag} className="text-[11px] uppercase tracking-wide text-white/70 border border-white/15 rounded-full px-2.5 py-1">
            {tag}
          </span>
        ))}
      </div>
      <p className="text-sm text-white/80 font-body font-light leading-relaxed">{body}</p>
    </motion.div>
  );
}

function Capabilities() {
  return (
    <section className="relative w-full bg-black py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <BlurText
          text="Marketing evolved"
          className="text-5xl md:text-6xl font-heading italic text-white leading-[0.9] tracking-[-3px] justify-center mb-16"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {CAPABILITIES.map((c, i) => (
            <CapabilityCard key={c.title} {...c} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

window.Capabilities = Capabilities;
