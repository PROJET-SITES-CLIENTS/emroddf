import { Outlet, Link, useLocation } from "react-router-dom";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useMotionValue, useSpring } from "motion/react";
import Chatbot from "../Chatbot";
import LeadPopup from "../LeadPopup";
import logo from "../../assets/images/logo.png";

/* ── Page Transition Component ────────── */
function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -20, filter: "blur(4px)" }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/* ── Sparkle decoration component ─────── */
function FloatingSparkles() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[9990] overflow-hidden">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full animate-sparkle-drift"
          style={{
            background: i % 2 === 0 ? "#e85d04" : "#11522f",
            left: `${15 + i * 15}%`,
            top: `${20 + (i % 3) * 30}%`,
            opacity: 0,
            animationDelay: `${i * 2.5}s`,
            animationDuration: `${4 + i * 0.5}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function Layout() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const location = useLocation();

  // Framer Motion for performant scroll progress
  const { scrollYProgress } = useScroll();

  /* ─── Scroll effects ─────────────────────── */
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* ─── Scroll to top on route change ──────── */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  /* ─── Close menu on route change ─────────── */
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: "Accueil", path: "/" },
    { name: "À propos", path: "/a-propos" },
    { name: "Modèles & Services", path: "/services" },
    { name: "Galerie", path: "/galerie" },
    { name: "Contact", path: "/contact" },
  ];

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <div className="flex flex-col min-h-screen relative bg-transparent">
      {/* ── Floating sparkles ─────────────────── */}
      <FloatingSparkles />

      {/* ── Reading Progress Bar ─────────────── */}
      <motion.div
        className="reading-progress"
        style={{ scaleX: scrollYProgress, transformOrigin: "0% 50%", width: "100%" }}
      />

      {/* ── Header ───────────────────────────── */}
      <header
        className={`fixed top-0 w-full z-50 transition-all duration-700 ${
          isScrolled
            ? "py-2.5"
            : "bg-transparent py-5"
        }`}
        style={
          isScrolled
            ? {
                background: "rgba(245, 242, 235, 0.7)",
                backdropFilter: "blur(24px) saturate(180%)",
                WebkitBackdropFilter: "blur(24px) saturate(180%)",
                borderBottom: "1px solid rgba(226, 222, 213, 0.5)",
                boxShadow: "0 4px 30px rgba(0, 0, 0, 0.04), 0 1px 6px rgba(232, 93, 4, 0.03)",
              }
            : undefined
        }
      >
        <div className="container mx-auto px-6 flex items-center justify-between">
          {/* Logo with breathe animation */}
          <Link to="/" className="flex items-center gap-2 group relative">
            <motion.img
              src={logo}
              alt="EMROD Logo"
              className={`w-auto transition-all duration-700 ${
                isScrolled ? "h-10 md:h-12" : "h-14 md:h-18"
              }`}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            />
            {/* Subtle golden shimmer on logo hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg pointer-events-none"
              style={{ boxShadow: "0 0 30px rgba(232, 93, 4, 0.1)" }}
            />
          </Link>

          <nav className="hidden md:flex gap-1 items-center">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative text-[11px] uppercase tracking-[0.18em] font-medium transition-all duration-300 px-4 py-2 rounded-sm ${
                  isActive(link.path)
                    ? "text-accent"
                    : "text-foreground/70 hover:text-accent"
                }`}
                onMouseEnter={() => setHoveredNav(link.path)}
                onMouseLeave={() => setHoveredNav(null)}
              >
                {link.name}
                {/* Animated underline */}
                <motion.span
                  className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full"
                  initial={false}
                  animate={{
                    scaleX: isActive(link.path) || hoveredNav === link.path ? 1 : 0,
                    opacity: isActive(link.path) || hoveredNav === link.path ? 1 : 0,
                  }}
                  transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                  style={{
                    originX: 0,
                    background: "linear-gradient(90deg, #e85d04, #f97316)",
                    boxShadow: isActive(link.path) ? "0 0 8px rgba(232, 93, 4, 0.3)" : "none",
                  }}
                />
              </Link>
            ))}
            {/* CTA button with shimmer sweep */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} className="ml-3">
              <Link
                to="/contact"
                className="shimmer-sweep inline-flex items-center gap-2 px-5 py-2.5 text-primary-foreground text-[10px] uppercase tracking-[0.2em] font-bold transition-all duration-300 shadow-lg hover:shadow-accent/25 hover:shadow-xl"
                style={{ background: "linear-gradient(135deg, #11522f, #154c30)" }}
              >
                Devis gratuit
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </motion.div>
          </nav>

          <button
            className="md:hidden p-2.5 hover:bg-secondary/80 transition-colors rounded-lg"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Menu"
          >
            <motion.div
              animate={{ rotate: isMobileMenuOpen ? 90 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </motion.div>
          </button>
        </div>
      </header>

      {/* ── Mobile Menu ──────────────────────── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
            animate={{ opacity: 1, clipPath: "inset(0 0 0% 0)" }}
            exit={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-8"
            style={{ background: "linear-gradient(135deg, #0d3320 0%, #154c30 60%, #1e4a2a 100%)" }}
          >
            {/* Animated decorative elements - Static for performance */}
            <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full border border-white/5" />
            <div className="absolute bottom-1/4 left-1/4 w-48 h-48 rounded-full border border-accent/10" />
            {/* Decorative blob */}
            <div className="absolute top-1/3 left-1/3 w-80 h-80 rounded-full opacity-[0.02]" style={{ background: "radial-gradient(circle, #e85d04, transparent)" }} />

            {navLinks.map((link, i) => (
              <motion.div
                key={link.path}
                initial={{ opacity: 0, x: -50, filter: "blur(8px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                transition={{ delay: 0.1 + i * 0.1, duration: 0.6, ease: "easeOut" }}
              >
                <Link
                  to={link.path}
                  className={`text-3xl md:text-4xl font-heading hover:text-accent transition-all duration-300 ${
                    isActive(link.path) ? "text-accent" : "text-white/90"
                  }`}
                >
                  {link.name}
                </Link>
              </motion.div>
            ))}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-8 pt-8 border-t border-white/10 text-center"
            >
              <p className="text-white/30 text-xs uppercase tracking-[0.3em]">EMROD SARL · Conakry, Guinée</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Content with Page Transitions ── */}
      <main className="flex-1">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>

      {/* ── Partners Section ───────────── */}
      <section className="bg-transparent py-16 relative overflow-hidden">
        <div className="container mx-auto px-6 text-center relative z-10">
          <h3 className="font-heading text-2xl md:text-3xl mb-12 text-primary">Ils nous font <span className="italic text-accent">confiance</span></h3>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-60 hover:opacity-100 transition-all duration-500">
            {/* Dummy partner logos for now */}
            <div className="flex items-center justify-center font-heading text-xl md:text-2xl font-bold tracking-widest text-foreground/50 hover:text-primary transition-colors">PARTENAIRE 1</div>
            <div className="flex items-center justify-center font-heading text-xl md:text-2xl font-bold tracking-widest text-foreground/50 hover:text-primary transition-colors">PARTENAIRE 2</div>
            <div className="flex items-center justify-center font-heading text-xl md:text-2xl font-bold tracking-widest text-foreground/50 hover:text-primary transition-colors">PARTENAIRE 3</div>
            <div className="flex items-center justify-center font-heading text-xl md:text-2xl font-bold tracking-widest text-foreground/50 hover:text-primary transition-colors">PARTENAIRE 4</div>
          </div>
        </div>
      </section>

      {/* ── Footer Wave Separator ────────────── */}
      <div className="relative">
        <svg
          viewBox="0 0 1440 80"
          className="w-full h-16 md:h-20 block -mb-1"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="wave-gradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0d3320" />
              <stop offset="50%" stopColor="#154c30" />
              <stop offset="100%" stopColor="#1a5535" />
            </linearGradient>
          </defs>
          <motion.path
            d="M0,50 C200,80 400,20 600,50 C800,80 1000,20 1200,50 C1350,65 1400,55 1440,50 L1440,80 L0,80 Z"
            fill="url(#wave-gradient)"
            initial={{ d: "M0,70 C200,70 400,70 600,70 C800,70 1000,70 1200,70 C1350,70 1400,70 1440,70 L1440,80 L0,80 Z" }}
            whileInView={{ d: "M0,50 C200,80 400,20 600,50 C800,80 1000,20 1200,50 C1350,65 1400,55 1440,50 L1440,80 L0,80 Z" }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
      </div>

      {/* ── Footer ───────────────────────────── */}
      <footer className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0d3320 0%, #154c30 70%, #1a5535 100%)" }}>
        {/* Decorative orbs — Static for maximum performance */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-[0.02] pointer-events-none" style={{ background: "radial-gradient(circle, #e85d04, transparent)" }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-[0.02] pointer-events-none" style={{ background: "radial-gradient(circle, #11522f, transparent)" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-[0.01] pointer-events-none" style={{ background: "radial-gradient(circle, #e85d04, transparent)" }} />

        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(45deg, #ffffff 0px, #ffffff 1px, transparent 0px, transparent 50%)", backgroundSize: "24px 24px" }} />

        <div className="container mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-3 gap-14 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="mb-6 group">
              <motion.img
                src={logo}
                alt="EMROD Logo"
                className="h-20 w-auto brightness-0 invert"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              />
            </div>
            <p className="text-sm text-white/55 max-w-sm leading-relaxed mb-6">
              Création artisanale de mobilier d'exception. Chaque pièce sublime votre intérieur avec un raffinement unique made in Guinée.
            </p>
            {/* Phone links with hover effect */}
            <div className="flex flex-col gap-2">
              {["+224 623 88 59 59", "+224 621 08 41 46"].map((num) => (
                <motion.a
                  key={num}
                  href={`tel:${num.replace(/\s/g, "")}`}
                  className="text-xs text-white/35 hover:text-accent transition-all tracking-wider inline-flex items-center gap-2 group w-fit"
                  whileHover={{ x: 4 }}
                >
                  <span className="w-4 h-[1px] bg-accent/40 group-hover:w-6 group-hover:bg-accent transition-all duration-300" />
                  {num}
                </motion.a>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.15 }}
          >
            <h4 className="font-heading text-xl mb-8 text-white/90 relative inline-block">
              Navigation
              <span className="absolute -bottom-2 left-0 w-8 h-[2px]" style={{ background: "linear-gradient(90deg, #e85d04, transparent)" }} />
            </h4>
            <ul className="space-y-4">
              {navLinks.map((link, i) => (
                <motion.li
                  key={link.path}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                >
                  <Link
                    to={link.path}
                    className="text-sm text-white/55 hover:text-accent transition-all duration-300 flex items-center gap-3 group"
                  >
                    <span className="w-4 h-[1px] bg-accent/40 group-hover:w-8 group-hover:bg-accent transition-all duration-500" />
                    <span className="group-hover:translate-x-1 transition-transform duration-300">{link.name}</span>
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <h4 className="font-heading text-xl mb-8 text-white/90 relative inline-block">
              L'Atelier
              <span className="absolute -bottom-2 left-0 w-8 h-[2px]" style={{ background: "linear-gradient(90deg, #e85d04, transparent)" }} />
            </h4>
            <ul className="text-sm text-white/55 space-y-4">
              <li className="leading-relaxed">
                T7, Corniche Nord<br />Virage du lac Sonfonia Centre<br />Conakry, Guinée
              </li>
              <li>
                <a href="mailto:contact@emroddf.com" className="hover:text-accent transition-colors inline-flex items-center gap-2 group">
                  <span className="group-hover:translate-x-1 transition-transform duration-300">contact@emroddf.com</span>
                </a>
              </li>
              <li>
                <a href="mailto:direction@emroddf.com" className="hover:text-accent transition-colors inline-flex items-center gap-2 group">
                  <span className="group-hover:translate-x-1 transition-transform duration-300">direction@emroddf.com</span>
                </a>
              </li>
              <li className="text-white/35 text-xs uppercase tracking-[0.2em] pt-4 border-t border-white/8">
                Lun–Sam · 8h–18h
              </li>
            </ul>

            {/* Mini CTA in footer */}
            <Link
              to="/contact"
              className="mt-8 inline-flex items-center gap-2 px-5 py-3 text-[10px] uppercase tracking-[0.2em] font-bold text-accent-foreground transition-all hover:scale-105 hover:shadow-lg hover:shadow-accent/20 shimmer-sweep"
              style={{ background: "linear-gradient(135deg, #e85d04, #b84600)" }}
            >
              Démarrer un projet
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </motion.div>
        </div>

        {/* Bottom bar — Enhanced */}
        <div className="border-t border-white/8 py-6 relative z-10">
          <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-xs text-white/25 tracking-[0.15em] uppercase">
              © {new Date().getFullYear()} EMROD SARL — Mobilier Sur-Mesure
            </p>
            <div className="flex items-center gap-4">
              <div className="w-1 h-1 rounded-full bg-accent/40 animate-pulse" />
              <p className="text-xs text-white/18 tracking-[0.15em]">
                Conakry · Guinée
              </p>
            </div>
          </div>
        </div>
      </footer>

      <Chatbot />
      <LeadPopup />
    </div>
  );
}
