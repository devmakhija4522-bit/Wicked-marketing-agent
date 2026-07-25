// Drop your own hero footage here — a real .mp4 URL you control. Left
// empty by default so nothing is hotlinked from someone else's hosting.
const HERO_VIDEO_SRC = "";

function StatCard({ icon, value, label }) {
  return (
    <div className="liquid-glass p-5 w-[220px] rounded-[1.25rem] flex flex-col justify-between">
      <div className="text-white">{icon}</div>
      <div className="mt-4">
        <div className="font-heading italic text-white text-4xl tracking-[-1px] leading-none">{value}</div>
        <div className="text-xs text-white font-body font-light mt-2">{label}</div>
      </div>
    </div>
  );
}

function Hero() {
  const { motion } = window.Motion;
  const fadeUp = {
    initial: { filter: "blur(10px)", opacity: 0, y: 20 },
    animate: { filter: "blur(0px)", opacity: 1, y: 0 },
  };

  return (
    <section className="relative w-full h-screen bg-black overflow-hidden flex flex-col">
      <FadingVideo
        src={HERO_VIDEO_SRC}
        className="absolute left-1/2 top-0 -translate-x-1/2 object-cover object-top z-0"
      />
      <div
        className="absolute left-1/2 top-0 -translate-x-1/2 z-0"
        style={{ width: "120%", height: "120%", display: HERO_VIDEO_SRC ? "none" : "block" }}
      />

      <div className="relative z-10 flex flex-col flex-1">
        <Navbar />

        <div className="flex-1 flex flex-col items-center justify-center pt-24 px-4">
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
            className="liquid-glass rounded-full flex items-center overflow-hidden"
          >
            <span className="bg-white text-black px-3 py-1 text-xs font-semibold rounded-full">New</span>
            <span className="text-sm text-white/90 pr-3 pl-2">Autonomous Mode is live — agents that never clock out</span>
          </motion.div>

          <div className="mt-2">
            <BlurText
              text="Command A Fleet Of Marketing Agents"
              className="text-6xl md:text-7xl lg:text-[5.5rem] font-heading italic text-white leading-[0.8] max-w-2xl justify-center tracking-[-4px]"
            />
          </div>

          <motion.p
            {...fadeUp}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.8 }}
            className="mt-4 text-sm md:text-base text-white max-w-2xl font-body font-light leading-tight text-center"
          >
            Discover growth in ways once unimaginable. Five specialist agents — scouting, analyzing,
            writing, and reviewing — bring enterprise-grade marketing within reach, for every brand,
            not just the big ones.
          </motion.p>

          <motion.div
            {...fadeUp}
            transition={{ duration: 0.6, ease: "easeOut", delay: 1.1 }}
            className="flex items-center gap-6 mt-6"
          >
            <a href="#" className="liquid-glass-strong rounded-full px-5 py-2.5 text-sm font-medium text-white flex items-center gap-2">
              Start Your Campaign <ArrowUpRight className="h-5 w-5" />
            </a>
            <a href="#" className="text-white text-sm font-medium flex items-center gap-2">
              Watch Demo <PlayIcon className="h-4 w-4" />
            </a>
          </motion.div>

          <motion.div
            {...fadeUp}
            transition={{ duration: 0.6, ease: "easeOut", delay: 1.3 }}
            className="flex items-stretch gap-4 mt-8"
          >
            <StatCard icon={<ClockIcon />} value="5" label="Specialist agents working in parallel" />
            <StatCard icon={<GlobeIcon />} value="24/7" label="Trend monitoring that never sleeps" />
          </motion.div>
        </div>

        <motion.div
          {...fadeUp}
          transition={{ duration: 0.6, ease: "easeOut", delay: 1.4 }}
          className="flex flex-col items-center gap-4 pb-8"
        >
          <div className="liquid-glass rounded-full px-3.5 py-1 text-xs font-medium text-white">
            Powered by a fleet of specialist agents
          </div>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 px-4">
            {["Trend Scout", "Insight Analyst", "Content Strategist", "Script Writer", "Brand Guardian"].map((name) => (
              <span key={name} className="font-heading italic text-white text-xl md:text-2xl tracking-tight">
                {name}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

window.Hero = Hero;
