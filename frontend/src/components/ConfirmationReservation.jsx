// src/components/ConfirmationReservation.jsx
// Écran affiché juste après l'envoi du formulaire de réservation.
// À utiliser dans ta page/section de réservation, ex :
//   {envoyee ? <ConfirmationReservation reference={reference} email={email} onNouvelle={...} /> : <FormulaireReservation ... />}

import { Link } from 'react-router-dom';

export default function ConfirmationReservation({ reference, email, onNouvelle }) {
  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-card border-2 border-gold p-8 text-center">
      <div className="text-5xl mb-4">🎉</div>

      <h2 className="font-display text-2xl text-royal mb-1">Réservation envoyée !</h2>
      <p className="text-sm text-text-sub mb-5">Votre numéro de référence :</p>

      <div className="bg-[#F5EFDD] border border-gold rounded-lg py-4 mb-6">
        <span className="font-display text-2xl tracking-widest text-royal font-bold">
          {reference}
        </span>
      </div>

      <p className="text-sm text-text-sub leading-relaxed mb-8">
        Un email de confirmation vous a été envoyé{email ? <> à <span className="font-semibold text-royal">{email}</span></> : ''}.
        Vous serez notifié dès validation par notre équipe.
      </p>

      <div className="space-y-3">
        <Link
          to={`/suivi-reservation?code=${encodeURIComponent(reference)}`}
          className="block w-full text-center border border-royal text-royal hover:bg-royal hover:text-white rounded-lg py-2.5 text-sm font-semibold tracking-wide transition-colors"
        >
          Suivre / annuler ma réservation
        </Link>

        <button
          type="button"
          onClick={onNouvelle}
          className="w-full text-center bg-royal text-white rounded-lg py-2.5 text-sm font-semibold tracking-wide hover:bg-royal-deep transition-colors"
        >
          Faire une autre réservation
        </button>
      </div>

      <p className="text-[11px] text-text-sub/70 mt-6">
        Conservez ce numéro de référence : il vous sera demandé pour suivre
        ou annuler votre réservation sans avoir besoin de créer de compte.
      </p>
    </div>
  );
}