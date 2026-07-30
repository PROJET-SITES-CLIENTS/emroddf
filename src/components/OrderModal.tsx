import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ShoppingBag, MessageCircle, CheckCircle, Loader2, Sparkles } from "lucide-react";
import { submitOrder } from "../lib/api";

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  produit: string;
  prix: string;
  prixNumeric: number;
}

const WHATSAPP_NUMBER = "224623885959"; // Numéro WhatsApp EMROD SARL

function formatPrice(num: number): string {
  if (!num) return "Prix sur demande";
  return new Intl.NumberFormat("fr-FR").format(num) + " GNF";
}

/* ── Floating label input inline ──────── */
const FloatingInput = ({ id, label, type="text", value, onChange, placeholder="" }: any) => {
  const [focused, setFocused] = useState(false);
  const active = focused || value.length > 0;
  return (
    <div className="relative group/input">
      <div className={`absolute inset-0 border rounded-sm transition-all duration-300 pointer-events-none ${focused ? 'border-accent shadow-[0_0_15px_rgba(232,93,4,0.15)]' : 'border-border group-hover/input:border-accent/40'}`} />
      <input
        id={id} type={type} required placeholder={focused ? placeholder : " "}
        value={value} onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        className="w-full bg-card/50 pt-6 pb-2 px-4 outline-none transition-all duration-300 text-sm relative z-10 rounded-sm"
      />
      <label
        htmlFor={id}
        className="absolute left-4 transition-all duration-300 pointer-events-none select-none z-20"
        style={{
          top: active ? "0.4rem" : "1.1rem",
          fontSize: active ? "0.6rem" : "0.875rem",
          letterSpacing: active ? "0.1em" : "normal",
          textTransform: active ? "uppercase" : "none",
          color: focused ? "#e85d04" : active ? "#e85d0480" : "var(--color-muted-foreground)",
          fontWeight: active ? 700 : 400,
        }}
      >
        {label} <span className="text-accent ml-0.5">*</span>
      </label>
    </div>
  );
};

export default function OrderModal({
  isOpen,
  onClose,
  produit,
  prix,
  prixNumeric,
}: OrderModalProps) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    adresse: "",
  });
  const btnRef = useRef<HTMLButtonElement>(null);

  const acompteNumeric = prixNumeric ? Math.round(prixNumeric * 0.6) : 0;
  const acompte = prixNumeric ? formatPrice(acompteNumeric) : "À calculer";

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStep("form");
      setFormData({ nom: "", prenom: "", telephone: "", adresse: "" });
    }, 400);
  };

  const handleRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement("span");
    ripple.className = "ripple-effect";
    const size = Math.max(rect.width, rect.height) * 2;
    ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px`;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await submitOrder({
        ...formData,
        produit,
        prix,
        prixNumeric,
        acompte,
        acompteNumeric,
      });

      const waMessage = `Bonjour EMROD SARL ! 🪑\n\nJe viens de passer une commande sur votre site.\n\n📋 *MA COMMANDE*\nProduit : ${produit}\nPrix total : ${prix}\nAcompte à régler (60%) : ${acompte}\n\n👤 *MES COORDONNÉES*\nNom & Prénom : ${formData.nom} ${formData.prenom}\nTéléphone : ${formData.telephone}\nAdresse de livraison : ${formData.adresse}\n\nJe confirme ma commande et suis prêt(e) à régler l'acompte. Merci ! 🙏`;
      const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waMessage)}`;

      setStep("success");

      setTimeout(() => {
        window.open(waLink, "_blank");
      }, 1500);
    } catch (err) {
      console.error(err);
      alert("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
          animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
          exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <motion.div
            initial={{ scale: 0.95, y: 30, opacity: 0, rotateX: 5 }}
            animate={{ scale: 1, y: 0, opacity: 1, rotateX: 0 }}
            exit={{ scale: 0.95, y: 30, opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="w-full max-w-lg max-h-[95vh] bg-card border border-border/50 shadow-[0_30px_100px_rgba(0,0,0,0.6)] relative flex flex-col overflow-hidden rounded-sm glass-card"
            style={{ perspective: "1000px" }}
          >
            {/* Ambient glow */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-accent/5 blur-3xl rounded-full pointer-events-none" />

            {/* Accent top bar */}
            <div className="absolute top-0 left-0 w-full h-1" style={{ background: "linear-gradient(90deg, #154c30, #e85d04, #154c30)", backgroundSize: "200% 100%", animation: "shimmer 3s infinite linear" }} />

            {/* Close button */}
            <button
              onClick={handleClose}
              aria-label="Fermer"
              className="absolute top-5 right-5 text-foreground/40 hover:text-accent bg-secondary/50 hover:bg-secondary p-2 rounded-full transition-all duration-300 z-20"
            >
              <X className="w-4 h-4" />
            </button>

            <AnimatePresence mode="wait">
              {step === "form" ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-6 md:p-8 overflow-y-auto flex-1 custom-scrollbar relative z-10"
                >
                  {/* Header */}
                  <div className="mb-6">
                    <div className="inline-flex items-center gap-2 text-accent uppercase tracking-[0.3em] text-[10px] font-bold mb-3 bg-accent/10 px-2 py-1 rounded-sm">
                      <Sparkles className="w-3 h-3" /> Bon de commande
                    </div>
                    <h2 className="font-heading text-2xl md:text-3xl text-primary mb-2">
                      Confirmer ma commande
                    </h2>
                    <p className="text-sm text-foreground/60 leading-relaxed">
                      Remplissez vos informations. Vous serez redirigé(e) sur WhatsApp pour valider l'acompte.
                    </p>
                  </div>

                  {/* Product recap (Premium style) */}
                  <div className="bg-secondary/40 border border-border p-4 mb-6 relative overflow-hidden group rounded-sm">
                    {/* Hover shine */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(232,93,4,0.05) 0%, transparent 50%)" }} />
                    
                    <div className="flex flex-col gap-3 relative z-10">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] uppercase tracking-[0.2em] text-foreground/50 font-bold">Produit</span>
                        <span className="font-heading text-primary font-medium text-sm text-right line-clamp-1">{produit}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] uppercase tracking-[0.2em] text-foreground/50 font-bold">Prix total</span>
                        <span className="font-semibold text-foreground text-sm">{prix}</span>
                      </div>
                      <div className="flex justify-between items-center border-t border-border/60 pt-3 mt-1">
                        <span className="text-[10px] uppercase tracking-[0.2em] text-accent font-bold flex items-center gap-1.5">
                          Acompte à payer <span className="bg-accent/20 px-1.5 py-0.5 rounded-sm text-[#e85d04]">60%</span>
                        </span>
                        <span className="text-lg font-bold text-accent">{acompte}</span>
                      </div>
                    </div>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FloatingInput id="order-nom" label="Nom" value={formData.nom} onChange={(v: string) => setFormData({...formData, nom: v})} placeholder="Ex: Diallo" />
                      <FloatingInput id="order-prenom" label="Prénom" value={formData.prenom} onChange={(v: string) => setFormData({...formData, prenom: v})} placeholder="Ex: Mamadou" />
                    </div>

                    <FloatingInput id="order-telephone" label="Téléphone" type="tel" value={formData.telephone} onChange={(v: string) => setFormData({...formData, telephone: v})} placeholder="Ex: +224 6XX XXX XXX" />

                    <div className="relative group/input">
                      <div className="absolute inset-0 border border-border group-hover/input:border-accent/40 rounded-sm transition-all duration-300 pointer-events-none" />
                      <textarea
                        id="order-adresse"
                        required
                        rows={2}
                        value={formData.adresse}
                        onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                        className="w-full bg-card/50 pt-7 pb-2 px-4 outline-none transition-all duration-300 text-sm resize-none relative z-10 rounded-sm"
                      />
                      <label
                        htmlFor="order-adresse"
                        className="absolute left-4 transition-all duration-300 pointer-events-none select-none z-20"
                        style={{
                          top: formData.adresse ? "0.4rem" : "1.1rem",
                          fontSize: formData.adresse ? "0.6rem" : "0.875rem",
                          letterSpacing: formData.adresse ? "0.1em" : "normal",
                          textTransform: formData.adresse ? "uppercase" : "none",
                          color: formData.adresse ? "#e85d04" : "var(--color-muted-foreground)",
                          fontWeight: formData.adresse ? 700 : 400,
                        }}
                      >
                        Adresse de livraison <span className="text-accent ml-0.5">*</span>
                      </label>
                    </div>

                    {/* Info acompte */}
                    <div className="flex items-start gap-3 bg-accent/5 border border-accent/20 p-3 mt-2 rounded-sm">
                      <MessageCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                      <span className="text-[11px] text-foreground/70 leading-relaxed font-medium">
                        Après confirmation, vous serez redirigé(e) sur <strong>WhatsApp</strong> pour valider votre commande et organiser le paiement de <strong className="text-accent">{acompte}</strong>.
                      </span>
                    </div>

                    <div className="mt-6 rounded-sm overflow-hidden relative">
                      <motion.button
                        ref={btnRef}
                        type="submit"
                        disabled={isSubmitting}
                        onClick={handleRipple}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="ripple-btn shimmer-sweep w-full flex items-center justify-center gap-3 text-primary-foreground uppercase tracking-[0.2em] text-[10px] py-4 font-bold disabled:opacity-80 transition-all shadow-xl group/btn"
                        style={{ background: "linear-gradient(135deg, #154c30, #1a5535)" }}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Traitement...
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                            Confirmer la commande
                          </>
                        )}
                      </motion.button>
                    </div>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-8 md:p-12 flex flex-col items-center text-center gap-6 py-16 relative z-10"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
                    className="w-24 h-24 rounded-full bg-accent/10 flex items-center justify-center border border-accent/20 relative"
                  >
                    <div className="absolute inset-0 rounded-full border border-accent animate-ping opacity-20" />
                    <CheckCircle className="w-12 h-12 text-accent" />
                  </motion.div>
                  <div>
                    <h3 className="font-heading text-3xl text-primary mb-3">
                      Commande enregistrée
                    </h3>
                    <p className="text-foreground/60 leading-relaxed text-sm">
                      Votre bon de commande a été transmis à l'atelier.
                      <br /><br />
                      <span className="text-accent font-medium px-3 py-1.5 bg-accent/10 rounded-full text-xs uppercase tracking-widest">
                        Ouverture de WhatsApp...
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-foreground/40 mt-2 font-medium">
                    <MessageCircle className="w-4 h-4" />
                    Redirection en cours <span className="animate-pulse">...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
