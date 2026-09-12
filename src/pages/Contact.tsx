import { useState, useRef } from "react";
import { Mail, MapPin, Phone, Clock, Send, CheckCircle2, ChevronDown, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import contactBg from "../assets/images/contact-bg.jpg";
import { submitLead } from "../lib/api";

/* ── Floating label input ───────────────── */
function FloatingInput({
  id, label, type = "text", value, onChange, required = false,
}: {
  id: string; label: string; type?: string; value: string; onChange: (v: string) => void; required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const active = focused || value.length > 0;
  return (
    <div className="relative group/input">
      <div 
        className={`absolute inset-0 border rounded-sm transition-all duration-300 pointer-events-none ${
          focused ? 'border-accent shadow-[0_0_15px_rgba(232,93,4,0.15)] scale-[1.01]' : 'border-border group-hover/input:border-accent/40'
        }`}
      />
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        required={required}
        placeholder=" "
        className="w-full bg-card/80 backdrop-blur-sm pt-6 pb-2 px-5 outline-none transition-all duration-300 text-sm peer relative z-10 rounded-sm"
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
        {label} {required && <span className="text-accent ml-0.5">*</span>}
      </label>
    </div>
  );
}

/* ── Floating textarea ──────────────────── */
function FloatingTextarea({
  id, label, value, onChange, rows = 5,
}: {
  id: string; label: string; value: string; onChange: (v: string) => void; rows?: number;
}) {
  const [focused, setFocused] = useState(false);
  const active = focused || value.length > 0;
  return (
    <div className="relative group/input">
      <div 
        className={`absolute inset-0 border rounded-sm transition-all duration-300 pointer-events-none ${
          focused ? 'border-accent shadow-[0_0_15px_rgba(232,93,4,0.15)] scale-[1.01]' : 'border-border group-hover/input:border-accent/40'
        }`}
      />
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        rows={rows}
        placeholder=" "
        className="w-full bg-card/80 backdrop-blur-sm px-5 pt-7 pb-3 outline-none transition-all duration-300 text-sm resize-none peer relative z-10 rounded-sm"
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
        {label}
      </label>
    </div>
  );
}

/* ── Accordion item ─────────────────────── */
function AccordionItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.12, duration: 0.6 }}
      className="border-b border-border overflow-hidden bg-card transition-all duration-300 hover:border-accent/30 relative group"
    >
      {/* Animated side bar indicator */}
      <motion.div 
        className="absolute left-0 top-0 bottom-0 w-1 origin-top"
        style={{ background: "linear-gradient(to bottom, #e85d04, #11522f)" }}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: open ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />

      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-6 md:p-8 text-left transition-colors duration-300 relative z-10"
      >
        <h4 className={`font-heading text-xl transition-colors pr-4 ${open ? "text-accent" : "text-primary group-hover:text-accent/80"}`}>{q}</h4>
        <motion.div
          animate={{ rotate: open ? 180 : 0, backgroundColor: open ? "#e85d04" : "transparent", color: open ? "#fff" : "var(--color-foreground)" }}
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center border rounded-sm transition-all"
          style={{ borderColor: open ? "#e85d04" : "var(--color-border)" }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="px-6 md:px-8 pb-8 pt-2 bg-secondary/10 relative z-10">
              <p className="text-foreground/70 leading-relaxed text-base">{a}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ════════════════════════════════════════
   CONTACT PAGE
════════════════════════════════════════ */
export default function Contact() {
  const [formData, setFormData] = useState({
    firstName: "", lastName: "", phone: "", email: "", serviceType: "", message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [selectFocused, setSelectFocused] = useState(false);

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
    setSubmitProgress(0);

    // Animate progress bar with organic easing
    let p = 0;
    const interval = setInterval(() => {
      p += (90 - p) * 0.1;
      setSubmitProgress(p);
    }, 50);

    try {
      await submitLead({ ...formData, type: "contact_page" });
      
      const messageText = `Bonjour EMROD, je suis ${formData.firstName} ${formData.lastName}. Mon besoin : ${formData.serviceType}. Détails : ${formData.message}`;
      const waLink = `https://wa.me/224623885959?text=${encodeURIComponent(messageText)}`;
      
      window.open(waLink, "_blank");
      
      setSubmitProgress(100);
      setTimeout(() => { 
        setSuccess(true); 
        setFormData({ firstName: "", lastName: "", phone: "", email: "", serviceType: "", message: "" }); 
      }, 400);
    } finally {
      clearInterval(interval);
      setIsSubmitting(false);
    }
  };

  const faqs = [
    { q: "Quels sont les délais de fabrication ?", a: "Les délais varient entre 4 et 8 semaines selon la complexité de la pièce et le carnet de commandes actuel de l'atelier EMROD. Nous vous communiquons un délai précis lors du devis." },
    { q: "Proposez-vous des facilités de paiement ?", a: "Un acompte de 50% est demandé à la commande, et le solde de 50% restant est à régler lors de la livraison. Des modalités particulières peuvent être étudiées selon le projet." },
    { q: "Livrez-vous à Conakry et à l'intérieur du pays ?", a: "Oui, nous organisons la livraison sur tout Conakry et pouvons étudier des solutions logistiques sécurisées vers les autres préfectures de la Guinée." },
    { q: "Peut-on visiter l'atelier avant de commander ?", a: "Absolument ! Nous encourageons même les visites. Prendre rendez-vous vous permettra de voir nos matériaux, nos finitions en cours et de discuter directement avec la créatrice." },
  ];

  return (
    <div className="bg-transparent text-foreground pt-24 pb-20 overflow-hidden relative">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[10%] left-[-5%] w-[600px] h-[600px] opacity-[0.02]" style={{ background: "radial-gradient(circle, #e85d04, transparent)" }} />
        <div className="absolute bottom-[20%] right-[-10%] w-[800px] h-[800px] opacity-[0.01]" style={{ background: "radial-gradient(circle, #11522f, transparent)" }} />
      </div>

      <div className="container mx-auto max-w-7xl px-6 md:px-12 relative z-10">

        {/* ── PAGE HEADER ──────────────────────── */}
        <div className="relative pt-24 pb-20 mb-16 overflow-hidden group">
          <div className="absolute inset-0">
            <img src="/gallery/IMG-20260531-WA0042.jpg" alt="Contact Header" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out animate-ken-burns" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(232,93,4,0.8) 0%, rgba(232,93,4,0.4) 100%)" }} />
          </div>

          <div className="relative z-10 max-w-5xl px-8 md:px-16 text-white">
            <motion.div initial={{ opacity: 0, y: -20, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-white/20 text-[10px] uppercase tracking-[0.3em] font-medium mb-8 text-white/80">
                <span className="w-1.5 h-1.5 rounded-sm bg-white/60" />
                Parlons de votre projet
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading mb-6 tracking-tight text-white">
                Contactez<motion.span
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.7 }}
                  className="text-gradient-animated italic font-light ml-1"
                >-nous.</motion.span>
              </h1>
              <p className="text-lg text-white/80 leading-relaxed font-light max-w-xl">
                Nous sommes à votre écoute pour créer le meuble de vos rêves.
              </p>
            </motion.div>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-16 lg:gap-20 mb-24 items-start">

          {/* ── CONTACT INFO ───────────────── */}
          <motion.div
            initial={{ opacity: 0, x: -80, filter: "blur(10px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="lg:col-span-5 space-y-8"
          >
            <div className="bg-secondary/30 p-8 md:p-10 border-l-2 relative overflow-hidden group" style={{ borderColor: "#e85d04" }}>
              {/* Hover shimmer wipe */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(232,93,4,0.05) 0%, transparent 50%)" }} />
              
              <h3 className="font-heading text-2xl md:text-3xl mb-8 text-primary relative z-10">L'Atelier EMROD</h3>
              
              <ul className="space-y-6 relative z-10">
                {[
                  { icon: MapPin, label: "Adresse", content: "T7, Corniche Nord\nvirage du lac Sonfonia Centre\n(Carrefour Canal Plus)\nConakry, Guinée" },
                  { icon: Phone, label: "Téléphones", content: "+224 623 88 59 59\n+224 621 08 41 46" },
                  { icon: Mail, label: "Email", content: "contact@emroddf.com\ndirection@emroddf.com" },
                  { icon: Clock, label: "Horaires", content: "Lundi - Samedi: 8h - 18h" },
                ].map(({ icon: Icon, label, content }, i) => (
                  <motion.li
                    key={label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + (i * 0.1) }}
                    className="flex items-start gap-4 transition-transform group/item relative"
                  >
                    <Icon className="w-4 h-4 flex-shrink-0 mt-1 transition-colors duration-300" style={{ color: "#e85d04" }} />
                    <div>
                      <h4 className="font-medium uppercase tracking-[0.2em] text-[9px] text-foreground/40 mb-1 group-hover/item:text-accent transition-colors">{label}</h4>
                      <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-line">{content}</p>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Atelier image with Ken Burns */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="relative aspect-[4/5] w-full overflow-hidden border border-border group"
            >
              <img
                src={contactBg}
                alt="L'atelier"
                className="absolute w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000 ease-out"
              />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ background: "linear-gradient(to top, rgba(13,51,32,0.8), transparent 70%)" }} />
              <div className="absolute bottom-6 left-6 text-white/0 group-hover:text-white transition-colors duration-700 text-xs uppercase tracking-[0.3em] font-medium translate-y-4 group-hover:translate-y-0">
                Notre Atelier
              </div>
            </motion.div>
          </motion.div>

          {/* ── FORM ───────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 80, filter: "blur(10px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.9, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="lg:col-span-7"
          >
            <div className="bg-card p-8 md:p-10 border border-border relative overflow-hidden">
              {/* Subtle background glow */}
              <div className="absolute top-0 right-0 w-[400px] h-[400px] opacity-[0.01] pointer-events-none" style={{ background: "radial-gradient(circle, #e85d04, transparent)" }} />

              <h3 className="font-heading text-2xl md:text-3xl mb-3 relative z-10 text-primary">Confiez-nous votre idée</h3>
              <p className="text-foreground/55 mb-8 relative z-10 text-base">Remplissez ce formulaire et la créatrice vous rappellera personnellement sous 48h.</p>

              <AnimatePresence mode="wait">
                {success ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.85, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="text-center py-20 relative z-10"
                  >
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                      className="w-32 h-32 mx-auto rounded-sm flex items-center justify-center mb-8 relative"
                      style={{ background: "radial-gradient(circle, rgba(232,93,4,0.1) 0%, transparent 70%)" }}
                    >
                      <div className="absolute inset-0 rounded-sm border border-accent/20 animate-ping" />
                      <CheckCircle2 className="w-16 h-16" style={{ color: "#e85d04" }} />
                    </motion.div>
                    <h4 className="text-4xl text-primary font-heading mb-4">Demande Envoyée</h4>
                    <p className="text-foreground/60 text-lg mb-10 max-w-md mx-auto leading-relaxed">Nous avons bien reçu vos informations. Nous vous contacterons très prochainement.</p>
                    <button
                      onClick={() => setSuccess(false)}
                      className="text-accent uppercase tracking-[0.2em] text-[10px] font-bold border-b-2 border-transparent hover:border-accent pb-1 transition-all"
                    >
                      Faire une nouvelle demande
                    </button>
                  </motion.div>
                ) : (
                  <motion.form 
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit} 
                    className="space-y-6 relative z-10"
                  >
                    <div className="grid md:grid-cols-2 gap-6">
                      <FloatingInput id="contact-firstName" label="Prénom" value={formData.firstName} onChange={(v) => setFormData({ ...formData, firstName: v })} required />
                      <FloatingInput id="contact-lastName" label="Nom" value={formData.lastName} onChange={(v) => setFormData({ ...formData, lastName: v })} required />
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <FloatingInput id="contact-phone" label="Téléphone" type="tel" value={formData.phone} onChange={(v) => setFormData({ ...formData, phone: v })} required />
                      <FloatingInput id="contact-email" label="Email" type="email" value={formData.email} onChange={(v) => setFormData({ ...formData, email: v })} required />
                    </div>

                    {/* Select — Floating style with premium focus */}
                    <div className="relative group/select">
                      <div 
                        className={`absolute inset-0 border rounded-sm transition-all duration-300 pointer-events-none ${
                          selectFocused ? 'border-accent shadow-[0_0_15px_rgba(232,93,4,0.15)] scale-[1.01]' : 'border-border group-hover/select:border-accent/40'
                        }`}
                      />
                      <select
                        id="contact-serviceType"
                        required
                        value={formData.serviceType}
                        onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                        onFocus={() => setSelectFocused(true)}
                        onBlur={() => setSelectFocused(false)}
                        className="w-full bg-card/80 backdrop-blur-sm pt-6 pb-2 px-5 text-sm outline-none transition-all duration-300 appearance-none relative z-10 rounded-sm cursor-pointer"
                      >
                        <option value="" disabled hidden></option>
                        <option value="creation">Création sur mesure</option>
                        <option value="catalogue">Personnalisation d'un modèle</option>
                        <option value="rendez-vous">Prendre rendez-vous</option>
                        <option value="autre">Autre demande</option>
                      </select>
                      <label
                        htmlFor="contact-serviceType"
                        className="absolute left-5 pointer-events-none select-none transition-all duration-300 z-20"
                        style={{
                          top: formData.serviceType || selectFocused ? "0.4rem" : "1.1rem",
                          fontSize: formData.serviceType || selectFocused ? "0.6rem" : "0.875rem",
                          letterSpacing: formData.serviceType || selectFocused ? "0.1em" : "normal",
                          textTransform: formData.serviceType || selectFocused ? "uppercase" : "none",
                          color: selectFocused ? "#e85d04" : formData.serviceType ? "#e85d0480" : "var(--color-muted-foreground)",
                          fontWeight: formData.serviceType || selectFocused ? 500 : 400,
                        }}
                      >
                        Objet de la demande <span className="text-accent ml-0.5">*</span>
                      </label>
                      <ChevronDown 
                        className={`absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 transition-transform duration-300 pointer-events-none z-20 ${selectFocused ? 'text-accent rotate-180' : 'text-foreground/40'}`} 
                      />
                    </div>

                    <FloatingTextarea id="contact-message" label="Votre message — décrivez votre projet, vos envies..." value={formData.message} onChange={(v) => setFormData({ ...formData, message: v })} rows={5} />

                    {/* Submit button with progress bar */}
                    <div className="relative overflow-hidden mt-8 rounded-sm">
                      <motion.button
                        ref={btnRef}
                        type="submit"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={isSubmitting}
                        onClick={handleRipple}
                        className="ripple-btn shimmer-sweep w-full text-primary-foreground py-4 flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-[10px] font-medium disabled:opacity-80 transition-all relative overflow-hidden group/btn"
                        style={{ background: "linear-gradient(135deg, #e85d04, #b84600)" }}
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 rounded-sm border-2 border-white/30 border-t-white animate-spin" />
                            <span className="tracking-[0.3em]">Envoi en cours...</span>
                          </>
                        ) : (
                          <>
                            Envoyer la demande
                            <Send className="w-4 h-4 group-hover/btn:translate-x-2 group-hover/btn:-translate-y-1 transition-transform" />
                          </>
                        )}
                      </motion.button>

                      {/* Progress bar overlay */}
                      {isSubmitting && (
                        <motion.div
                          className="absolute bottom-0 left-0 h-1 z-20"
                          animate={{ width: `${submitProgress}%` }}
                          transition={{ duration: 0.1 }}
                          style={{ background: "#ffffff" }}
                        />
                      )}
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* ── GOOGLE MAPS ────────────────────── */}
        <section className="mb-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="w-full h-[400px] md:h-[500px] overflow-hidden border border-border relative group"
          >
            <div className="absolute inset-0 pointer-events-none z-10 shadow-[inset_0_0_50px_rgba(0,0,0,0.1)] transition-colors duration-500 group-hover:shadow-[inset_0_0_0px_rgba(0,0,0,0)]" />
            <iframe
              src="https://maps.google.com/maps?q=Sonfonia%20Centre%20Conakry&t=&z=14&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0, filter: "grayscale(0.3) contrast(1.1) brightness(1.05)" }}
              allowFullScreen={true}
              loading="lazy"
              title="Carte de l'Atelier EMROD"
            ></iframe>
          </motion.div>
        </section>

        {/* ── FAQ ACCORDION ─────────────────── */}
        <section className="py-24 border-t border-border">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <div className="text-xs uppercase tracking-[0.3em] font-medium mb-4" style={{ color: "#e85d04" }}>— Clarifications —</div>
              <h2 className="text-4xl md:text-5xl font-heading text-primary">Questions <span className="italic text-gradient-animated font-light">Fréquentes</span></h2>
            </motion.div>

            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} q={faq.q} a={faq.a} index={i} />
              ))}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
