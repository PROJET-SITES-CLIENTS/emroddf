import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Loader2,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Package,
  Ruler,
  X,
  ZoomIn,
  Check,
  Link as LinkIcon,
  TreePine,
} from "lucide-react";
import { useParams, Link } from "react-router-dom";
import OrderModal from "../components/OrderModal";
import { fetchProductDetail, getImageUrl } from "../lib/api";
import heroBg from "../assets/images/hero-bg.jpg";

interface ProductImage {
  id: string;
  name: string;
  prix: string;
  prixNumeric: number;
  description: string;
  dimensions?: string;
  finition?: string;
  essence?: string;
}

interface ProductDetailData {
  folderId: string;
  name: string;
  prix: string;
  prixNumeric: number;
  description: string;
  dimensions?: string;
  finition?: string;
  essence?: string;
  mainImageId: string | null;
  images: ProductImage[];
}

function formatPrice(num: number): string {
  if (!num) return "Prix sur demande";
  return new Intl.NumberFormat("fr-FR").format(num) + " GNF";
}

export default function ProductDetail() {
  const { categorySlug, modelSlug } = useParams<{ categorySlug: string; modelSlug: string }>();
  const [product, setProduct] = useState<ProductDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [orderOpen, setOrderOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (!categorySlug || !modelSlug) return;
    fetchProductDetail(categorySlug, modelSlug)
      .then((data) => {
        if (data.folderId) setProduct(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [categorySlug, modelSlug]);

  const prev = useCallback(() => {
    if (!product) return;
    setCurrentIndex((i) => (i - 1 + product.images.length) % product.images.length);
  }, [product]);

  const next = useCallback(() => {
    if (!product) return;
    setCurrentIndex((i) => (i + 1) % product.images.length);
  }, [product]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [prev, next]);

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-accent animate-spin" />
          <p className="text-xs uppercase tracking-widest text-foreground/50 animate-pulse">
            Chargement du produit...
          </p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center gap-6 text-center px-6">
        <Package className="w-16 h-16 text-foreground/20" />
        <h2 className="font-heading text-3xl text-primary">Produit introuvable</h2>
        <Link
          to="/services"
          className="inline-flex items-center gap-2 text-accent text-sm uppercase tracking-widest hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Retour au catalogue
        </Link>
      </div>
    );
  }

  const currentImage = product.images[currentIndex];
  const displayPrix = currentImage?.prix || product.prix || "Prix sur demande";
  const displayPrixNumeric = currentImage?.prixNumeric || product.prixNumeric || 0;
  const displayDescription = currentImage?.description || product.description || "";
  const displayDimensions = currentImage?.dimensions || product.dimensions || "Sur-mesure";
  const displayFinition = currentImage?.finition || product.finition || "Premium";
  const displayEssence = currentImage?.essence || product.essence || "Bois massif";

  const acompteNumeric = Math.round(displayPrixNumeric * 0.6);
  const acompte = displayPrixNumeric
    ? formatPrice(acompteNumeric)
    : "À calculer";

// ... (in ProductDetail.tsx)
  return (
    <div className="min-h-screen bg-transparent text-foreground pt-32 pb-24">
      <div className="container mx-auto max-w-7xl px-6 md:px-12">
        {/* Breadcrumb / Back */}
        <div className="mb-8">
          <Link
            to="/services"
            className="inline-flex items-center gap-2 text-foreground/60 text-xs uppercase tracking-widest hover:text-accent transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Retour au Catalogue
          </Link>
        </div>

        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* ── Left: Image Gallery (Takes 7 columns on LG) ─────────────────────── */}
          <div className="lg:col-span-7 flex flex-col gap-4 lg:sticky lg:top-32">
            {/* Main image */}
            <div 
              className="relative bg-secondary/30 aspect-square md:aspect-[4/3] lg:aspect-[4/3] lg:max-h-[500px] overflow-hidden group rounded-xl cursor-pointer border border-border/50"
              onClick={() => setIsLightboxOpen(true)}
            >
              {product.images && product.images.length > 0 ? (
                <>
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={currentImage?.id}
                      src={getImageUrl(currentImage?.id)}
                      alt={currentImage?.name || product.name}
                      className="w-full h-full object-cover"
                      initial={{ opacity: 0, filter: "blur(10px)" }}
                      animate={{ opacity: 1, filter: "blur(0px)" }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                    />
                  </AnimatePresence>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                    <div className="bg-white/20 backdrop-blur-md p-4 rounded-full opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all duration-300 shadow-xl">
                      <ZoomIn className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  {/* Nav arrows */}
                  {product.images.length > 1 && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); prev(); }}
                        aria-label="Image précédente"
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-full text-white hover:bg-white hover:text-black transition-all opacity-0 group-hover:opacity-100 shadow-lg"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); next(); }}
                        aria-label="Image suivante"
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-full text-white hover:bg-white hover:text-black transition-all opacity-0 group-hover:opacity-100 shadow-lg"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-foreground/40 font-heading p-6 text-center">
                  <Package className="w-12 h-12 mb-4 opacity-20" />
                  <span className="text-sm">Image non disponible</span>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
                {product.images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setCurrentIndex(i)}
                    className={`relative flex-shrink-0 w-20 h-20 md:w-24 md:h-24 overflow-hidden rounded-lg snap-start transition-all duration-300 ${
                      i === currentIndex
                        ? "ring-2 ring-accent ring-offset-2 ring-offset-background"
                        : "opacity-50 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={getImageUrl(img.id)}
                      alt={img.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Right: Product info (Takes 5 columns on LG) ───────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-5 flex flex-col pt-4 lg:pt-8"
          >
            {/* Category */}
            <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-accent mb-4 flex items-center gap-2">
              <span className="w-8 h-[1px] bg-accent/50 block"></span>
              {product.category || "Mobilier sur-mesure"}
            </div>

            {/* Product name */}
            <h1 className="font-heading text-4xl md:text-5xl text-primary mb-6 leading-tight">
              {product.name}
            </h1>
            
            {/* Price block */}
            <div className="mb-8">
              <div className="flex items-baseline gap-4 mb-2">
                <span className="text-3xl font-light text-primary">
                  {displayPrix}
                </span>
              </div>
              {displayPrixNumeric > 0 && (
                <div className="inline-flex items-center gap-2 text-xs text-accent bg-accent/10 px-3 py-1.5 rounded-full border border-accent/20">
                  <span className="font-medium">Acompte à la commande (60%) :</span>
                  <span className="font-bold">{acompte}</span>
                </div>
              )}
            </div>

            {/* Divider */}
            <hr className="border-border mb-8" />

            {/* Description */}
            {displayDescription && (
              <div className="mb-8">
                <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-foreground/50 mb-3">À propos de ce modèle</h3>
                <p className="text-foreground/70 text-sm md:text-base leading-relaxed font-light whitespace-pre-wrap">
                  {displayDescription}
                </p>
              </div>
            )}

            {/* Key features */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
              {[
                { icon: Ruler, label: "Dimensions", value: displayDimensions },
                { icon: Package, label: "Finition", value: displayFinition },
                { icon: TreePine, label: "Essence", value: displayEssence },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex flex-col gap-1.5 p-4 bg-secondary/30 rounded-xl border border-border/50">
                  <Icon className="w-5 h-5 text-accent opacity-70 mb-1" />
                  <span className="text-[10px] uppercase tracking-widest text-foreground/50">{label}</span>
                  <span className="text-sm font-medium text-foreground line-clamp-1">{value}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex flex-col gap-4 mt-auto">
              <motion.button
                id="btn-passer-commande"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setOrderOpen(true)}
                className="w-full bg-primary text-primary-foreground uppercase tracking-[0.2em] text-xs font-bold py-5 flex items-center justify-center gap-3 hover:bg-primary/90 transition-colors shadow-[0_10px_30px_rgba(13,51,32,0.2)] hover:shadow-[0_15px_40px_rgba(13,51,32,0.3)] rounded-xl"
              >
                <ShoppingBag className="w-5 h-5" />
                Commander ce modèle
              </motion.button>
              
              <div className="grid grid-cols-2 gap-4">
                <Link
                  to="/contact"
                  className="w-full flex items-center justify-center text-center text-accent uppercase tracking-[0.2em] text-[10px] font-bold py-3.5 border-2 border-accent/20 hover:border-accent hover:bg-accent/5 transition-colors rounded-xl"
                >
                  Modifier sur-mesure
                </Link>
                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center justify-center gap-2 text-foreground/70 uppercase tracking-[0.2em] text-[10px] font-bold py-3.5 border-2 border-border/50 hover:border-foreground/30 hover:bg-secondary/30 transition-colors rounded-xl"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      Lien copié !
                    </>
                  ) : (
                    <>
                      <LinkIcon className="w-4 h-4" />
                      Copier le lien
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Legal note */}
            <div className="mt-8 p-4 bg-secondary/20 rounded-lg border border-border/30">
              <p className="text-[10px] text-foreground/50 leading-relaxed font-medium">
                * Le délai de fabrication vous sera communiqué lors de la confirmation avec notre équipe. L'acompte de 60% valide le lancement de la production.
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Order Modal */}
      <OrderModal
        isOpen={orderOpen}
        onClose={() => setOrderOpen(false)}
        produit={`${product.name} (Modèle ${currentIndex + 1})`}
        prix={displayPrix}
        prixNumeric={displayPrixNumeric}
      />

      {/* Lightbox */}
      {product.images && product.images.length > 0 && (
        <AnimatePresence>
          {isLightboxOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[300] bg-black/98 flex items-center justify-center backdrop-blur-xl"
              onClick={() => setIsLightboxOpen(false)}
            >
              <button
                onClick={() => setIsLightboxOpen(false)}
                className="absolute top-6 md:top-8 right-6 md:right-8 text-white/50 hover:text-white z-50 bg-white/5 hover:bg-white/10 border border-white/10 p-3 md:p-4 rounded-full transition-all duration-300"
              >
                <X className="w-6 h-6 md:w-8 md:h-8" />
              </button>

              {product.images.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); prev(); }}
                    className="absolute left-4 md:left-12 top-1/2 -translate-y-1/2 text-white/50 hover:text-white z-50 bg-white/5 hover:bg-white/10 border border-white/10 p-3 md:p-5 rounded-full transition-all duration-300"
                  >
                    <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); next(); }}
                    className="absolute right-4 md:right-12 top-1/2 -translate-y-1/2 text-white/50 hover:text-white z-50 bg-white/5 hover:bg-white/10 border border-white/10 p-3 md:p-5 rounded-full transition-all duration-300"
                  >
                    <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
                  </button>
                </>
              )}

              <div className="relative w-full max-w-[95vw] h-[90vh] flex items-center justify-center">
                <motion.img
                  key={currentImage?.id}
                  src={getImageUrl(currentImage?.id)}
                  alt={currentImage?.name}
                  initial={{ scale: 0.9, opacity: 0, filter: "blur(10px)" }}
                  animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
                  exit={{ scale: 0.9, opacity: 0, filter: "blur(10px)" }}
                  transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="max-w-full max-h-full object-contain cursor-default drop-shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              
              {product.images.length > 1 && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 z-50">
                  {product.images.map((_, idx) => (
                    <div 
                      key={idx} 
                      className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-8 bg-accent' : 'w-2 bg-white/20'}`}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
