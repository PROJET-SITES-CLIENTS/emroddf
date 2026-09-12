import { motion, useScroll, useTransform, Variants, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";
import { Star, CheckCircle, ShieldCheck, Gem, ArrowRight, Quote, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { fetchGalleryImages, GalleryImage, fetchCatalogUrl } from "../lib/api";
import { useRef, useState, useEffect } from "react";
import heroBg from "../assets/images/hero-bg.jpg";
import aboutArtisan from "../assets/images/about-artisan.jpg";
import heroBg2 from "../assets/images/hero-bg-2.jpg";

/* ── Animation variants ─────────────────── */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 50, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 1, ease: [0.25, 0.46, 0.45, 0.94] } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.18, delayChildren: 0.1 } }
};

const wordVariants: Variants = {
  hidden: { opacity: 0, y: 40, rotateX: -20, filter: "blur(4px)" },
  visible: { opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)", transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] } }
};

/* ── Animated Counter ───────────────────── */
function AnimatedCounter({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const duration = 2200;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      // Elastic easing for overshoot effect
      const eased = progress < 1 
        ? 1 - Math.pow(1 - progress, 4) 
        : 1;
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, target]);

  return <span ref={ref}>{prefix}{count}{suffix}</span>;
}

/* ── Floating Particle ──────────────────── */
function Particle({ style }: { style: React.CSSProperties }) {
  return <div className="particle" style={style} />;
}

/* ── Sparkle Particle Component ─────────── */
function SparkleParticle({ delay, x, y, size }: { delay: number; x: string; y: string; size: number }) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: x, top: y }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: [0, 1, 0],
        scale: [0, 1, 0],
        rotate: [0, 180, 360],
      }}
      transition={{ 
        duration: 3,
        repeat: Infinity,
        delay,
        ease: "easeInOut",
      }}
    >
      <Sparkles className="text-accent" style={{ width: size, height: size, opacity: 0.6 }} />
    </motion.div>
  );
}

/* ── Testimonial Carousel ───────────────── */
const testimonials = [
  { text: "Une qualité exceptionnelle. La table à manger dessinée pour notre loft est devenue la pièce maîtresse absolue. Un travail remarquable sur les joints et le vernis.", author: "Sophie L.", role: "Architecte d'intérieur" },
  { text: "L'écoute, la patience, et le niveau de détail de la créatrice sont inégalables. Le meuble TV sur-mesure s'intègre parfaitement et cache intelligemment toute la technique.", author: "Marc & Valérie", role: "Clients particuliers" },
  { text: "EMROD a su transformer ma vision en réalité. La bibliothèque sur-mesure occupe toute la hauteur sous plafond avec une précision au millimètre. Impressionnant.", author: "Jean-Paul M.", role: "Entrepreneur" },
];

function TestimonialCarousel() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrent((c) => (c + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const go = (idx: number) => {
    setDirection(idx > current ? 1 : -1);
    setCurrent(idx);
  };

  const slideVariants: Variants = {
    enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 100 : -100, scale: 0.92, rotateY: dir > 0 ? 8 : -8 }),
    center: { opacity: 1, x: 0, scale: 1, rotateY: 0, transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] } },
    exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -100 : 100, scale: 0.92, rotateY: dir > 0 ? -8 : 8, transition: { duration: 0.5 } }),
  };

  const t = testimonials[current];

  return (
    <div className="relative" style={{ perspective: "1200px" }}>
      <AnimatePresence custom={direction} mode="wait">
        <motion.div
          key={current}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="bg-card p-8 md:p-12 border border-border relative overflow-hidden min-h-[260px] hover-glow"
        >
          {/* Accent corners — animated */}
          <motion.div 
            className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-accent"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          />
          <motion.div 
            className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4"
            style={{ borderColor: "#e85d04" }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          />

          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-700 pointer-events-none" style={{ background: "radial-gradient(circle at 20% 20%, rgba(232, 93, 4, 0.04), transparent 60%)" }} />

          <Quote className="w-10 h-10 mb-6" style={{ color: "#e85d04" }} />
          <p className="text-xl md:text-2xl italic leading-relaxed text-foreground/80 mb-8 font-heading font-light">
            "{t.text}"
          </p>
          <div className="flex items-center gap-4 border-t border-border pt-6">
            <motion.div
              className="w-14 h-14 flex items-center justify-center font-heading text-2xl text-primary-foreground"
              style={{ background: "linear-gradient(135deg, #154c30, #e85d04)" }}
              whileHover={{ rotate: 10, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {t.author.charAt(0)}
            </motion.div>
            <div>
              <div className="font-bold text-primary text-lg">{t.author}</div>
              <div className="text-xs text-foreground/50 uppercase tracking-widest">{t.role}</div>
            </div>
            {/* Stars with stagger */}
            <div className="ml-auto flex gap-1">
              {[...Array(5)].map((_, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, scale: 0, rotate: -180 }} 
                  animate={{ opacity: 1, scale: 1, rotate: 0 }} 
                  transition={{ delay: 0.4 + i * 0.1, type: "spring", stiffness: 400 }}
                >
                  <Star className="w-4 h-4 fill-current" style={{ color: "#e85d04" }} />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Controls */}
      <div className="flex items-center justify-between mt-8">
        <div className="flex gap-2">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              className={`transition-all duration-300 rounded-sm ${i === current ? "w-10 h-2.5" : "w-2.5 h-2.5 hover:bg-accent/50"}`}
              style={{ background: i === current ? "linear-gradient(90deg, #e85d04, #f97316)" : undefined, backgroundColor: i !== current ? "var(--color-border)" : undefined }}
              aria-label={`Témoignage ${i + 1}`}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <motion.button 
            onClick={() => go((current - 1 + testimonials.length) % testimonials.length)} 
            className="w-10 h-10 border border-border hover:border-accent hover:bg-accent hover:text-accent-foreground transition-all flex items-center justify-center"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronLeft className="w-4 h-4" />
          </motion.button>
          <motion.button 
            onClick={() => go((current + 1) % testimonials.length)} 
            className="w-10 h-10 border border-border hover:border-accent hover:bg-accent hover:text-accent-foreground transition-all flex items-center justify-center"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   HOME PAGE
════════════════════════════════════════ */
export default function Home() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const yImage = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const opacityText = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const yText = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);
  const scaleImage = useTransform(scrollYProgress, [0, 1], [1, 1.15]);

  const heroImages = [
    "/hero-new.jpg",
    "/gallery/IMG-20260531-WA0038.jpg",
    "/gallery/IMG-20260531-WA0040.jpg",
    "/gallery/IMG-20260531-WA0062.jpg"
  ];
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHeroSlide((prev) => (prev + 1) % heroImages.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  /* Ripple on CTA button */
  const handleRipple = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement("span");
    ripple.className = "ripple-effect";
    const size = Math.max(rect.width, rect.height) * 2;
    ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px`;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);
  };

  return (
    <div className="bg-transparent text-foreground overflow-hidden">

      {/* ══════════════════════════════════════
          HERO — PREMIUM FULLSCREEN
      ══════════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-[100dvh] lg:min-h-[85vh] flex items-center justify-center pt-32 pb-24 overflow-hidden">
        {/* Background Image Container with Parallax and Ken Burns */}
        <motion.div style={{ y: yImage, scale: scaleImage }} className="absolute inset-0 z-0">
          <AnimatePresence mode="popLayout">
            <motion.img
              key={currentHeroSlide}
              src={heroImages[currentHeroSlide]}
              alt="Mobilier d'exception"
              className="absolute w-full h-full object-cover animate-ken-burns"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
            />
          </AnimatePresence>
          {/* Sombre overlay to make text pop */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(8,26,16,0.6) 0%, rgba(8,26,16,0.4) 50%, rgba(8,26,16,0.9) 100%)" }} />
          <div className="absolute inset-0 bg-black/20" />
        </motion.div>

        {/* Lightweight decorative static elements */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] opacity-[0.03]" style={{ background: "radial-gradient(circle, #e85d04, transparent)" }} />
          <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] opacity-[0.02]" style={{ background: "radial-gradient(circle, #f97316, transparent)" }} />
        </div>

        {/* Content */}
        <div className="container mx-auto max-w-7xl px-6 md:px-12 relative z-10 flex flex-col items-center text-center">
          <motion.div style={{ opacity: opacityText, y: yText }} className="max-w-4xl">
            <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="flex flex-col items-center">
              
              {/* Badge */}
              <motion.div variants={fadeUp} className="inline-flex items-center justify-center gap-2.5 px-6 py-3 mb-10 relative bg-black/20 backdrop-blur-md rounded-sm border border-white/20">
                <span className="w-2 h-2 rounded-sm bg-accent animate-pulse" />
                <span className="text-[10px] sm:text-xs uppercase tracking-[0.3em] font-medium text-white">
                  Sur mesure / Fait par des femmes
                </span>
              </motion.div>

              {/* Title */}
              <motion.div variants={fadeUp} className="mb-8 w-full">
                <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[1.05] tracking-tight font-heading font-light text-white">
                  <span className="block mb-2">Des meubles uniques,</span>
                  <span className="text-accent italic font-normal text-gradient-animated block">sur mesure.</span>
                </h1>
              </motion.div>

              <motion.p variants={fadeUp} className="text-lg md:text-xl lg:text-2xl text-white/85 mb-12 max-w-2xl leading-relaxed tracking-wide font-light">
                Créés par des femmes pour votre intérieur. Nous créons des meubles solides et beaux, en mélangeant le travail à la main et des idées modernes.
              </motion.p>

              {/* CTAs */}
              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-6 w-full justify-center">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
                  <button
                    onClick={async (e) => {
                      handleRipple(e as any);
                      const btn = e.currentTarget;
                      const originalText = btn.innerHTML;
                      btn.innerHTML = "Téléchargement...";
                      const driveUrl = await fetchCatalogUrl();
                      if (driveUrl) {
                        window.location.href = driveUrl;
                      } else {
                        alert("Le catalogue est en cours de mise à jour et sera disponible très bientôt.");
                      }
                      setTimeout(() => { btn.innerHTML = originalText; }, 2000);
                    }}
                    className="ripple-btn shimmer-sweep w-full inline-flex items-center justify-center px-10 py-5 bg-primary text-white tracking-[0.2em] uppercase text-xs font-bold transition-all hover:shadow-[0_0_30px_rgba(17,82,47,0.6)] rounded-sm border border-primary"
                  >
                    Découvrir le catalogue
                    <ArrowRight className="w-4 h-4 ml-3" />
                  </button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
                  <Link
                    to="/contact"
                    className="w-full inline-flex items-center justify-center px-10 py-5 border border-white/40 bg-black/30 backdrop-blur-md text-white hover:border-accent hover:text-accent hover:bg-black/50 tracking-[0.2em] uppercase text-xs font-bold transition-all rounded-sm shadow-xl"
                  >
                    Création Sur-Mesure
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-10"
        >
          <span className="text-[10px] uppercase tracking-[0.3em] text-white/50 font-bold drop-shadow-md">Défiler</span>
          <motion.div
            className="w-5 h-9 border-2 border-white/30 rounded-sm flex items-start justify-center pt-1.5"
            animate={{ borderColor: ["rgba(255,255,255,0.2)", "rgba(232,93,4,0.5)", "rgba(255,255,255,0.2)"] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <motion.div
              className="w-1 h-2.5 rounded-sm bg-accent"
              animate={{ y: [0, 12, 0], opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════
          MARQUEE ANIMÉ
      ══════════════════════════════════════ */}
      <section className="border-y border-border/50 overflow-hidden py-5 relative" style={{ background: "linear-gradient(90deg, #f0ede6, #faf9f6, #f0ede6)" }}>
        {/* Subtle glow at edges */}
        <div className="absolute left-0 top-0 bottom-0 w-20 z-10" style={{ background: "linear-gradient(90deg, #f0ede6, transparent)" }} />
        <div className="absolute right-0 top-0 bottom-0 w-20 z-10" style={{ background: "linear-gradient(270deg, #f0ede6, transparent)" }} />
        
        <div className="flex whitespace-nowrap">
          <div className="animate-marquee flex gap-0 flex-shrink-0">
            {['Bois Nobles de Guinée', '✦', 'Savoir-Faire', '✦', 'Haute Couture', '✦', 'Finition Main', '✦', 'Éthique & Durabilité', '✦', 'Sur-Mesure', '✦', 'Excellence', '✦', 'Bois Nobles de Guinée', '✦', 'Savoir-Faire', '✦', 'Haute Couture', '✦', 'Finition Main', '✦', 'Éthique & Durabilité', '✦', 'Sur-Mesure', '✦', 'Excellence', '✦'].map((brand, i) => (
              <span
                key={i}
                className={`font-heading text-xl font-medium tracking-wider px-8 transition-colors ${brand === '✦' ? 'text-accent text-base animate-pulse' : 'text-foreground/40'}`}
              >
                {brand}
              </span>
            ))}
          </div>
          <div className="animate-marquee flex gap-0 flex-shrink-0" aria-hidden>
            {['Bois Nobles de Guinée', '✦', 'Savoir-Faire', '✦', 'Haute Couture', '✦', 'Finition Main', '✦', 'Éthique & Durabilité', '✦', 'Sur-Mesure', '✦', 'Excellence', '✦', 'Bois Nobles de Guinée', '✦', 'Savoir-Faire', '✦', 'Haute Couture', '✦', 'Finition Main', '✦', 'Éthique & Durabilité', '✦', 'Sur-Mesure', '✦', 'Excellence', '✦'].map((brand, i) => (
              <span
                key={i}
                className={`font-heading text-xl font-medium tracking-wider px-8 ${brand === '✦' ? 'text-accent text-base animate-pulse' : 'text-foreground/40'}`}
              >
                {brand}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          VALUES — BENTO GRID
      ══════════════════════════════════════ */}
      <section className="py-24 bg-transparent relative overflow-hidden">
        {/* Background decorations - Static to preserve performance */}
        <div className="absolute top-0 right-0 w-96 h-96 opacity-[0.02] pointer-events-none" style={{ background: "radial-gradient(circle, #e85d04, transparent)" }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 opacity-[0.01] pointer-events-none" style={{ background: "radial-gradient(circle, #154c30, transparent)" }} />

        <div className="container mx-auto max-w-7xl px-6 md:px-12">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center max-w-3xl mx-auto mb-20"
          >
            <motion.div variants={fadeUp} className="inline-block text-xs uppercase tracking-[0.3em] font-medium text-accent mb-4">
              — Notre Engagement —
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-heading mb-6 tracking-tight">
              Notre engagement <span className="text-gradient-animated">qualité</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-lg text-foreground/55 leading-relaxed">
              Nous créons des meubles solides et beaux, en mélangeant le travail à la main et des idées modernes.
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Gem, title: "Matériaux Nobles", text: "Nous sélectionnons scrupuleusement nos chênes, noyers, cuirs pleine fleur, et métaux texturés auprès de fournisseurs éthiques, pour un rendu incomparable.", num: "01", color: "#e85d04" },
              { icon: CheckCircle, title: "Finition Haute Couture", text: "L'ajustement au millimètre. Nos vernis et huiles naturelles sont appliqués à la main pour révéler la beauté singulière de chaque veinure.", num: "02", color: "#e85d04" },
              { icon: ShieldCheck, title: "Durabilité Absolue", text: "Nous ne créons pas de meubles jetables. Nos créations sont des héritages conçus pour traverser les décennies et résister aux aléas du temps.", num: "03", color: "#154c30" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 60, filter: "blur(6px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.15, duration: 0.7, ease: "easeOut" }}
                whileHover={{ y: -14, scale: 1.03, rotateY: 3 }}
                className="group bg-card border border-border p-8 hover:border-accent/40 transition-all duration-500 relative overflow-hidden cursor-pointer"
                style={{ transformStyle: "preserve-3d", perspective: "800px" }}
              >
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 0%, ${item.color}0a, transparent 70%)` }} />

                {/* Top accent bar — animated scale */}
                <motion.div 
                  className="absolute top-0 left-0 w-full h-[2px]"
                  style={{ background: `linear-gradient(90deg, ${item.color}, transparent)` }}
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.15, duration: 0.8 }}
                />

                {/* Watermark number — slide up on hover */}
                <div className="absolute -bottom-4 -right-2 font-heading text-8xl font-medium opacity-0 group-hover:opacity-[0.06] group-hover:-translate-y-4 transition-all duration-700 pointer-events-none select-none text-foreground">
                  {item.num}
                </div>

                {/* Icon with elastic pop on hover */}
                <motion.div 
                  className="w-10 h-10 mb-6 flex items-center justify-center relative"
                  whileHover={{ rotate: 15, scale: 1.2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <div className="absolute inset-0 rounded-sm opacity-10 group-hover:opacity-25 transition-all duration-500 group-hover:scale-125" style={{ background: item.color }} />
                  <item.icon
                    className="w-5 h-5 transition-all duration-500"
                    style={{ color: item.color }}
                  />
                </motion.div>

                <h3 className="font-heading text-2xl mb-4 text-primary group-hover:text-accent transition-colors duration-300">{item.title}</h3>
                <p className="text-foreground/60 leading-relaxed text-sm">{item.text}</p>

                {/* Bottom decorative line — animated */}
                <div className="mt-8 w-8 h-[2px] bg-border group-hover:w-20 transition-all duration-700" style={{ background: `linear-gradient(90deg, ${item.color}, transparent)` }} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          STATS BAND
      ══════════════════════════════════════ */}
      <section className="py-20 border-y border-border/30 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #f5f0e8, #faf9f6, #f5f0e8)" }}>
        {/* Animated gradient background */}
        <div className="absolute inset-0 animate-gradient-shift opacity-30 pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(232,93,4,0.03), transparent, rgba(17,82,47,0.03), transparent)", backgroundSize: "200% 200%" }} />

        <div className="container mx-auto max-w-7xl px-6 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: 5, suffix: "+", label: "Ans d'Expertise" },
              { value: 200, suffix: "+", label: "Projets Livrés" },
              { value: 100, suffix: "%", label: "Sur-Mesure" },
              { value: 48, suffix: "h", label: "Délai de réponse" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.6, type: "spring" }}
                className="text-center group"
              >
                <motion.div
                  className="font-heading text-4xl md:text-5xl font-light mb-3"
                  style={{ color: i % 2 === 0 ? "#154c30" : "#e85d04" }}
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </motion.div>
                <div className="text-xs uppercase tracking-[0.2em] text-foreground/45 font-medium">{stat.label}</div>
                {/* Subtle line under each stat */}
                <motion.div 
                  className="w-8 h-[1px] mx-auto mt-4"
                  style={{ background: i % 2 === 0 ? "#154c30" : "#e85d04", opacity: 0.3 }}
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 + i * 0.1, duration: 0.6 }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FEATURED SHOWCASE — SPLIT
      ══════════════════════════════════════ */}
      <section className="py-24 overflow-hidden relative" style={{ background: "linear-gradient(135deg, #0d3320 0%, #154c30 60%, #1a5535 100%)" }}>
        {/* Ambient light effects - Static to preserve performance */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] opacity-[0.05] pointer-events-none" style={{ background: "radial-gradient(circle, #e85d04, transparent)" }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] opacity-[0.03] pointer-events-none" style={{ background: "radial-gradient(circle, #e85d04, transparent)" }} />
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(45deg, #ffffff 0px, #ffffff 1px, transparent 0px, transparent 50%)", backgroundSize: "30px 30px" }} />

        <div className="container mx-auto max-w-7xl px-6 md:px-12">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            <motion.div
              initial={{ opacity: 0, x: -80, filter: "blur(8px)" }}
              whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative aspect-square group cursor-pointer"
            >
              {/* Clip-path reveal animation */}
              <motion.div
                className="w-full h-full overflow-hidden border border-border relative z-10"
                initial={{ clipPath: "inset(0 100% 0 0)" }}
                whileInView={{ clipPath: "inset(0 0% 0 0)" }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, delay: 0.2, ease: [0.76, 0, 0.24, 1] }}
              >
                <img src={aboutArtisan} alt="La Signature EMROD" className="w-full h-full object-cover brightness-90 group-hover:scale-110 transition-transform duration-1000 ease-out animate-ken-burns-reverse" />
                {/* Overlay shimmer on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: "linear-gradient(135deg, rgba(232,93,4,0.12) 0%, transparent 50%)" }} />
              </motion.div>

              {/* Decorative border offset — Enhanced animation */}
              <motion.div
                className="absolute -bottom-10 -right-10 w-64 h-64 border-2 hidden md:block"
                style={{ borderColor: "#e85d0450" }}
                initial={{ opacity: 0, x: 20, y: 20 }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.8, duration: 0.8 }}
                whileHover={{ x: 8, y: 8 }}
              />
              <motion.div
                className="absolute -top-4 -left-4 w-16 h-16 border-t-2 border-l-2"
                style={{ borderColor: "#e85d0450" }}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 1 }}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 80, filter: "blur(8px)" }}
              whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: 0.3, duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <motion.div
                className="uppercase tracking-[0.3em] text-xs font-medium mb-6"
                style={{ color: "#e85d04" }}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
              >
                ✦ La Signature EMROD
              </motion.div>
              <h2 className="text-4xl md:text-5xl font-heading mb-8 leading-tight text-white">
                Le choix de la <br />
                <span className="italic font-light text-gradient-animated">qualité.</span>
              </h2>
              <div className="space-y-6 text-lg leading-relaxed mb-12" style={{ color: "rgba(255,255,255,0.65)" }}>
                <p>Vous êtes au centre de chaque création. Nous sélectionnons soigneusement chaque pièce de bois pour concevoir avec vous des meubles robustes, esthétiques et parfaitement adaptés à votre style de vie.</p>
                <p>Chaque pièce est le fruit d'un travail manuel minutieux, pensée pour dépasser vos attentes et magnifier votre intérieur.</p>
              </div>

              {/* Mini stats inline — Enhanced */}
              <div className="flex gap-8 mb-10 pt-8 border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                {[{ v: "100%", l: "Artisanal" }, { v: "0", l: "Déchet" }, { v: "∞", l: "Personnalisable" }].map((s, i) => (
                  <motion.div
                    key={i}
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.7 + i * 0.1 }}
                    whileHover={{ scale: 1.1 }}
                  >
                    <div className="font-heading text-3xl font-medium" style={{ color: "#e85d04" }}>{s.v}</div>
                    <div className="text-xs uppercase tracking-[0.2em] mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>{s.l}</div>
                  </motion.div>
                ))}
              </div>

              <Link
                to="/a-propos"
                className="inline-flex items-center font-medium text-sm tracking-widest uppercase group transition-colors"
                style={{ color: "#e85d04" }}
              >
                Découvrir notre histoire
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-3 transition-transform duration-300" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          INSPIRATIONS / PORTFOLIO (NEW GALLERY)
      ══════════════════════════════════════ */}
      <section className="py-24 bg-transparent relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] opacity-[0.03] pointer-events-none" style={{ background: "radial-gradient(circle, #e85d04, transparent)" }} />
        
        <div className="container mx-auto max-w-7xl px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="text-xs uppercase tracking-[0.3em] font-medium text-accent mb-4">— Inspirations —</div>
            <h2 className="text-4xl md:text-5xl font-heading mb-4 text-primary">Nos plus belles <span className="text-gradient-animated">réalisations</span></h2>
            <p className="text-foreground/55 max-w-2xl mx-auto">Une sélection de nos créations récentes, photographiées chez nos clients ou dans notre atelier.</p>
          </motion.div>

          <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
            {[
              "IMG-20260531-WA0035.jpg", "IMG-20260531-WA0079.jpg", "IMG-20260531-WA0040.jpg",
              "IMG-20260531-WA0051.jpg", "IMG-20260531-WA0042.jpg", "IMG-20260531-WA0088.jpg",
              "IMG-20260531-WA0038.jpg", "IMG-20260524-WA0011.jpg", "IMG-20260531-WA0062.jpg"
            ].map((img, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: (i % 3) * 0.15, duration: 0.7 }}
                whileHover={{ scale: 1.02, rotate: i % 2 === 0 ? 1 : -1 }}
                className="relative overflow-hidden group cursor-pointer border border-border/30"
              >
                <img src={`/gallery/${img}`} alt="Réalisation EMROD" className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center backdrop-blur-sm" style={{ background: "rgba(21, 76, 48, 0.4)" }}>
                  <span className="text-white font-heading text-xl font-light italic opacity-0 group-hover:opacity-100 transition-opacity delay-100 duration-500 translate-y-4 group-hover:translate-y-0">Découvrir</span>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-16">
            <Link to="/galerie" className="inline-flex items-center justify-center px-8 py-3 border border-accent text-accent uppercase tracking-widest text-xs font-medium hover:bg-accent hover:text-white transition-all">
              Voir toute la galerie
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          TESTIMONIALS — CAROUSEL
      ══════════════════════════════════════ */}
      <section className="py-24 relative overflow-hidden" style={{ background: "linear-gradient(180deg, #f5f0e8 0%, #faf9f6 100%)" }}>
        {/* Giant background quote — Enhanced */}
        <div className="absolute top-10 right-10 font-heading text-[12rem] leading-none select-none pointer-events-none animate-breathe" style={{ color: "#e85d0406", fontStyle: "italic" }}>"</div>
        <div className="absolute bottom-10 left-10 font-heading text-[8rem] leading-none select-none pointer-events-none" style={{ color: "#154c3004", fontStyle: "italic" }}>"</div>

        <div className="container mx-auto max-w-7xl px-6 md:px-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16 max-w-2xl mx-auto"
          >
            <div className="text-xs uppercase tracking-[0.3em] font-medium text-accent mb-4">— Ils nous font confiance —</div>
            <h2 className="text-4xl md:text-5xl font-heading mb-4 text-primary">Confiance <span className="text-gradient-animated">&</span> Excellence</h2>
            <p className="text-foreground/55">La satisfaction de nos clients est la plus belle preuve de notre engagement.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-3xl mx-auto"
          >
            <TestimonialCarousel />
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════ */}
      <section className="py-24 bg-transparent text-center px-6 relative overflow-hidden">
        {/* Animated background image */}
        <motion.div
          initial={{ scale: 1.3, opacity: 0 }}
          whileInView={{ scale: 1.05, opacity: 0.06 }}
          transition={{ duration: 2, ease: "easeOut" }}
          viewport={{ once: true }}
          className="absolute inset-0 bg-cover bg-center grayscale pointer-events-none animate-ken-burns"
          style={{ backgroundImage: `url(${heroBg2})` }}
        />

        {/* Animated orbs — Enhanced */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-sm opacity-5 blur-3xl animate-float" style={{ background: "radial-gradient(circle, #e85d04, transparent)" }} />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-sm opacity-5 blur-3xl animate-float-slow" style={{ background: "radial-gradient(circle, #154c30, transparent)" }} />
        </div>

        <div className="container mx-auto max-w-4xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.9, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
            viewport={{ once: true }}
          >
            <div className="text-xs uppercase tracking-[0.3em] font-bold text-accent mb-6">— Commençons ensemble —</div>
            <h2 className="text-4xl md:text-6xl mb-8 font-heading text-primary leading-tight">
              Prêt à lancer<br />
              <span className="italic font-light text-gradient-animated">votre projet ?</span>
            </h2>
            <p className="text-foreground/55 mb-12 text-xl max-w-2xl mx-auto leading-relaxed">
              Parlez-nous de vos envies. Ensemble, créons le meuble parfait pour votre intérieur.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block">
                <Link
                  to="/contact"
                  onClick={handleRipple}
                  className="ripple-btn shimmer-sweep inline-flex items-center gap-3 px-8 py-4 text-accent-foreground uppercase tracking-[0.2em] text-xs font-medium transition-all animate-pulse-scale rounded-sm"
                  style={{ background: "linear-gradient(135deg, #e85d04, #b84600)" }}
                >
                  Commencer le projet
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/galerie"
                  className="inline-flex items-center gap-3 px-10 py-5 border border-border bg-transparent uppercase tracking-[0.2em] text-sm font-bold transition-all hover:border-primary hover:bg-secondary hover-glow rounded-sm"
                >
                  Voir la galerie
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
