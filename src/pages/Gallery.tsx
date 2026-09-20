import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import { X, ZoomIn, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { fetchGalleryImages, fetchGalleryVideos, type GalleryMedia } from "../lib/api";

import detailWood from "../assets/images/detail-wood.jpg";

// Une vidéo est lue en <video> si l'URL pointe vers un fichier (mp4/webm/blob),
// sinon en iframe (embed externe type YouTube / Drive)
function isVideoFile(url: string): boolean {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url) || url.includes('.blob.');
}

// Aperçu (poster) d'une vidéo externe : miniature YouTube ou Drive si dérivable
export function videoPoster(url: string): string | null {
  const yt = url.match(/youtube\.com\/embed\/([\w-]{6,})/);
  if (yt) return `https://i.ytimg.com/vi/${yt[1]}/hqdefault.jpg`;
  const drive = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  if (drive) return `https://drive.google.com/thumbnail?id=${drive[1]}&sz=w800`;
  return null;
}

/* Carte d'aperçu pour une vidéo externe : poster (si disponible) avec
   repli sur une carte dégradée élégante + bouton lecture */
function ExternalVideoCard({ url, title }: { url: string; title: string }) {
  const poster = videoPoster(url);
  return (
    <div className="relative w-full aspect-[4/3] group/vid">
      {/* Fond dégradé élégant (toujours présent sous le poster) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
           style={{ background: "linear-gradient(135deg, #0d3320 0%, #11522f 55%, #154c30 100%)" }}>
        <div className="absolute inset-0 opacity-[0.07]" style={{ background: "radial-gradient(circle at 70% 20%, #e85d04, transparent 60%)" }} />
        <div className="w-16 h-16 rounded-full flex items-center justify-center border border-white/25 bg-white/10 backdrop-blur-sm group-hover/vid:bg-[#e85d04] group-hover/vid:border-[#e85d04] transition-colors duration-300">
          <span className="text-white text-xl ml-1">▶</span>
        </div>
        <span className="text-white/70 text-[10px] uppercase tracking-[0.25em] font-medium">Vidéo</span>
      </div>
      {/* Poster par-dessus (masqué si indisponible) */}
      {poster && (
        <img
          src={poster}
          alt={title || "Vidéo"}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
      )}
      {/* Voile + titre au survol */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover/vid:opacity-100 transition-opacity duration-300 flex items-end p-4">
        <span className="text-white text-sm font-medium line-clamp-2">{title || "Voir la vidéo"}</span>
      </div>
      {/* Badge durée/play permanent */}
      <span className="absolute bottom-3 right-3 text-[9px] font-bold uppercase tracking-wider text-white px-2 py-1 rounded-sm bg-black/60 backdrop-blur-sm border border-white/10">
        ▶ Vidéo
      </span>
    </div>
  );
}

export default function Gallery() {
  const [activeTab, setActiveTab] = useState<'images' | 'videos'>('images');
  const [images, setImages] = useState<GalleryMedia[]>([]);
  const [videos, setVideos] = useState<GalleryMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<GalleryMedia | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const touchStartX = useRef(0);

  const headerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: headerRef, offset: ["start start", "end start"] });
  const headerY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const headerOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    Promise.all([fetchGalleryImages(), fetchGalleryVideos()])
      .then(([imagesData, videosData]) => {
        setImages(imagesData);
        setVideos(videosData);
      })
      .catch((err) => {
        console.error(err);
        setError("Impossible de charger la galerie. Veuillez vérifier votre connexion ou réessayer plus tard.");
      })
      .finally(() => setLoading(false));
  }, []);

  const currentItems = activeTab === 'images' ? images : videos;

  const openImage = (img: GalleryMedia, index: number) => {
    setSelectedImage(img);
    setSelectedIndex(index);
  };

  const prevImage = () => {
    const newIdx = (selectedIndex - 1 + currentItems.length) % currentItems.length;
    setSelectedIndex(newIdx);
    setSelectedImage(currentItems[newIdx]);
  };

  const nextImage = () => {
    const newIdx = (selectedIndex + 1) % currentItems.length;
    setSelectedIndex(newIdx);
    setSelectedImage(currentItems[newIdx]);
  };

  /* Keyboard nav */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!selectedImage) return;
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "Escape") setSelectedImage(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedImage, selectedIndex]);

  /* Touch / swipe */
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) { diff > 0 ? nextImage() : prevImage(); }
  };

  return (
    <div className="bg-transparent text-foreground pt-32 min-h-screen relative z-0">

      {/* ── PAGE HEADER ──────────────────────── */}
      <div className="container mx-auto max-w-7xl px-6 md:px-12 mb-16">
        <div ref={headerRef} className="relative pt-24 pb-20 overflow-hidden group">
          <motion.div style={{ y: headerY, opacity: headerOpacity }} className="absolute inset-0">
            <img src="/gallery/IMG-20260531-WA0048.jpg" alt="Gallery Header" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out animate-ken-burns" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(13,51,32,0.85) 0%, rgba(13,51,32,0.5) 100%)" }} />
          </motion.div>

          <div className="relative z-10 max-w-5xl px-8 md:px-16 text-white">
            <motion.div initial={{ opacity: 0, y: -20, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-white/20 text-[10px] uppercase tracking-[0.3em] font-medium mb-8 text-white/80">
                <span className="w-1.5 h-1.5 rounded-sm bg-accent" />
                Portfolio
              </div>
              <h1 className="text-4xl md:text-5xl font-light mb-6 font-heading leading-tight text-white">
                Nos{" "}
                <motion.span
                  className="italic inline-block font-normal text-gradient-animated"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
                >
                  Réalisations
                </motion.span>
              </h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="text-lg md:text-xl text-white/80 leading-relaxed font-light max-w-xl"
              >
                Découvrez nos derniers projets. Nos meubles s'intègrent parfaitement à tous les styles d'intérieurs.
              </motion.p>

              {!loading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9, duration: 0.8 }}
                  className="mt-8 flex flex-wrap gap-4"
                >
                  <button
                    onClick={() => setActiveTab('images')}
                    className={`px-6 py-2.5 rounded-sm font-medium uppercase tracking-widest text-[10px] sm:text-xs transition-all duration-300 ${activeTab === 'images' ? 'bg-accent text-white border border-accent' : 'bg-black/30 backdrop-blur-md text-white/70 hover:bg-white/20 border border-white/20 hover:text-white'}`}
                  >
                    Images ({images.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('videos')}
                    className={`px-6 py-2.5 rounded-sm font-medium uppercase tracking-widest text-[10px] sm:text-xs transition-all duration-300 ${activeTab === 'videos' ? 'bg-accent text-white border border-accent' : 'bg-black/30 backdrop-blur-md text-white/70 hover:bg-white/20 border border-white/20 hover:text-white'}`}
                  >
                    Vidéos ({videos.length})
                  </button>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── GALLERY MASONRY ──────────────────── */}
      <div className="container mx-auto max-w-7xl px-6 md:px-12 pb-24">

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="relative w-16 h-16 mb-6">
              <div className="absolute inset-0 rounded-sm border-2 border-accent/20 animate-pulse" />
              <div className="absolute inset-0 rounded-sm border-2 border-accent animate-spin-slow" style={{ borderTopColor: "transparent" }} />
              <div className="absolute inset-2 rounded-sm border-2 border-primary animate-spin" style={{ borderRightColor: "transparent", animationDirection: "reverse" }} />
            </div>
            <p className="tracking-[0.2em] uppercase text-[10px] font-bold text-foreground/40 animate-pulse">
              Chargement de la galerie...
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-32 bg-red-950/20 border border-red-500/20 rounded-sm relative overflow-hidden">
            <div className="text-6xl mb-6 opacity-80 animate-pulse">⚠️</div>
            <p className="text-red-400 italic text-lg max-w-md mx-auto">{error}</p>
          </div>
        ) : currentItems.length === 0 ? (
          <div className="text-center py-32 bg-secondary/30 border border-border rounded-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-noise opacity-5 pointer-events-none" />
            <div className="text-6xl mb-6 opacity-20 animate-float">{activeTab === 'videos' ? '🎥' : '🖼️'}</div>
            <p className="text-foreground/50 italic text-lg">Aucune réalisation dans cette catégorie.</p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
            {currentItems.map((img, i) => (
              <motion.div
                key={img.id}
                initial={{ opacity: 0, y: 50, scale: 0.9, filter: "blur(10px)" }}
                whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                viewport={{ once: true, margin: "50px" }}
                transition={{
                  duration: 0.8,
                  delay: (i % 8) * 0.1,
                  ease: [0.25, 0.46, 0.45, 0.94]
                }}
                className="relative group cursor-pointer overflow-hidden break-inside-avoid shadow-sm hover:shadow-2xl transition-all duration-700 bg-card border border-border/50 image-shine hover-lift rounded-sm"
                onClick={() => openImage(img, i)}
              >
                {img.media_type === 'video' && isVideoFile(img.url) ? (
                  <video
                    src={img.url}
                    muted
                    playsInline
                    preload="metadata"
                    className="w-full h-auto max-h-[70vh] object-cover group-hover:scale-110 transition-transform duration-1000 ease-[0.25,0.46,0.45,0.94]"
                  />
                ) : img.media_type === 'video' ? (
                  /* Vidéo externe : carte d'aperçu élégante (poster si disponible) */
                  <ExternalVideoCard url={img.url} title={img.title} />
                ) : (
                  <img
                    src={img.url}
                    alt={img.title || "Réalisation EMROD"}
                    className="w-full h-auto max-h-[70vh] object-cover group-hover:scale-110 transition-transform duration-1000 ease-[0.25,0.46,0.45,0.94]"
                    loading="lazy"
                  />
                )}

                {/* Overlay with animated gradient & icon */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center gap-4"
                  style={{ background: "radial-gradient(circle at center, rgba(13,51,32,0.6) 0%, rgba(232,93,4,0.3) 100%)" }}
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -90 }}
                    whileHover={{ scale: 1.1, rotate: 0 }}
                    className="bg-white/10 backdrop-blur-md text-white p-5 rounded-sm border border-white/20 transform scale-0 group-hover:scale-100 transition-all duration-500 delay-100"
                  >
                    {img.media_type === 'video' ? (
                      <div className="w-6 h-6 flex items-center justify-center text-xl">▶</div>
                    ) : (
                      <ZoomIn className="w-6 h-6" />
                    )}
                  </motion.div>
                  <div className="overflow-hidden">
                    <p className="text-white text-[10px] uppercase tracking-[0.2em] font-medium px-4 text-center line-clamp-1 translate-y-full group-hover:translate-y-0 transition-transform duration-500 delay-200">
                      {img.title || "Réalisation EMROD"}
                    </p>
                  </div>
                </div>

                {/* Number badge — sliding in */}
                <div className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center text-[10px] font-medium opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500" style={{ background: "linear-gradient(135deg, #e85d04, #b84600)", color: "#fff" }}>
                  {i + 1}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════
          FULLSCREEN LIGHTBOX — ENHANCED
      ══════════════════════════════════════ */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden"
            style={{ background: "rgba(8,26,16,0.92)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Background bokeh orbs — Dynamic */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] rounded-sm opacity-[0.07] blur-[100px] animate-float-slow animate-morph-blob" style={{ background: "#e85d04" }} />
              <div className="absolute bottom-[10%] right-[20%] w-[400px] h-[400px] rounded-sm opacity-[0.05] blur-[80px] animate-float" style={{ background: "#f97316", animationDelay: "-2s" }} />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-sm opacity-[0.03] blur-[120px] animate-pulse" style={{ background: "#11522f" }} />
            </div>

            {/* Top bar */}
            <motion.div 
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="absolute top-0 left-0 w-full p-6 md:p-8 flex justify-between items-center z-30"
            >
              <div className="flex items-center gap-6">
                <span className="text-white/40 text-[10px] uppercase tracking-[0.3em] font-medium border border-white/10 px-3 py-1 rounded-sm">
                  {selectedIndex + 1} <span className="mx-1 opacity-50">/</span> {currentItems.length}
                </span>
                <div className="font-heading text-white/90 text-xl md:text-2xl hidden md:block">
                  {selectedImage.title || "Réalisation EMROD"}
                </div>
              </div>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-white/50 hover:text-white p-3 md:p-4 bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-sm transition-all duration-300 border border-white/10 hover:border-accent group"
              >
                <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
              </button>
            </motion.div>

            {/* Mobile title */}
            <div className="absolute bottom-20 left-0 w-full text-center z-30 md:hidden px-6">
              <div className="font-heading text-white/90 text-lg line-clamp-1">
                {selectedImage.title || "Réalisation EMROD"}
              </div>
            </div>

            {/* Prev / Next Buttons */}
            {currentItems.length > 1 && (
              <>
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  onClick={prevImage}
                  className="absolute left-4 md:left-12 top-1/2 -translate-y-1/2 z-30 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 backdrop-blur-md p-4 md:p-5 rounded-sm transition-all duration-300 border border-white/10 hover:border-accent hover:-translate-x-2"
                >
                  <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
                </motion.button>
                <motion.button
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  onClick={nextImage}
                  className="absolute right-4 md:right-12 top-1/2 -translate-y-1/2 z-30 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 backdrop-blur-md p-4 md:p-5 rounded-sm transition-all duration-300 border border-white/10 hover:border-accent hover:translate-x-2"
                >
                  <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
                </motion.button>
              </>
            )}

            {/* Main image with morph transition */}
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedImage.id}
                initial={{ scale: 0.8, opacity: 0, filter: "blur(20px)" }}
                animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
                exit={{ scale: 1.1, opacity: 0, filter: "blur(10px)" }}
                transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="relative w-full max-w-7xl max-h-[85vh] flex items-center justify-center px-6 md:px-32 z-20"
              >
                {selectedImage.media_type === 'video' ? (
                  isVideoFile(selectedImage.url) ? (
                    <video
                      src={selectedImage.url}
                      controls
                      autoPlay
                      playsInline
                      className="max-w-full max-h-[85vh] object-contain shadow-2xl border border-white/5 bg-black"
                      style={{ boxShadow: "0 20px 80px rgba(0,0,0,0.5), 0 0 100px rgba(232,93,4,0.08)" }}
                    />
                  ) : (
                    <iframe
                      src={selectedImage.url}
                      className="w-[90vw] md:w-[70vw] h-[60vh] max-h-[85vh] shadow-2xl border border-white/5 rounded-sm bg-black"
                      allow="autoplay; fullscreen"
                    />
                  )
                ) : (
                  <img
                    src={selectedImage.url}
                    alt={selectedImage.title || "Réalisation EMROD"}
                    className="max-w-full max-h-[85vh] object-contain shadow-2xl border border-white/5"
                    style={{ boxShadow: "0 20px 80px rgba(0,0,0,0.5), 0 0 100px rgba(232,93,4,0.08)" }}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            {/* Pagination Line Indicator */}
            {currentItems.length > 1 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 w-64 h-1 bg-white/10 rounded-sm overflow-hidden hidden md:block"
              >
                <motion.div
                  className="h-full bg-gradient-to-r from-accent to-gold"
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `${((selectedIndex + 1) / currentItems.length) * 100}%`,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              </motion.div>
            )}

            <div className="absolute bottom-6 md:bottom-8 right-6 md:right-8 text-[10px] uppercase tracking-[0.3em] font-bold text-white/20">
              EMROD
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
