import { XCircle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function PaymentCancel() {
  return (
    <div className="min-h-screen pt-32 pb-20 px-4 md:px-8 flex items-center justify-center relative overflow-hidden">
      <div className="w-full max-w-md bg-card/50 backdrop-blur-md border border-border/50 shadow-2xl rounded-sm p-8 md:p-12 text-center relative z-10 glass-card">
        <div className="w-20 h-20 mx-auto bg-red-500/10 rounded-sm flex items-center justify-center border border-red-500/20 mb-8">
          <XCircle className="w-10 h-10 text-red-500" />
        </div>
        
        <h1 className="text-2xl md:text-3xl font-heading text-primary mb-4">Paiement Annulé</h1>
        <p className="text-foreground/70 mb-8 text-sm leading-relaxed">
          Le processus de paiement a été interrompu ou a échoué. Aucun montant n'a été débité.
        </p>

        <Link
          to="/services"
          className="flex items-center justify-center gap-2 w-full py-4 bg-secondary/50 hover:bg-secondary text-primary transition-colors text-sm uppercase tracking-widest font-bold border border-border/50 rounded-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au catalogue
        </Link>
      </div>
    </div>
  );
}
