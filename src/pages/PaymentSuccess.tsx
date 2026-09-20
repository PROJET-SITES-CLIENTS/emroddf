import { useEffect } from "react";
import { CheckCircle, MessageCircle, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { fetchSettings } from "../lib/api";

const WHATSAPP_FALLBACK = "224623885959";

export default function PaymentSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    // Récupérer le message WhatsApp préparé avant le paiement
    const waMessage = localStorage.getItem("emrod_last_order_wa");

    const timer = setTimeout(async () => {
      if (waMessage) {
        // Numéro WhatsApp piloté par Paramètres → Contact
        let waNumber = WHATSAPP_FALLBACK;
        try {
          const s = await fetchSettings();
          waNumber = s.contact?.whatsapp || WHATSAPP_FALLBACK;
        } catch { /* repli */ }
        const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`;
        // Nettoyage
        localStorage.removeItem("emrod_last_order_wa");
        // Ouverture de WhatsApp
        window.location.href = waLink;
      } else {
        // Redirection fallback si pas de message
        navigate("/");
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 md:px-8 flex items-center justify-center relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-1/4 -left-64 w-[500px] h-[500px] bg-accent/5 rounded-sm blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-64 w-[500px] h-[500px] bg-accent/5 rounded-sm blur-[100px] pointer-events-none" />

      <div className="w-full max-w-lg bg-card/50 backdrop-blur-md border border-border/50 shadow-2xl rounded-sm p-8 md:p-12 text-center relative z-10 glass-card">
        <div className="absolute top-0 left-0 w-full h-1" style={{ background: "linear-gradient(90deg, #154c30, #e85d04, #154c30)", backgroundSize: "200% 100%", animation: "shimmer 3s infinite linear" }} />
        
        <div className="w-24 h-24 mx-auto bg-accent/10 rounded-sm flex items-center justify-center border border-accent/20 mb-8 relative">
          <div className="absolute inset-0 rounded-sm border border-accent animate-ping opacity-20" />
          <CheckCircle className="w-12 h-12 text-accent" />
        </div>
        
        <h1 className="text-3xl md:text-4xl font-heading text-primary mb-4">Paiement Réussi !</h1>
        <p className="text-foreground/70 mb-8 leading-relaxed">
          Merci pour votre confiance. Votre acompte a bien été reçu et votre commande est officiellement en cours de traitement par notre atelier.
        </p>

        <div className="bg-secondary/30 border border-border/50 p-4 flex flex-col items-center gap-3 rounded-sm mb-6">
          <Loader2 className="w-6 h-6 text-accent animate-spin" />
          <p className="text-sm text-foreground/80 font-medium">
            Redirection vers WhatsApp pour confirmer les détails...
          </p>
        </div>

        <Link
          to="/"
          className="text-xs text-foreground/50 hover:text-accent transition-colors uppercase tracking-widest inline-flex items-center gap-2"
        >
          Retour au site
        </Link>
      </div>
    </div>
  );
}
