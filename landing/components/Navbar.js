function Navbar() {
  const links = ["Home", "Agents", "Pipeline", "Automation"];

  return (
    <nav className="fixed top-4 left-0 right-0 z-50 flex items-center justify-between px-8 lg:px-16">
      <div className="liquid-glass h-12 w-12 rounded-full flex items-center justify-center">
        <span className="font-heading italic text-white text-xl lowercase">w</span>
      </div>

      <div className="hidden md:flex items-center gap-1 liquid-glass rounded-full px-1.5 py-1.5">
        {links.map((link) => (
          <a key={link} href="#" className="px-3 py-2 text-sm font-medium text-white/90 font-body">
            {link}
          </a>
        ))}
        <a
          href="#"
          className="rounded-full bg-white text-black px-3 py-2 text-sm font-medium whitespace-nowrap flex items-center gap-1"
        >
          Get Early Access <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>

      <div className="h-12 w-12" />
    </nav>
  );
}

window.Navbar = Navbar;
