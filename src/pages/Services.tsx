import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, Search, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { fetchCatalogue, fetchCategoriesList, type Product } from "../lib/api";

import heroBg2 from "../assets/images/hero-bg-2.jpg";

/* ── Skeleton shimmer card ─────────────── */
function SkeletonCard() {
  return (
    <div className="bg-card border border-border/50 overflow-hidden">
      <div className="aspect-square bg-secondary relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(90deg, transparent 0%, rgba(232,93,4,0.06) 40%, rgba(232,93,4,0.12) 50%, rgba(232,93,4,0.06) 60%, transparent 100%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.8s linear infinite",
          }}
        />
      </div>
      <div className="p-6 space-y-3">
        <div className="h-5 w-3/4 bg-secondary rounded animate-pulse" />
        <div className="h-3 w-full bg-secondary/60 rounded animate-pulse" />
        <div className="h-3 w-2/3 bg-secondary/40 rounded animate-pulse" />
        <div className="h-8 w-1/3 bg-accent/10 rounded mt-4 animate-pulse" />
      </div>
    </div>
  );
}

/* ── Tilt card wrapper — Enhanced ──────── */
function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shine, setShine] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(800px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateZ(8px)`;
    setShine({ x: (x + 0.5) * 100, y: (y + 0.5) * 100 });
  };

  const handleMouseLeave = () => {
    if (ref.current) {
      ref.current.style.transform = "perspective(800px) rotateY(0deg) rotateX(0deg) translateZ(0px)";
    }
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
      style={{ transition: "transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)", transformStyle: "preserve-3d" }}
    >
      {/* Dynamic light reflection */}
      <div
        className="absolute inset-0 pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-inherit"
        style={{
          background: `radial-gradient(circle at ${shine.x}% ${shine.y}%, rgba(255,255,255,0.08) 0%, transparent 60%)`,
        }}
      />
      {children}
    </div>
  );
}

/* ════════════════════════════════════════
   SERVICES PAGE
════════════════════════════════════════ */
export default function Services() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("Tous");
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    Promise.all([fetchCatalogue(), fetchCategoriesList()])
      .then(([productsData, categoriesData]) => {
        setItems(productsData);
        setAllCategories(categoriesData);
      })
      .catch((err) => {
        console.error(err);
        setError("Impossible de charger le catalogue. Veuillez réessayer plus tard.");
      })
      .finally(() => setLoading(false));
  }, []);

  // Use all categories from Drive folders
  const categories = ["Tous", ...allCategories];

  const filteredItems = items.filter((item) => {
    if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase()) && !item.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filter === "Tous") return true;
    return item.category === filter;
  });

  return (
    <div className="bg-transparent text-foreground pt-24 pb-20 min-h-screen overflow-hidden">

      {/* ── PAGE HEADER ──────────────────────── */}
      <div className="container mx-auto max-w-7xl px-6 md:px-12 mb-16">
        <div className="relative pt-24 pb-20 overflow-hidden group">
          <div className="absolute inset-0">
            <img src="/gallery/IMG-20260531-WA0038.jpg" alt="Catalogue Header" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out animate-ken-burns" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(13,51,32,0.8) 0%, rgba(13,51,32,0.4) 100%)" }} />
          </div>

          <div className="relative z-10 max-w-5xl px-8 md:px-16 text-white">
            <motion.div initial={{ opacity: 0, y: -20, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-white/20 text-[10px] uppercase tracking-[0.3em] font-medium mb-8 text-white/80">
                <span className="w-1.5 h-1.5 rounded-sm bg-accent" />
                Collection &amp; Essences
              </div>

              <h1 className="text-4xl md:text-5xl font-light mb-6 font-heading leading-tight text-white">
                Notre{" "}
                <span className="text-gradient-animated font-medium">Catalogue</span>
              </h1>

              <p className="text-base md:text-lg text-white/80 leading-relaxed font-light max-w-xl">
                Découvrez nos modèles. Les dimensions, le choix du bois et les finitions
                sont entièrement personnalisables selon vos envies.
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-6 md:px-12">

        {/* ── FILTERS ──────────────────────────── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6 border-b border-border pb-8">
          {/* Animated pill filter */}
          <div className="flex gap-2 relative bg-secondary p-1.5 rounded-sm border border-border overflow-x-auto hide-scrollbar max-w-full">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`relative z-10 px-5 py-2 text-[10px] uppercase tracking-[0.2em] transition-all duration-300 cursor-pointer font-medium rounded-sm ${
                  filter === cat ? "text-primary-foreground" : "text-secondary-foreground hover:bg-border/40"
                }`}
              >
                {filter === cat && (
                  <motion.div
                    layoutId="activeFilterPill"
                    className="absolute inset-0 rounded-sm -z-10 shimmer-sweep"
                    style={{ background: "linear-gradient(135deg, #11522f, #154c30)" }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                {cat}
              </button>
            ))}
          </div>

          {/* Search — Enhanced */}
          <div className="relative w-full md:w-auto group">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un modèle..."
              className="w-full md:w-72 bg-card border border-border focus:border-accent pl-10 pr-4 py-2.5 text-xs outline-none transition-all duration-300 rounded-sm"
            />
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-foreground/40 group-focus-within:text-accent transition-colors" />
          </div>
        </div>

        {/* Count indicator */}
        {!loading && filteredItems.length > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs uppercase tracking-[0.2em] text-foreground/35 mb-8 font-medium"
          >
            {filteredItems.length} modèle{filteredItems.length > 1 ? "s" : ""} disponible{filteredItems.length > 1 ? "s" : ""}
          </motion.p>
        )}

        {/* ── GALLERY GRID ─────────────────────── */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-32 bg-red-950/20 border border-red-500/20 rounded-sm"
          >
            <div className="text-6xl mb-6 opacity-80">⚠️</div>
            <p className="text-red-400 text-lg mb-6 max-w-md mx-auto">{error}</p>
          </motion.div>
        ) : filteredItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-32 bg-secondary/30 border border-border"
          >
            <div className="text-6xl mb-6 opacity-20">🪑</div>
            <p className="text-foreground/50 text-lg mb-6">
              {searchTerm ? "Aucun modèle ne correspond à votre recherche." : "Le catalogue est en cours de mise à jour."}
            </p>
            <Link to="/contact" className="inline-flex items-center gap-2 text-accent uppercase tracking-widest text-xs font-semibold hover:underline border-b border-transparent hover:border-accent pb-1 transition-all">
              Nous contacter <ArrowRight className="w-3 h-3" />
            </Link>
          </motion.div>
        ) : (
          <motion.div layout className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {filteredItems.map((item, i) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.85, y: 30, filter: "blur(6px)" }}
                  animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 0.85, y: -20 }}
                  transition={{ duration: 0.5, delay: (i % 8) * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
                  key={item.id}
                >
                  <TiltCard className="h-full relative group">
                    <Link
                      to={`/catalogue/${item.categorySlug}/${item.modelSlug}`}
                      className="group cursor-pointer flex flex-col bg-card border border-border/50 hover:border-accent/40 transition-all duration-500 h-full relative overflow-hidden"
                    >
                      {/* Image */}
                      <div className="aspect-square overflow-hidden bg-secondary relative">
                        {item.mainImageUrl ? (
                          <img
                            src={item.mainImageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-foreground/20 text-5xl">🪑</div>
                        )}

                        {/* Gradient overlay on hover — wipe effect */}
                        <div
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-600 flex items-end p-6"
                          style={{ background: "linear-gradient(to top, rgba(21,76,48,0.85) 0%, rgba(21,76,48,0.3) 40%, transparent 100%)" }}
                        >
                          <motion.span
                            initial={{ y: 20, opacity: 0 }}
                            whileHover={{ y: 0, opacity: 1 }}
                            className="translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-400 text-white font-medium flex items-center gap-2 text-sm"
                          >
                            Voir les détails <ArrowRight className="w-4 h-4" />
                          </motion.span>
                        </div>

                        {/* Prix badge — Enhanced with elastic pop */}
                        {item.prix && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.5, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ delay: i * 0.05 + 0.3, type: "spring", stiffness: 400, damping: 15 }}
                            className="absolute top-3 right-3 px-3 py-1.5 text-xs font-medium text-accent-foreground"
                            style={{ background: "linear-gradient(135deg, #e85d04, #b84600)" }}
                          >
                            {item.prix}
                          </motion.div>
                        )}
                      </div>

                      {/* Card content */}
                      <div className="p-6 flex-1 flex flex-col justify-between relative">
                        {/* Gold accent line top */}
                        <div className="absolute top-0 left-6 right-6 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: "linear-gradient(90deg, transparent, #e85d0450, transparent)" }} />

                        <div className="mb-4">
                          <h3 className="font-heading text-xl text-primary font-medium line-clamp-1 mb-2 group-hover:text-accent transition-colors duration-300">
                            {item.name}
                          </h3>
                          <p className="text-foreground/45 text-sm leading-relaxed line-clamp-2">
                            {item.description || "Collection intemporelle, finitions au choix."}
                          </p>
                        </div>

                        <div className="border-t border-border/50 pt-4 mt-auto flex justify-between items-center">
                          <span className="text-xs uppercase tracking-widest text-foreground/25">
                            {item.imageCount} image{item.imageCount > 1 ? "s" : ""}
                          </span>
                          <span className="text-xs font-bold text-accent flex items-center gap-1">
                            {item.prix ? item.prix : "Sur demande"}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </TiltCard>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* ── FOOTER CALLOUT ───────────────────── */}
      <div className="container mx-auto max-w-7xl px-6 md:px-12 mt-24">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95, filter: "blur(8px)" }}
          whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
          viewport={{ once: true }}
          className="text-primary-foreground p-12 md:p-20 text-center relative overflow-hidden group"
          style={{ background: "linear-gradient(135deg, #0d3320 0%, #154c30 60%, #1a5535 100%)" }}
        >
          {/* Animated orbs */}
          <div className="absolute top-0 right-0 w-40 h-40 rounded-sm opacity-10 group-hover:scale-150 transition-transform duration-1000" style={{ background: "#e85d04" }} />
          <div className="absolute bottom-0 left-0 w-56 h-56 rounded-sm opacity-5 group-hover:scale-150 transition-transform duration-1000" style={{ background: "#e85d04" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 opacity-[0.02] transition-opacity duration-1000 pointer-events-none" style={{ background: "radial-gradient(circle, #ffffff, transparent)" }} />

          {/* Gold thin border on hover */}
          <div className="absolute inset-0 border-2 opacity-0 group-hover:opacity-15 transition-opacity duration-500" style={{ borderColor: "#e85d04" }} />
          {/* Pattern */}
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(45deg, #ffffff 0px, #ffffff 1px, transparent 0px, transparent 50%)", backgroundSize: "24px 24px" }} />

          <div className="relative z-10">
            <div className="text-xs uppercase tracking-[0.3em] font-medium mb-6" style={{ color: "#e85d04" }}>— Sur-Mesure —</div>
            <h2 className="text-3xl md:text-5xl font-heading mb-6">Un modèle vous intéresse ?</h2>
            <p className="max-w-2xl mx-auto text-primary-foreground/65 mb-10 text-lg leading-relaxed">
              Contactez-nous avec la référence du modèle. Nous pourrons l'adapter à vos mesures ou nous en inspirer pour votre projet.
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/contact"
                className="shimmer-sweep inline-flex items-center justify-center gap-3 px-8 py-4 text-accent-foreground uppercase tracking-[0.2em] text-xs font-medium transition-all group/btn"
                style={{ background: "linear-gradient(135deg, #e85d04, #b84600)" }}
              >
                Demander un devis estimatif
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-2 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
