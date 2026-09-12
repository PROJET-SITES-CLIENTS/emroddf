import { motion, Variants } from "motion/react";
import { Hammer, Ruler, Leaf, Heart, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import detailWood from "../assets/images/detail-wood.jpg";
import aboutWood from "../assets/images/about-wood.jpg";
import heroBg2 from "../assets/images/hero-bg-2.jpg";
import { Truck } from "lucide-react";
import { useState, useEffect } from "react";
import { fetchSettings, type SiteSettings } from "../lib/api";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40, filter: "blur(6px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] } }
};

const wordReveal: Variants = {
  hidden: { opacity: 0, y: 60, rotateX: -20, filter: "blur(4px)" },
  visible: (i: number) => ({
    opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)",
    transition: { delay: i * 0.12, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }
  })
};

// Icônes/couleurs par défaut des étapes (titres et textes pilotés via le tableau de bord)
const STEP_ICONS = [Heart, Ruler, Hammer, Truck];
const STEP_COLORS = ["#e85d04", "#e85d04", "#154c30", "#e85d04"];

const DEFAULT_STEPS = [
  { step: "01", title: "Choix du matériel", desc: "Le choix du matériel se fait en commun accord avec le client (notamment sur la partie matériaux nobles)." },
  { step: "02", title: "Validation du design", desc: "Nous réalisons des croquis et des plans détaillés. La validation du design se fait en accord avec le client avant de lancer la production." },
  { step: "03", title: "Façonnage, Finitions et Durabilité", desc: "Nous fabriquons votre meuble avec des techniques modernes (découpe de précision, assemblage optimisé). Nous appliquons ensuite les vernis et huiles de finition à la main pour garantir une grande durabilité." },
  { step: "04", title: "Livraison et Montage", desc: "L'installation se fait directement chez vous par notre équipe, garantissant un ajustement parfait et une durabilité maximale du meuble." },
];

export default function About() {
  // Contenus pilotés depuis le tableau de bord administrateur
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  useEffect(() => {
    fetchSettings().then(setSettings).catch(console.error);
  }, []);

  const about = settings?.about;
  const paragraphs = about?.paragraphs?.length
    ? about.paragraphs
    : [
        "L'aventure EMROD a commencé par une véritable passion pour le travail du bois et l'aménagement d'intérieur. Portée par une équipe de femmes talentueuses et déterminées, l'entreprise s'est donnée pour mission de transformer des matériaux nobles en créations uniques et sur mesure.",
        "Aujourd'hui, notre atelier incarne l'alliance parfaite entre artisanat minutieux et design contemporain. Nous croyons qu'un meuble n'est pas seulement fonctionnel : il reflète votre personnalité, raconte une histoire et donne vie à votre intérieur.",
      ];
  const quote =
    about?.quote ||
    "Le client est au cœur de tout le projet. Chaque réalisation est pensée et conçue en totale synergie avec vos envies.";
  const steps = (about?.steps?.length ? about.steps : DEFAULT_STEPS).map((s, i) => ({
    ...s,
    step: `0${i + 1}`,
    icon: STEP_ICONS[i % STEP_ICONS.length],
    color: STEP_COLORS[i % STEP_COLORS.length],
  }));
  return (
    <div className="bg-transparent text-foreground pt-24 pb-20 min-h-screen overflow-hidden">
      <div className="container mx-auto max-w-7xl px-6 md:px-12">

        {/* ── HEADER ─────────────────────────── */}
        <div className="relative pt-24 pb-24 mb-24 overflow-hidden group">
          <div className="absolute inset-0">
            <img src={heroBg2} alt="Atelier" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(13,51,32,0.9) 0%, rgba(13,51,32,0.7) 100%)" }} />
          </div>

          <div className="relative z-10 max-w-5xl px-8 md:px-16 text-white">
            <motion.div initial={{ opacity: 0, y: 20, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.7 }}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-white/20 text-[10px] uppercase tracking-[0.3em] font-medium mb-10 text-white/80">
                <span className="w-1.5 h-1.5 rounded-sm bg-accent" />
                Philosophie & Artisanat
              </div>
            </motion.div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl leading-[1.05] mb-12 tracking-tight font-heading font-light" style={{ perspective: "1000px" }}>
              <motion.span variants={wordReveal} custom={0} initial="hidden" animate="visible" className="inline-block mr-4 font-heading font-light">Notre</motion.span>
              <motion.span variants={wordReveal} custom={1} initial="hidden" animate="visible" className="inline-block mr-4 text-accent italic font-normal">passion</motion.span>
              <motion.span variants={wordReveal} custom={2} initial="hidden" animate="visible" className="inline-block mr-4 font-heading font-light">pour</motion.span>
              <br />
              <motion.span
                initial={{ opacity: 0, x: -40, filter: "blur(6px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                transition={{ delay: 0.55, duration: 1.1, ease: [0.76, 0, 0.24, 1] }}
                className="inline-block italic text-white font-normal relative"
              >
                la création sur mesure.
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 1.2, duration: 0.9, ease: "easeOut" }}
                  className="absolute -bottom-3 left-0 w-2/3 h-[3px] origin-left"
                  style={{ background: "linear-gradient(90deg, #e85d04, #f97316, transparent)" }}
                />
              </motion.span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="text-lg md:text-xl text-white/80 leading-relaxed font-light max-w-2xl"
            >
              "Chaque essence de bois a une histoire. Notre mission est de la révéler à travers des créations intemporelles adaptées à vos espaces."
            </motion.p>
          </div>
        </div>

        {/* ── NARRATIVE WITH IMAGES ──────────── */}
        <section className="mb-24">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40, filter: "blur(6px)" }}
              whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              viewport={{ once: true }}
              transition={{ duration: 0.9 }}
              className="space-y-8"
            >
              {/* Accent label */}
              <div className="text-xs uppercase tracking-[0.3em] font-medium" style={{ color: "#e85d04" }}>
                — Notre Histoire
              </div>
              {paragraphs.map((p, i) => (
                <p key={i} className="text-lg text-foreground/75 leading-relaxed">
                  {p}
                </p>
              ))}

              {/* Client at the center emphasis */}
              <div className="mt-8 p-6 border-l-2 border-accent relative overflow-hidden">
                <p className="text-xl italic font-heading text-accent leading-relaxed">
                  "{quote}"
                </p>
              </div>

              {/* Values inline */}
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border">
                {[
                  { label: "Authenticité", val: "100%" },
                  { label: "Durabilité", val: "∞" },
                ].map((v) => (
                  <motion.div
                    key={v.label}
                    className="p-5 bg-secondary/40 border border-border/50 cursor-default"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="font-heading text-3xl text-primary mb-1">{v.val}</div>
                    <div className="text-xs uppercase tracking-[0.2em] text-foreground/45">{v.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Images with clip-path reveal — Enhanced */}
            <div className="relative h-[600px]">
              <motion.div
                initial={{ clipPath: "inset(0 100% 0 0)", opacity: 0 }}
                whileInView={{ clipPath: "inset(0 0% 0 0)", opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, delay: 0.1, ease: [0.76, 0, 0.24, 1] }}
                className="absolute w-[80%] h-[80%] top-0 right-0 z-10 border border-border overflow-hidden"
              >
                <img src={detailWood} alt="Détail de bois noble" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 animate-ken-burns-reverse" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 60%, rgba(21,76,48,0.25))" }} />
              </motion.div>

              <motion.div
                initial={{ clipPath: "inset(0 0 0 100%)", opacity: 0 }}
                whileInView={{ clipPath: "inset(0 0 0 0%)", opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, delay: 0.4, ease: [0.76, 0, 0.24, 1] }}
                className="absolute w-[60%] h-[50%] bottom-0 left-0 overflow-hidden border-4 border-background bg-background"
              >
                <img src={aboutWood} alt="Détail de bois" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
              </motion.div>

              {/* Golden accent block instead of dot */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.9, type: "spring", stiffness: 400 }}
                className="absolute top-1/2 left-[36%] w-4 h-4 z-20"
                style={{ background: "#e85d04" }}
              />

              {/* Decorative block */}
              <div className="absolute top-[10%] right-[-5%] w-16 h-16 border border-accent/15" />
            </div>
          </div>
        </section>

        {/* ── METHODOLOGY ────────────────────── */}
        <section className="py-24 border-t border-border relative overflow-hidden">
          {/* Background pattern — Enhanced */}
          <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(45deg, #154c30 0px, #154c30 1px, transparent 0px, transparent 50%)", backgroundSize: "20px 20px" }} />
          {/* Decorative blob */}
          <div className="absolute top-1/4 right-0 w-80 h-80 rounded-sm opacity-[0.03] blur-3xl pointer-events-none animate-morph-blob" style={{ background: "#e85d04" }} />

          <div className="grid lg:grid-cols-12 gap-16 items-start relative z-10">
            <div className="lg:col-span-4 lg:sticky lg:top-32">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <span className="text-xs uppercase tracking-[0.3em] font-medium mb-4 block" style={{ color: "#e85d04" }}>Notre Méthode</span>
                <h2 className="text-4xl md:text-5xl font-heading mb-6">De l'idée à la <span className="italic text-gradient-animated">réalité.</span></h2>
                <p className="text-foreground/55 text-lg mb-8 leading-relaxed">
                  Découvrez les 4 étapes de notre processus de création, de l'idée à la réalisation de votre meuble.
                </p>
                <div className="w-16 h-[2px]" style={{ background: "linear-gradient(90deg, #e85d04, #f97316, transparent)" }} />

                {/* CTA */}
                <Link
                  to="/contact"
                  className="mt-10 inline-flex items-center gap-2 text-accent text-sm uppercase tracking-[0.2em] font-medium group"
                >
                  Démarrer votre projet
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-300" />
                </Link>
              </motion.div>
            </div>

            <div className="lg:col-span-8 relative">
              {/* Vertical animated line — Enhanced gradient */}
              <motion.div
                className="absolute left-[2.5rem] top-0 w-[2px] origin-top"
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 2, ease: "easeOut" }}
                style={{ height: "100%", background: "linear-gradient(to bottom, #e85d04, #f97316, #11522f, #e85d04)" }}
              />

              <div className="space-y-8 pl-0">
                {steps.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 40, filter: "blur(6px)" }}
                    whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.2, duration: 0.7, ease: "easeOut" }}
                    whileHover={{ x: 8, scale: 1.01 }}
                    className="bg-card border border-border p-6 md:p-8 flex flex-col md:flex-row gap-6 hover:border-accent/30 transition-all duration-500 group relative overflow-hidden ml-20"
                  >
                    {/* Left colored marker — animated on hover */}
                    <motion.div
                      className="absolute left-0 top-0 w-1 h-full"
                      style={{ background: item.color }}
                      initial={{ scaleY: 0 }}
                      whileInView={{ scaleY: 0 }}
                      whileHover={{ scaleY: 1 }}
                      transition={{ duration: 0.4 }}
                    />
                    <div className="absolute left-0 top-0 w-1 h-full transform scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-500" style={{ background: item.color }} />

                    {/* Subtle gradient bg on hover */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: `radial-gradient(circle at 0% 50%, ${item.color}06, transparent 60%)` }} />

                    {/* Circle with step number on the vertical line */}
                    <motion.div
                      className="absolute -left-[3.75rem] top-6 w-8 h-8 flex items-center justify-center border bg-card z-10"
                      style={{ borderColor: item.color }}
                      whileInView={{ scale: [0.5, 1.2, 1] }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.2 + 0.3, duration: 0.6, ease: "easeOut" }}
                    >
                      <span className="text-xs font-medium" style={{ color: item.color }}>{index + 1}</span>
                    </motion.div>

                    <div className="flex-shrink-0">
                      <motion.div
                        className="w-12 h-12 flex items-center justify-center"
                        style={{ background: `${item.color}10` }}
                        whileHover={{ rotate: 10, scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        <item.icon className="w-6 h-6" style={{ color: item.color }} />
                      </motion.div>
                    </div>

                    <div className="relative z-10">
                      <h3 className="font-heading text-xl md:text-2xl mb-3 text-primary group-hover:text-accent transition-colors duration-300">{item.title}</h3>
                      <p className="text-foreground/60 leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
