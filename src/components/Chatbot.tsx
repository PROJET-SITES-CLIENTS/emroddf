import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, RotateCcw, ChevronRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const FAQ_DATA = [
  {
    q: "Quels sont vos délais de fabrication ?",
    a: "Nos délais varient généralement entre **4 et 8 semaines** selon la complexité de la pièce. Nous vous communiquons un délai précis lors de l'établissement du devis.",
  },
  {
    q: "Où êtes-vous situés ?",
    a: "Notre atelier se trouve à **Conakry** : T7, Corniche Nord, virage du lac Sonfonia Centre (Carrefour Canal Plus).",
  },
  {
    q: "Comment passer une commande sur mesure ?",
    a: "Tout commence par un échange — en ligne ou à l'atelier. Nous écoutons vos besoins, réalisons des croquis, puis établissons un devis. Un **acompte de 50%** est demandé à la commande pour lancer la fabrication.",
  },
  {
    q: "Faites-vous la livraison ?",
    a: "Oui ! Nous livrons sur **tout Conakry**. Pour l'intérieur du pays, nous étudions des solutions logistiques sécurisées selon votre localisation.",
  },
  {
    q: "Quels matériaux utilisez-vous ?",
    a: "Nous travaillons avec des **bois locaux et nobles de Guinée**, du métal, du cuir, et des finitions haut de gamme (vernis, huiles naturelles) pour garantir durabilité et élégance.",
  },
  {
    q: "Puis-je personnaliser un modèle existant ?",
    a: "Absolument ! Tous nos modèles peuvent être **adaptés à vos dimensions**, dans l'essence de bois et la finition de votre choix. Votre vision, notre expertise.",
  },
  {
    q: "Quels sont vos moyens de paiement ?",
    a: "Nous acceptons les **virements bancaires**, les **chèques**, ainsi que les paiements mobiles via **Orange Money** et **Mobile Money**.",
  },
  {
    q: "Est-il possible de visiter votre atelier ?",
    a: "Avec grand plaisir ! Nous vous recevons **sur rendez-vous** à notre atelier de Sonfonia pour discuter de votre projet et vous montrer notre savoir-faire en direct.",
  },
  {
    q: "Faites-vous des aménagements pour professionnels ?",
    a: "Tout à fait. Nous réalisons des aménagements sur mesure pour les professionnels : **bureaux de direction**, comptoirs d'accueil, présentoirs pour boutiques, et bien plus.",
  },
];

type Message = {
  role: "user" | "assistant";
  content: string;
  id: number;
};

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 px-5 py-3.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-2.5 h-2.5 rounded-sm"
          style={{ background: "#e85d04" }}
          animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

function formatText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="text-accent font-semibold">{part.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Bonjour ! 👋 Je suis l'assistant EMROD. Sélectionnez une question ci-dessous ou cliquez pour en savoir plus sur nos créations.",
      id: 0,
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [showQuestions, setShowQuestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const msgId = useRef(1);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleQuestionClick = (faq: (typeof FAQ_DATA)[0]) => {
    const userMsg: Message = {
      role: "user",
      content: faq.q,
      id: msgId.current++,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);
    setShowQuestions(false);

    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: faq.a, id: msgId.current++ },
      ]);
      setShowQuestions(true);
    }, 1200 + Math.random() * 500);
  };

  const handleReset = () => {
    setMessages([
      {
        role: "assistant",
        content: "Bonjour ! 👋 Je suis l'assistant EMROD. Sélectionnez une question ci-dessous ou cliquez pour en savoir plus sur nos créations.",
        id: msgId.current++,
      },
    ]);
    setShowQuestions(true);
    setIsTyping(false);
  };

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 20 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-40 flex items-center gap-3 px-4 py-3 border border-border bg-white transition-all group rounded-sm hover:border-accent/40"
          >
            {/* Shimmer sweep isolated */}
            <div className="absolute inset-0 rounded-sm overflow-hidden pointer-events-none">
              <div className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 shimmer-sweep" style={{ background: "linear-gradient(90deg, transparent, rgba(232,93,4,0.05), transparent)" }} />
            </div>
            
            <div className="relative z-10 w-8 h-8 rounded-sm flex items-center justify-center bg-secondary/50 text-primary transition-colors duration-500 group-hover:bg-accent group-hover:text-white">
              <MessageCircle className="w-5 h-5 group-hover:animate-wiggle" />
              <div className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-sm bg-[#22c55e] opacity-75"></span>
                 <span className="relative inline-flex rounded-sm h-3.5 w-3.5 bg-[#22c55e] border-2 border-white"></span>
              </div>
            </div>
            <span className="text-xs font-normal tracking-[0.15em] text-primary group-hover:text-accent uppercase relative z-10 pr-2 transition-colors duration-500">
              Nous contacter
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 40, scale: 0.9, filter: "blur(10px)", transition: { duration: 0.3 } }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="fixed bottom-6 right-6 z-50 flex flex-col overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-border/60 glass-card"
            style={{
              width: "min(420px, calc(100vw - 48px))",
              height: "min(680px, calc(100vh - 48px))",
              borderRadius: "2px",
              background: "rgba(13, 51, 32, 0.85)",
            }}
          >
            {/* Ambient inner glow */}
            <div className="absolute top-0 right-0 w-[300px] h-[300px] opacity-[0.04] blur-[60px] pointer-events-none" style={{ background: "radial-gradient(circle, #e85d04, transparent)" }} />

            {/* Header */}
            <div
              className="shrink-0 flex items-center justify-between px-6 py-5 relative z-10"
              style={{
                background: "linear-gradient(135deg, rgba(21,76,48,0.9) 0%, rgba(17,82,47,0.95) 100%)",
                borderBottom: "1px solid rgba(232,93,4,0.15)"
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 flex items-center justify-center relative group"
                  style={{ borderRadius: "2px", background: "linear-gradient(135deg, #e85d04, #b84600)" }}
                >
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity rounded-sm" />
                  <Sparkles className="w-6 h-6 text-white animate-pulse" />
                </div>
                <div>
                  <p className="text-white font-heading text-lg tracking-wide leading-none mb-1">Assistant EMROD</p>
                  <p className="text-[#22c55e] text-xs flex items-center gap-1.5 font-medium uppercase tracking-widest">
                    <span className="w-1.5 h-1.5 rounded-sm bg-[#22c55e] inline-block animate-pulse" />
                    En ligne
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleReset}
                  title="Recommencer"
                  className="w-10 h-10 flex items-center justify-center text-white/50 hover:text-white bg-white/5 hover:bg-white/10 transition-all rounded-sm hover:rotate-180 duration-500"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-10 h-10 flex items-center justify-center text-white/50 hover:text-white bg-white/5 hover:bg-white/10 transition-all rounded-sm"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5 relative z-10" style={{ scrollbarWidth: "none" }}>
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <div
                        className="shrink-0 w-8 h-8 flex items-center justify-center self-end mb-1"
                        style={{ borderRadius: "2px", background: "linear-gradient(135deg, #e85d04, #b84600)" }}
                      >
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div
                      className="max-w-[82%] text-sm md:text-base leading-relaxed px-5 py-3.5 relative group"
                      style={
                        msg.role === "assistant"
                          ? {
                              background: "rgba(255,255,255,0.08)",
                              backdropFilter: "blur(8px)",
                              border: "1px solid rgba(232,93,4,0.1)",
                              borderRadius: "2px",
                              color: "rgba(255,255,255,0.9)",
                            }
                          : {
                              background: "linear-gradient(135deg, #e85d04, #b84600)",
                              borderRadius: "2px",
                              color: "#fff",
                            }
                      }
                    >
                      {formatText(msg.content)}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing indicator */}
              <AnimatePresence>
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className="flex gap-3 items-end"
                  >
                    <div
                      className="shrink-0 w-8 h-8 flex items-center justify-center self-end mb-1"
                      style={{ borderRadius: "2px", background: "linear-gradient(135deg, #e85d04, #b84600)" }}
                    >
                      <Sparkles className="w-4 h-4 text-white animate-pulse" />
                    </div>
                    <div
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        backdropFilter: "blur(8px)",
                        border: "1px solid rgba(232,93,4,0.1)",
                        borderRadius: "2px",
                      }}
                    >
                      <TypingDots />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={messagesEndRef} className="h-2" />
            </div>

            {/* FAQ Questions */}
            <AnimatePresence>
              {showQuestions && !isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.4 }}
                  className="shrink-0 px-5 pb-6 bg-gradient-to-t from-background/90 to-transparent pt-8 relative z-20"
                >
                  <p
                    className="text-[10px] uppercase font-medium mb-3 px-2 flex items-center gap-2"
                    style={{ color: "#e85d04", letterSpacing: "0.2em" }}
                  >
                    <span className="w-3 h-[1px] bg-accent" /> Questions fréquentes
                  </p>
                  <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar snap-x snap-mandatory" style={{ scrollbarWidth: "thin", scrollbarColor: "#e85d04 transparent" }}>
                    {FAQ_DATA.map((faq, idx) => (
                      <motion.button
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 + 0.2 }}
                        onClick={() => handleQuestionClick(faq)}
                        className="flex flex-col justify-between text-left text-sm p-4 shrink-0 w-[200px] snap-center group transition-all duration-300 relative overflow-hidden"
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          borderRadius: "2px",
                          color: "rgba(255,255,255,0.8)",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = "rgba(232,93,4,0.08)";
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(232,93,4,0.3)";
                          (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-4px)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)";
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.06)";
                          (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0px)";
                        }}
                      >
                        <span className="leading-snug font-medium mb-4">{faq.q}</span>
                        <div className="w-8 h-8 rounded-sm bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-accent group-hover:text-white transition-colors self-end">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
