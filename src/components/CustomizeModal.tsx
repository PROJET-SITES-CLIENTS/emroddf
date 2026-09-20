import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Ruler, TreePine, Paintbrush, Sparkles, Loader2, CheckCircle, MessageCircle, ArrowRight } from "lucide-react";
import { submitLead, fetchSettings } from "../lib/api";

interface CustomizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    name: string;
    prix: string;
    dimensions?: string;
    essence?: string;
    finition?: string;
  };
}

const WHATSAPP_FALLBACK = "224623885959";

async function getWhatsAppNumber(): Promise<string> {
  try {
    const s = await fetchSettings();
    return s.contact?.whatsapp || WHATSAPP_FALLBACK;
  } catch {
    return WHATSAPP_FALLBACK;
  }
}

const inputCls = "w-full bg-card/50 pt-6 pb-2 px-4 outline-none transition-all duration-300 text-sm relative z-10 rounded-sm";
const labelStyle = (active: boolean, focused: boolean): React.CSSProperties => ({
  top: active ? "0.4rem" : "1.1rem",
  fontSize: active ? "0.6rem" : "0.875rem",
  letterSpacing: active ? "0.1em" : "normal",
  textTransform: active ? "uppercase" : "none",
  color: focused ? "#e85d04" : active ? "#e85d0480" : "var(--color-muted-foreground)",
  fontWeight: active ? 500 : 400,
});

export default function CustomizeModal({ isOpen, onClose, product }: CustomizeModalProps) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const [client, setClient] = useState({ nom: "", prenom: "", telephone: "", email: "" });
  const [specs, setSpecs] = useState({
    dimensions: product.dimensions || "",
    essence: product.essence || "",
    finition: product.finition || "",
    precisions: "",
  });

  const active = (v: string) => v.length > 0;

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStep("form");
      setClient({ nom: "", prenom: "", telephone: "", email: "" });
      setSpecs({
        dimensions: product.dimensions || "",
        essence: product.essence || "",
        finition: product.finition || "",
        precisions: "",
      });
    }, 400);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Message structuré pour l'atelier (visible dans Prospects)
      const message = [
        `MODÈLE DE BASE : ${product.name}`,
        `Prix affiché : ${product.prix}`,
        `Dimensions souhaitées : ${specs.dimensions || product.dimensions || "à définir"}`,
        `Essence souhaitée : ${specs.essence || product.essence || "au choix"}`,
        `Finition souhaitée : ${specs.finition || product.finition || "au choix"}`,
        specs.precisions ? `Précisions : ${specs.precisions}` : "",
      ].filter(Boolean).join("\n");

      await submitLead({
        firstName: client.prenom,
        lastName: client.nom,
        phone: client.telephone,
        email: client.email,
        serviceType: "creation",
        source: "sur-mesure",
        message,
      });

      // Message WhatsApp pré-rempli avec les specs
      const waMessage = `Bonjour EMROD SARL ! 🪑\n\nJe souhaite personnaliser un modèle de votre catalogue.\n\n📋 *MODÈLE DE BASE*\nProduit : ${product.name}\nPrix affiché : ${product.prix}\n\n✏️ *MA PERSONNALISATION*\nDimensions : ${specs.dimensions || product.dimensions || "à définir"}\nEssence : ${specs.essence || product.essence || "au choix"}\nFinition : ${specs.finition || product.finition || "au choix"}\n${specs.precisions ? `Précisions : ${specs.precisions}\n` : ""}\n👤 *MES COORDONNÉES*\nNom & Prénom : ${client.nom} ${client.prenom}\nTéléphone : ${client.telephone}\n\nMerci de me recontacter pour un devis ! 🙏`;

      setStep("success");
      const waNumber = await getWhatsAppNumber();
      setTimeout(() => {
        window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`, "_blank");
      }, 1400);
    } catch (err: any) {
      alert(err.message || "Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const Field = ({ id, label, value, onChange, type = "text", required = false, placeholder = "" }: any) => {
    const isFocused = focused === id;
    const isActive = active(value) || isFocused;
    return (
      <div className="relative group/input">
        <div className={`absolute inset-0 border rounded-sm transition-all duration-300 pointer-events-none ${isFocused ? 'border-accent shadow-[0_0_15px_rgba(232,93,4,0.15)]' : 'border-border group-hover/input:border-accent/40'}`} />
        <input
          id={id} type={type} required={required} placeholder={isFocused ? placeholder : " "}
          value={value} onChange={(e: any) => onChange(e.target.value)}
          onFocus={() => setFocused(id)} onBlur={() => setFocused(null)}
          className={inputCls}
        />
        <label htmlFor={id} className="absolute left-4 transition-all duration-300 pointer-events-none select-none z-20" style={labelStyle(isActive, isFocused)}>
          {label} {required && <span className="text-accent ml-0.5">*</span>}
        </label>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
          animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
          exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 overflow-y-auto"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <motion.div
            initial={{ scale: 0.95, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 30, opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="w-full max-w-lg my-8 bg-card border border-border/50 shadow-[0_30px_100px_rgba(0,0,0,0.6)] relative flex flex-col overflow-hidden rounded-sm glass-card"
          >
            <div className="absolute top-0 left-0 w-full h-1" style={{ background: "linear-gradient(90deg, #154c30, #e85d04, #154c30)", backgroundSize: "200% 100%", animation: "shimmer 3s infinite linear" }} />

            <button onClick={handleClose} aria-label="Fermer"
              className="absolute top-5 right-5 text-foreground/40 hover:text-accent bg-secondary/50 hover:bg-secondary p-2 rounded-sm transition-all duration-300 z-20">
              <X className="w-4 h-4" />
            </button>

            <AnimatePresence mode="wait">
              {step === "form" ? (
                <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  className="p-6 md:p-8 overflow-y-auto custom-scrollbar relative z-10">
                  {/* Header */}
                  <div className="mb-6 pr-10">
                    <div className="inline-flex items-center gap-2 text-accent uppercase tracking-[0.3em] text-[10px] font-bold mb-3 bg-accent/10 px-2 py-1 rounded-sm">
                      <Sparkles className="w-3 h-3" /> Personnalisation
                    </div>
                    <h2 className="font-heading text-2xl md:text-3xl text-primary mb-2">Modifier sur-mesure</h2>
                    <p className="text-sm text-foreground/60 leading-relaxed">
                      Partez de ce modèle et indiquez vos préférences : l'atelier vous recontacte avec un devis adapté.
                    </p>
                  </div>

                  {/* Rappel du modèle de base */}
                  <div className="bg-secondary/40 border border-border p-4 mb-6 rounded-sm">
                    <div className="flex flex-col gap-1.5 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-[10px] uppercase tracking-[0.2em] text-foreground/50 font-bold">Modèle de base</span>
                        <span className="font-heading text-primary font-medium text-right line-clamp-1">{product.name}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-[10px] uppercase tracking-[0.2em] text-foreground/50 font-bold">Prix affiché</span>
                        <span className="font-semibold text-foreground">{product.prix}</span>
                      </div>
                      {product.dimensions && (
                        <div className="flex justify-between gap-4">
                          <span className="text-[10px] uppercase tracking-[0.2em] text-foreground/50 font-bold">Dimensions d'origine</span>
                          <span className="text-foreground/80">{product.dimensions}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Specs personnalisées */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="relative">
                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-accent font-bold mb-1.5">
                          <Ruler className="w-3 h-3" /> Dimensions
                        </div>
                        <Field id="cust-dims" label="Dimensions" value={specs.dimensions} placeholder="Ex : 150×80cm"
                          onChange={(v: string) => setSpecs({ ...specs, dimensions: v })} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-accent font-bold mb-1.5">
                          <TreePine className="w-3 h-3" /> Essence
                        </div>
                        <Field id="cust-essence" label="Essence" value={specs.essence} placeholder="Ex : Iroko"
                          onChange={(v: string) => setSpecs({ ...specs, essence: v })} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-accent font-bold mb-1.5">
                          <Paintbrush className="w-3 h-3" /> Finition
                        </div>
                        <Field id="cust-finition" label="Finition" value={specs.finition} placeholder="Ex : Vernis mat"
                          onChange={(v: string) => setSpecs({ ...specs, finition: v })} />
                      </div>
                    </div>

                    <Field id="cust-precisions" label="Autres précisions (optionnel)" value={specs.precisions}
                      placeholder="Couleurs, rangements, délais souhaités..."
                      onChange={(v: string) => setSpecs({ ...specs, precisions: v })} />

                    {/* Coordonnées */}
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/60">
                      <Field id="cust-nom" label="Nom" value={client.nom} required placeholder="Ex : Diallo"
                        onChange={(v: string) => setClient({ ...client, nom: v })} />
                      <Field id="cust-prenom" label="Prénom" value={client.prenom} required placeholder="Ex : Mamadou"
                        onChange={(v: string) => setClient({ ...client, prenom: v })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Field id="cust-tel" label="Téléphone" type="tel" value={client.telephone} required placeholder="Ex : +224 6XX XXX XXX"
                        onChange={(v: string) => setClient({ ...client, telephone: v })} />
                      <Field id="cust-email" label="Email (optionnel)" type="email" value={client.email} placeholder="vous@email.com"
                        onChange={(v: string) => setClient({ ...client, email: v })} />
                    </div>

                    <div className="flex items-start gap-3 bg-accent/5 border border-accent/20 p-3 rounded-sm">
                      <MessageCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                      <span className="text-[11px] text-foreground/70 leading-relaxed font-medium">
                        Votre demande sera transmise à l'atelier et vous serez redirigé(e) vers WhatsApp pour confirmer directement.
                      </span>
                    </div>

                    <motion.button
                      type="submit" disabled={isSubmitting}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      className="ripple-btn shimmer-sweep w-full flex items-center justify-center gap-3 text-primary-foreground uppercase tracking-[0.2em] text-[10px] py-4 font-medium disabled:opacity-80 transition-all"
                      style={{ background: "linear-gradient(135deg, #e85d04, #b84600)" }}
                    >
                      {isSubmitting ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Envoi...</>
                      ) : (
                        <>Demander mon devis sur-mesure <ArrowRight className="w-4 h-4" /></>
                      )}
                    </motion.button>
                  </form>
                </motion.div>
              ) : (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="p-8 md:p-12 flex flex-col items-center text-center gap-6 py-16 relative z-10">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
                    className="w-24 h-24 rounded-sm bg-accent/10 flex items-center justify-center border border-accent/20 relative">
                    <div className="absolute inset-0 rounded-sm border border-accent animate-ping opacity-20" />
                    <CheckCircle className="w-12 h-12 text-accent" />
                  </motion.div>
                  <div>
                    <h3 className="font-heading text-3xl text-primary mb-3">Demande envoyée !</h3>
                    <p className="text-foreground/60 leading-relaxed text-sm">
                      L'atelier a bien reçu votre personnalisation du modèle <strong className="text-accent">{product.name}</strong>.
                      Vous serez redirigé(e) vers WhatsApp pour échanger directement.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-foreground/40 font-medium">
                    <MessageCircle className="w-4 h-4" />
                    Ouverture de WhatsApp <span className="animate-pulse">...</span>
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
