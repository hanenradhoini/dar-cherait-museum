// src/pages/SuiviReservationPage.jsx — Suivi & annulation de réservation sans compte
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';

const STATUTS = {
  en_attente: { label: 'En attente de validation', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  confirmee:  { label: 'Confirmée',                color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  annulee:    { label: 'Annulée',                  color: 'text-red-600',   bg: 'bg-red-50',   border: 'border-red-200' },
  terminee:   { label: 'Terminée',                 color: 'text-royal',     bg: 'bg-royal/5',  border: 'border-royal/20' },
};

const ESPACES_LABELS = {
  arts_traditions:   'Arts & Traditions',
  medina_1001_nuits: 'Médina 1001 Nuits',
  dar_zamen:         'Dar Zamen',
  forfait_complet:   'Forfait Complet (3 espaces)',
};

export default function SuiviReservationPage() {
  const [searchParams] = useSearchParams();
  const [reference, setReference] = useState(searchParams.get('code') || '');
  const [email, setEmail] = useState('');
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState('');
  const [annulationEnCours, setAnnulationEnCours] = useState(false);
  const [messageAnnulation, setMessageAnnulation] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setErreur('');
    setReservation(null);
    setMessageAnnulation('');
    setLoading(true);
    try {
      const r = await api.get('/reservations/lookup', {
        params: {
          reference: reference.trim().toUpperCase(),
          email: email.trim().toLowerCase(),
        },
      });
      setReservation(r.data.reservation);
    } catch (err) {
      setErreur(
        err?.response?.data?.message ||
        "Aucune réservation trouvée avec ce numéro de référence et cet email. Vérifiez vos informations."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleAnnuler() {
    if (!reservation) return;
    const confirme = window.confirm(
      "Voulez-vous vraiment annuler cette réservation ? Cette action est irréversible."
    );
    if (!confirme) return;

    setAnnulationEnCours(true);
    setMessageAnnulation('');
    try {
      const r = await api.patch('/reservations/annuler-public', {
        reference: reservation.reference,
        email: email.trim().toLowerCase(),
      });
      setReservation(prev => ({ ...prev, statut: 'annulee' }));
      setMessageAnnulation(r.data.message || "Votre réservation a bien été annulée.");
    } catch (err) {
      setMessageAnnulation(
        err?.response?.data?.message ||
        "Impossible d'annuler cette réservation pour le moment."
      );
    } finally {
      setAnnulationEnCours(false);
    }
  }

  const statutInfo = reservation ? (STATUTS[reservation.statut] || STATUTS.en_attente) : null;

  return (
    <div className="bg-[#D6E4F5] min-h-[70vh] py-16 px-6">
      <div className="max-w-lg mx-auto">

        <div className="text-center mb-8">
          <div className="section-tag mb-3">✦ &nbsp; Suivi de réservation</div>
          <h1 className="font-display text-3xl md:text-4xl text-royal mb-3">Suivre ma réservation</h1>
          <div className="w-12 h-0.5 bg-gold mx-auto mb-4" />
          <p className="text-text-sub text-sm max-w-sm mx-auto">
            Entrez votre numéro de référence et l'email utilisé lors de la réservation
            pour consulter son statut ou l'annuler.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-azure p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold tracking-wide uppercase text-royal/70 mb-1.5">
                Numéro de référence
              </label>
              <input
                type="text"
                value={reference}
                onChange={e => setReference(e.target.value)}
                placeholder="RES-53819508"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-azure focus:border-royal focus:ring-1 focus:ring-royal outline-none text-sm tracking-wide"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold tracking-wide uppercase text-royal/70 mb-1.5">
                Email utilisé lors de la réservation
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-azure focus:border-royal focus:ring-1 focus:ring-royal outline-none text-sm"
              />
            </div>

            {erreur && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                {erreur}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-gold w-full text-center disabled:opacity-60"
            >
              {loading ? 'Recherche…' : 'Consulter ma réservation'}
            </button>
          </form>
        </div>

        {/* ── Résultat ── */}
        {reservation && (
          <div className="bg-white rounded-2xl shadow-card border border-azure p-8 mt-6">
            <div className="flex items-center justify-between mb-5">
              <span className="text-[10px] tracking-[2px] uppercase text-royal/50 font-bold">
                Réf. {reservation.reference}
              </span>
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${statutInfo.bg} ${statutInfo.color} ${statutInfo.border}`}>
                {statutInfo.label}
              </span>
            </div>

            <ul className="space-y-2.5 text-sm mb-6">
              <li className="flex justify-between border-b border-azure/60 pb-2">
                <span className="text-text-sub">Nom</span>
                <span className="font-semibold text-royal">
                  {reservation.visiteur_prenom} {reservation.visiteur_nom}
                </span>
              </li>
              <li className="flex justify-between border-b border-azure/60 pb-2">
                <span className="text-text-sub">Espace</span>
                <span className="font-semibold text-royal">
                  {ESPACES_LABELS[reservation.espace] || reservation.espace}
                </span>
              </li>
              <li className="flex justify-between border-b border-azure/60 pb-2">
                <span className="text-text-sub">Date de visite</span>
                <span className="font-semibold text-royal">
                  {reservation.date_visite ? new Date(reservation.date_visite).toLocaleDateString('fr-FR') : '—'}
                  {reservation.heure_visite ? ` à ${reservation.heure_visite}` : ''}
                </span>
              </li>
              <li className="flex justify-between">
                <span className="text-text-sub">Visiteurs</span>
                <span className="font-semibold text-royal">
                  {reservation.nombre_adultes} adulte{reservation.nombre_adultes > 1 ? 's' : ''}
                  {reservation.nombre_enfants > 0 ? `, ${reservation.nombre_enfants} enfant${reservation.nombre_enfants > 1 ? 's' : ''}` : ''}
                </span>
              </li>
            </ul>

            {reservation.reponse_admin && (
              <div className="text-sm bg-royal/5 border border-royal/20 text-royal rounded-lg px-4 py-3 mb-4">
                <span className="block text-[10px] uppercase tracking-wide font-bold mb-1 text-royal/60">
                  Réponse de notre équipe
                </span>
                {reservation.reponse_admin}
              </div>
            )}

            {messageAnnulation && (
              <div className="text-sm bg-royal/5 border border-royal/20 text-royal rounded-lg px-4 py-2.5 mb-4">
                {messageAnnulation}
              </div>
            )}

            {['en_attente', 'confirmee'].includes(reservation.statut) ? (
              <button
                type="button"
                onClick={handleAnnuler}
                disabled={annulationEnCours}
                className="w-full text-center border border-red-300 text-red-600 hover:bg-red-50 rounded-lg py-2.5 text-sm font-semibold tracking-wide transition-colors disabled:opacity-60"
              >
                {annulationEnCours ? 'Annulation en cours…' : 'Annuler ma réservation'}
              </button>
            ) : (
              <p className="text-center text-sm text-text-sub">
                {reservation.statut === 'annulee'
                  ? 'Cette réservation a déjà été annulée.'
                  : 'Cette réservation ne peut plus être annulée.'}
              </p>
            )}
          </div>
        )}

      </div>
    </div>
  );
}