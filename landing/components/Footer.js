const FOOTER_LINKS = {
  Platform: ["Trend Discovery", "Content Lab", "Script Vault", "Autonomous Mode", "GMM Console"],
  Company: ["About WICKED", "The Grest Partnership", "Engineering Blog", "Careers"],
  Support: ["Get in Touch", "Privacy Policy", "Terms of Service", "Report an Issue"],
};

const SOCIALS = [
  { Icon: "LinkedinIcon", label: "LinkedIn" },
  { Icon: "TwitterIcon", label: "Twitter" },
  { Icon: "InstagramIcon", label: "Instagram" },
  { Icon: "YoutubeIcon", label: "YouTube" },
];

function FooterColumn({ title, links }) {
  return (
    <div>
      <h4 className="text-sm uppercase tracking-wider text-white font-heading font-medium mb-4">{title}</h4>
      <ul className="text-xs space-y-2 text-white/60 font-body font-light">
        {links.map((link) => (
          <li key={link}>
            <a href="#" className="hover:text-[#e94560] transition-colors">
              {link}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Footer() {
  const { motion } = window.Motion;

  return (
    <motion.footer
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
      className="liquid-glass-crimson w-full max-w-6xl mx-auto rounded-3xl p-6 md:p-10 text-white/70 mt-24 mb-12"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12 mb-10">
        <div className="md:col-span-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[#e94560]">
              <WickedMark className="h-6 w-6" />
            </span>
            <span className="font-heading italic text-xl font-extrabold text-[#e94560] tracking-tight">WICKED</span>
          </div>
          <p className="text-sm leading-relaxed max-w-sm text-white/60 font-body font-light">
            WICKED is the autonomous marketing engine behind Grest's content — trend-aware, brand-safe, and always on.
          </p>
        </div>

        <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-8">
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <FooterColumn key={title} title={title} links={links} />
          ))}
        </div>
      </div>

      <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4">
        <p className="text-[10px] uppercase tracking-widest opacity-50 font-body">Built for Grest × WICKED v1.0</p>
        <div className="flex items-center gap-4">
          <span className="text-[10px] uppercase tracking-widest opacity-50 font-body">Follow the pipeline:</span>
          <div className="flex items-center gap-3">
            {SOCIALS.map(({ Icon, label }) => {
              const IconComponent = window[Icon];
              return (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="opacity-70 hover:opacity-100 hover:text-[#e94560] transition-colors"
                >
                  <IconComponent className="h-4 w-4" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </motion.footer>
  );
}

window.Footer = Footer;
