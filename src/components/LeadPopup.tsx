import { useState, useEffect, useRef } from "react";
import { X, ArrowRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import popupBg from "../assets/images/popup-bg.jpg";
import { submitLead } from "../lib/api";

export default function LeadPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ firstName: "", phone: "", email: "", serviceType: "" });
  const [mode, setMode] = useState<"lead" | "catalog">("lead");
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // 10 seconds timeout as requested
    const timer = setTimeout(() => {
      if (!localStorage.getItem("leadPopupClosed_v2")) setIsOpen(true);
    }, 10000);

    const handleOpenCatalog = () => {
      setMode("catalog");
      setIsOpen(true);
    };
    window.addEventListener("open-catalog-popup", handleOpenCatalog);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("open-catalog-popup", handleOpenCatalog);
    };
  }, []);

  const closePopup = () => {
    setIsOpen(false);
    localStorage.setItem("leadPopupClosed_v2", "true");
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
      // Pot de miel anti-spam : champ caché que seuls les robots remplissent
      const honeypot = (document.getElementById("popup-website") as HTMLInputElement)?.value || "";
      await submitLead({ ...formData, source: "popup", website: honeypot });
      const messageText = `Bonjour EMROD, je suis ${formData.firstName}. J'aimerais des informations pour : ${formData.serviceType}. Mon numéro est le ${formData.phone}.`;
      const waLink = `https://wa.me/224623885959?text=${encodeURIComponent(messageText)}`;

      window.open(waLink, "_blank");

      setHasSubmitted(true);
      setTimeout(closePopup, 3000);
    } catch (err) {
      alert("Erreur technique de connexion.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Floating label input inline ──────── */
  const FloatingInput = ({ id, label, type="text", value, onChange }: any) => {
    const [focused, setFocused] = useState(false);
    const active = focused || value.length > 0;
    return (
      <div className="relative group/input">
        <div className={`absolute inset-0 border rounded-sm transition-all duration-300 pointer-events-none ${focused ? 'border-accent shadow-[0_0_15px_rgba(232,93,4,0.15)] scale-[1.01]' : 'border-border group-hover/input:border-accent/40'}`} />
        <input
          id={id} type={type} required
          value={value} onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          className="w-full bg-card/80 pt-6 pb-2 px-5 outline-none transition-all duration-300 text-sm relative z-10 rounded-sm"
        />
        <label
          htmlFor={id}
          className="absolute left-5 transition-all duration-300 pointer-events-none select-none z-20"
          style={{
            top: active ? "0.4rem" : "1.1rem",
            fontSize: active ? "0.6rem" : "0.875rem",
            letterSpacing: active ? "0.1em" : "normal",
            textTransform: active ? "uppercase" : "none",
            color: focused ? "#e85d04" : active ? "#e85d0480" : "var(--color-muted-foreground)",
            fontWeight: active ? 500 : 400,
          }}
        >
          {label} <span className="text-accent ml-0.5">*</span>
        </label>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && !hasSubmitted && (
        <motion.div 
          initial={{ opacity: 0, backdropFilter: "blur(0px)" }} 
          animate={{ opacity: 1, backdropFilter: "blur(8px)" }} 
          exit={{ opacity: 0, backdropFilter: "blur(0px)" }} 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 40, opacity: 0, rotateX: 10 }} 
            animate={{ scale: 1, y: 0, opacity: 1, rotateX: 0 }} 
            exit={{ scale: 0.9, y: 40, opacity: 0 }} 
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="w-full max-w-4xl bg-card flex flex-col md:flex-row relative border border-border/50 shadow-[0_30px_100px_rgba(0,0,0,0.6)] overflow-hidden rounded-sm"
            style={{ perspective: "1000px" }}
          >
            {/* Left side image */}
            <div className="md:w-5/12 hidden md:block relative overflow-hidden group">
               <img src={popupBg} alt="Détail Bois" className="absolute w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
               <div className="absolute inset-0 bg-primary/40 backdrop-brightness-75 mix-blend-multiply" />
               <div className="absolute inset-0" style={{ background: "linear-gradient(to right, transparent, rgba(20,20,20,0.8))" }} />
               
               <div className="absolute bottom-8 left-8 text-white">
                 <div className="w-12 h-12 rounded-sm border border-white/20 flex items-center justify-center mb-6 backdrop-blur-sm bg-white/5">
                   <Sparkles className="w-5 h-5 text-accent" />
                 </div>
                 <h4 className="font-heading text-3xl mb-2">Excellence<br/>& Sur-mesure</h4>
                 <p className="text-white/60 text-sm max-w-[200px] leading-relaxed">Créez le meuble de vos rêves.</p>
               </div>
            </div>

            {/* Right side form */}
            <div className="w-full md:w-7/12 p-8 md:p-14 relative bg-card border-t-4 md:border-t-0 md:border-l border-accent z-10 glass-card">
              {/* Decorative blob */}
              <div className="absolute -top-20 -right-20 w-64 h-64 rounded-sm opacity-5 blur-3xl pointer-events-none" style={{ background: "radial-gradient(circle, #e85d04, transparent)" }} />

              <button 
                onClick={closePopup} 
                className="absolute top-5 right-5 text-foreground/40 hover:text-accent bg-secondary/50 hover:bg-secondary p-2 rounded-sm transition-all duration-300"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="mb-10 mt-2">
                 <div className="inline-flex items-center gap-2 text-accent uppercase tracking-[0.3em] text-[10px] font-medium mb-4 bg-accent/10 px-3 py-1.5 rounded-sm">
                   <span className="w-1.5 h-1.5 rounded-sm bg-accent animate-pulse" />
                   Contact
                 </div>
                 <h3 className="font-heading text-3xl md:text-4xl mb-4 text-primary">
                   {mode === "catalog" ? "Télécharger le catalogue" : "Avez-vous un projet ?"}
                 </h3>
                 <p className="text-foreground/60 text-sm leading-relaxed">
                   {mode === "catalog" 
                     ? "Laissez-nous vos contacts pour recevoir immédiatement notre catalogue de meubles." 
                     : "Laissez-nous vos contacts. Nous vous appellerons pour en discuter, sans aucun engagement de votre part."}
                 </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                {/* Pot de miel anti-spam (invisible pour les humains) */}
                <input type="text" id="popup-website" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
                <div className="grid grid-cols-2 gap-5">
                  <FloatingInput id="popup-firstName" label="Votre Nom" value={formData.firstName} onChange={(v: string) => setFormData({...formData, firstName: v})} />
                  <FloatingInput id="popup-phone" label="Téléphone" type="tel" value={formData.phone} onChange={(v: string) => setFormData({...formData, phone: v})} />
                </div>
                <div className="mb-5">
                  <FloatingInput id="popup-email" label="Votre Email" type="email" value={formData.email} onChange={(v: string) => setFormData({...formData, email: v})} />
                </div>
                
                <div className="relative group/select" style={{ display: mode === "catalog" ? "none" : "block" }}>
                  <div className="absolute inset-0 border border-border group-hover/select:border-accent/40 rounded-sm transition-all duration-300 pointer-events-none" />
                  <select 
                    id="popup-serviceType" required={mode !== "catalog"} 
                    value={formData.serviceType} 
                    onChange={e => setFormData({...formData, serviceType: e.target.value})} 
                    className="w-full bg-card/80 pt-6 pb-2 px-5 text-sm appearance-none outline-none transition-all duration-300 cursor-pointer text-foreground relative z-10 rounded-sm"
                  >
                    <option value="" disabled hidden></option>
                    <option value="creation">Meuble sur mesure</option>
                    <option value="catalogue">Modèle du catalogue</option>
                    <option value="conseil">Conseil pour la maison</option>
                  </select>
                  <label
                    htmlFor="popup-serviceType"
                    className="absolute left-5 transition-all duration-300 pointer-events-none select-none z-20"
                    style={{
                      top: formData.serviceType ? "0.4rem" : "1.1rem",
                      fontSize: formData.serviceType ? "0.6rem" : "0.875rem",
                      letterSpacing: formData.serviceType ? "0.1em" : "normal",
                      textTransform: formData.serviceType ? "uppercase" : "none",
                      color: formData.serviceType ? "#e85d04" : "var(--color-muted-foreground)",
                      fontWeight: formData.serviceType ? 500 : 400,
                    }}
                  >
                    Quel service vous intéresse ? <span className="text-accent ml-0.5">*</span>
                  </label>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none z-20 text-accent">▼</div>
                </div>

                <div className="mt-8 overflow-hidden rounded-sm relative">
                  <motion.button 
                    ref={btnRef}
                    disabled={isSubmitting} 
                    type="submit" 
                    onClick={handleRipple}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="ripple-btn shimmer-sweep w-full flex items-center justify-center gap-3 text-primary-foreground uppercase tracking-[0.2em] text-[10px] py-4 font-medium disabled:opacity-80 transition-all group/btn"
                    style={{ background: "linear-gradient(135deg, #154c30, #1a5535)" }}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-sm border-2 border-white/30 border-t-white animate-spin" />
                        Patientez s'il vous plaît...
                      </span>
                    ) : (
                      <>
                        {mode === "catalog" ? "Télécharger le catalogue" : "Être rappelé par EMROD"}
                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-2 transition-transform" />
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Success View */}
      <AnimatePresence>
        {isOpen && hasSubmitted && (
           <motion.div 
             initial={{ opacity: 0, backdropFilter: "blur(0px)" }} 
             animate={{ opacity: 1, backdropFilter: "blur(8px)" }} 
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/90"
           >
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="bg-card w-full max-w-md p-12 text-center border-t-4 border-accent relative overflow-hidden glass-card rounded-sm"
             >
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-sm blur-2xl" />
                
                <motion.div 
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
                  className="w-20 h-20 mx-auto border border-accent/20 rounded-sm flex items-center justify-center mb-6 bg-accent/5 relative"
                >
                  <div className="absolute inset-0 rounded-sm border border-accent animate-ping opacity-20" />
                  <Sparkles className="w-8 h-8 text-accent" />
                </motion.div>

                <h3 className="font-heading text-4xl mb-4 text-primary">Merci.</h3>
                <p className="text-foreground/60 leading-relaxed mb-8">
                  {mode === "catalog" 
                    ? "Le téléchargement de votre catalogue a commencé." 
                    : "Votre demande a bien été envoyée à EMROD."}
                </p>
                <button 
                  onClick={closePopup} 
                  className="text-accent uppercase tracking-[0.2em] text-[10px] font-bold border-b border-transparent hover:border-accent pb-1 transition-colors"
                >
                  Retourner au site
                </button>
             </motion.div>
           </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}
