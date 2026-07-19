// src/pages/ContactPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const ESPACES = [
  { value: 'arts_traditions',   label: 'Arts & Traditions' },
  { value: 'medina_1001_nuits', label: 'Médina 1001 Nuits' },
  { value: 'dar_zamen',         label: 'Dar Zamen' },
  { value: 'forfait_complet',   label: 'Forfait Complet (3 espaces)' },
];

const LANGUES = ['Français', 'Arabe', 'Anglais'];

// Field défini HORS du composant ContactPage : évite que React le recrée
// à chaque rendu (ce qui causait le warning "unique key prop" sur ses enfants)
function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-brown-deep mb-1">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

export default function ContactPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState({
    visiteur_prenom:'', visiteur_nom:'', visiteur_email:'',
    visiteur_telephone:'', visiteur_nationalite:'',
    espace:'arts_traditions', date_visite:'', heure_visite:'09:00',
    nombre_adultes:1, nombre_enfants:0,
    langue_visite:'Français', visite_guidee:false, message:'',
  });
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(null);
  const [errors, setErrors]       = useState({});

  useEffect(() => {
    api.get('/content/settings').then(r => setSettings(r.data.settings)).catch(console.error);
    if (user) {
      setForm(f => ({
        ...f,
        visiteur_prenom: user.prenom || '',
        visiteur_nom:    user.nom    || '',
        visiteur_email:  user.email  || '',
        visiteur_telephone: user.telephone || '',
        visiteur_nationalite: user.nationalite || '',
      }));
    }
  }, [user]);

  function set(field, value) { setForm(f => ({ ...f, [field]: value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    // validation basique
    const err = {};
    if (!form.visiteur_prenom) err.visiteur_prenom = 'Prénom requis';
    if (!form.visiteur_nom)    err.visiteur_nom    = 'Nom requis';
    if (!form.visiteur_email)  err.visiteur_email  = 'Email requis';
    if (!form.date_visite)     err.date_visite     = 'Date requise';
    if (Object.keys(err).length) { setErrors(err); return; }

    setLoading(true);
    try {
      const { data } = await api.post('/reservations', form);
      setSuccess(data.reference);
    } catch (err) {
      if (err.response?.data?.errors) {
        const e = {};
        err.response.data.errors.forEach(er => { e[er.path] = er.msg; });
        setErrors(e);
      } else {
        const msg = err.response?.data?.message || 'Erreur serveur';
        const detail = err.response?.data?.detail;
        setErrors({ global: detail ? `${msg} — ${detail}` : msg });
        // Affiche aussi tout dans la console pour debug
        console.error('Réponse complète erreur réservation :', err.response?.data);
      }
    } finally {
      setLoading(false);
    }
  }

  const fondContenu = settings?.fondsContenu?.contact;
  const hasHero = !!settings?.heroImages?.contact;

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ivory px-4">
        <div className="bg-white rounded-xl shadow-lg p-10 max-w-md w-full text-center border-t-4 border-sand">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="font-display text-3xl text-brown-deep mb-3">Réservation envoyée !</h2>
          <p className="text-gray-600 mb-6">Votre numéro de référence :</p>
          <div className="bg-sand/20 border border-sand rounded-lg py-4 px-6 mb-6">
            <p className="font-mono text-2xl font-bold text-brown-deep tracking-widest">{success}</p>
          </div>
          <p className="text-sm text-gray-500 mb-8">
            Un email de confirmation vous a été envoyé. Vous serez notifié dès validation par notre équipe.
          </p>
          <div className="space-y-3">
            <Link
              to={`/suivi-reservation?code=${encodeURIComponent(success)}`}
              className="block w-full text-center border border-brown-deep text-brown-deep py-3 font-semibold hover:bg-brown-deep hover:text-ivory transition-colors"
            >
              Suivre / annuler ma réservation
            </Link>
            <button onClick={() => { setSuccess(null); setForm(f => ({ ...f, date_visite:'', message:'' })); }}
              className="w-full bg-brown-deep text-ivory px-8 py-3 hover:bg-sand hover:text-brown-deep transition-colors">
              Faire une autre réservation
            </button>
          </div>
        </div>
      </div>
    );
  }

  const inputCls = (f) =>
    `w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sand/50 ${errors[f] ? 'border-red-400' : 'border-gray-300'}`;

  return (
    <div className="relative min-h-screen">
      {fondContenu && (
        <div className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${fondContenu})`, backgroundAttachment: 'fixed' }} />
      )}
      <div className={`absolute inset-0 ${fondContenu ? 'bg-night/75' : 'bg-ivory'}`} />

      <div className="relative z-10">
        {/* Hero (uniquement si une bannière est définie) */}
        {hasHero && (
          <section
            className="h-52 flex items-end bg-brown-deep relative overflow-hidden"
            style={{ backgroundImage:`url(${settings.heroImages.contact})`, backgroundSize:'cover', backgroundPosition:'center' }}
          >
            <div className="absolute inset-0 bg-night/60" />
            <div className="relative z-10 max-w-7xl mx-auto px-4 pb-8">
              <h1 className="font-display text-4xl text-ivory">Réserver une visite</h1>
            </div>
          </section>
        )}

        {!hasHero && (
          <div className="max-w-7xl mx-auto px-4 pt-12 pb-2">
            <h1 className={`font-display text-4xl ${fondContenu ? 'text-ivory' : 'text-brown-deep'}`}>
              Réserver une visite
            </h1>
          </div>
        )}

        <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="lg:col-span-2 bg-white/95 backdrop-blur-md rounded-xl shadow-md p-8">
            <h2 className="font-heading text-2xl text-brown-deep mb-6">Vos coordonnées</h2>

            {errors.global && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 text-sm">{errors.global}</div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
              <Field label="Prénom *" error={errors.visiteur_prenom}>
                <input className={inputCls('visiteur_prenom')} value={form.visiteur_prenom}
                  onChange={e => set('visiteur_prenom', e.target.value)} />
              </Field>
              <Field label="Nom *" error={errors.visiteur_nom}>
                <input className={inputCls('visiteur_nom')} value={form.visiteur_nom}
                  onChange={e => set('visiteur_nom', e.target.value)} />
              </Field>
              <Field label="Email *" error={errors.visiteur_email}>
                <input type="email" className={inputCls('visiteur_email')} value={form.visiteur_email}
                  onChange={e => set('visiteur_email', e.target.value)} />
              </Field>
              <Field label="Téléphone" error={errors.visiteur_telephone}>
                <input className={inputCls('visiteur_telephone')} value={form.visiteur_telephone}
                  onChange={e => set('visiteur_telephone', e.target.value)} />
              </Field>
              <Field label="Nationalité" error={errors.visiteur_nationalite}>
                <input className={inputCls('visiteur_nationalite')} value={form.visiteur_nationalite}
                  onChange={e => set('visiteur_nationalite', e.target.value)} />
              </Field>
            </div>

            <h2 className="font-heading text-2xl text-brown-deep mb-6">Détails de la visite</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              <Field label="Espace à visiter *">
                <select className={inputCls('espace')} value={form.espace} onChange={e => set('espace', e.target.value)}>
                  {ESPACES.map(es => <option key={es.value} value={es.value}>{es.label}</option>)}
                </select>
              </Field>
              <Field label="Langue de visite">
                <select className={inputCls('langue_visite')} value={form.langue_visite} onChange={e => set('langue_visite', e.target.value)}>
                  {LANGUES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </Field>
              <Field label="Date de visite *" error={errors.date_visite}>
                <input type="date" className={inputCls('date_visite')} value={form.date_visite}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => set('date_visite', e.target.value)} />
              </Field>
              <Field label="Heure souhaitée *">
                <select className={inputCls('heure_visite')} value={form.heure_visite} onChange={e => set('heure_visite', e.target.value)}>
                  {['09:00','10:00','10:30','11:00','14:00','14:30','15:00','15:30','20:00','21:00'].map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </Field>
              <Field label="Adultes *">
                <input type="number" min="1" max="50" className={inputCls('nombre_adultes')}
                  value={form.nombre_adultes} onChange={e => set('nombre_adultes', parseInt(e.target.value)||1)} />
              </Field>
              <Field label="Enfants (moins de 12 ans)">
                <input type="number" min="0" max="50" className={inputCls('nombre_enfants')}
                  value={form.nombre_enfants} onChange={e => set('nombre_enfants', parseInt(e.target.value)||0)} />
              </Field>
            </div>

            <div className="mb-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.visite_guidee}
                  onChange={e => set('visite_guidee', e.target.checked)}
                  className="w-4 h-4 accent-sand"/>
                <span className="text-sm text-brown-deep">Je souhaite une visite guidée</span>
              </label>
            </div>

            <Field label="Message ou demande particulière">
              <textarea rows={4} className={`${inputCls('message')} resize-none`}
                value={form.message} onChange={e => set('message', e.target.value)}
                placeholder="Questions, besoins spéciaux, groupe scolaire..." />
            </Field>

            <button type="submit" disabled={loading}
              className="mt-8 w-full bg-brown-deep text-ivory py-4 font-semibold text-lg hover:bg-sand hover:text-brown-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Envoi en cours...' : 'Envoyer ma demande de réservation'}
            </button>
          </form>

          {/* Infos contact */}
          <div className="space-y-6">
            <div className="bg-brown-deep/95 backdrop-blur-md text-ivory rounded-xl p-6">
              <h3 className="font-display text-xl text-sand mb-4">Informations pratiques</h3>
              <InfoContactBlock settings={settings} />
            </div>

            <div className="bg-ivory/95 backdrop-blur-md border border-sand/30 rounded-xl p-6">
              <h3 className="font-heading text-lg text-brown-deep mb-4">Horaires d'ouverture</h3>
              <HorairesBlock horaires={settings?.horaires} />
              <p className="text-xs text-gray-400 mt-2">Tous les jours (mêmes horaires)</p>
              <TarifsBlock tarifs={settings?.tarifs} />
            </div>

            {/* ── Bon à savoir → uniquement le lien de suivi de réservation ── */}
            <div className="bg-sand/10 backdrop-blur-md border border-sand/30 rounded-xl p-6">
              <p className="font-semibold text-brown-deep mb-2">💡 Bon à savoir</p>
              <p className="text-sm text-gray-600 mb-4">
                Vous avez déjà réservé ? Retrouvez le statut de votre réservation
                ou annulez-la à tout moment grâce à votre numéro de référence.
              </p>
              <Link
                to="/suivi-reservation"
                className="block w-full text-center border border-brown-deep text-brown-deep hover:bg-brown-deep hover:text-ivory rounded py-2.5 text-sm font-semibold transition-colors"
              >
                Suivre / annuler ma réservation
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sous-composants isolés : chacun retourne UN SEUL élément racine,
// donc jamais de mélange "statique + array" comme enfants directs du parent.

function InfoContactBlock({ settings }) {
  const rows = [];
  if (settings?.contact?.adresse)   rows.push({ key:'adresse',   icon:'📍', text:settings.contact.adresse });
  if (settings?.contact?.telephone) rows.push({ key:'telephone', icon:'📞', text:settings.contact.telephone });
  if (settings?.contact?.email)     rows.push({ key:'email',     icon:'✉️', text:settings.contact.email });

  return (
    <div className="space-y-3 text-sm">
      {rows.map(r => (
        <div key={r.key} className="flex gap-3">
          <span>{r.icon}</span>
          <p>{r.text}</p>
        </div>
      ))}
    </div>
  );
}

function HorairesBlock({ horaires }) {
  const items = (horaires || []).slice(0, 2);
  return (
    <div>
      {items.map((h, i) => (
        <div key={h?.jour ?? `horaire-${i}`} className="text-sm text-gray-600 mb-1">
          <span className="capitalize font-medium">{h?.jour || '—'}</span>
          {h && !h.ferme && <span className="ml-2">{h.ouvertureJournee} – {h.fermetureJournee}</span>}
          {h?.ferme && <span className="ml-2 text-red-500">Fermé</span>}
        </div>
      ))}
    </div>
  );
}

function TarifsBlock({ tarifs }) {
  if (!tarifs || tarifs.length === 0) return null;
  return (
    <div className="mt-4 pt-4 border-t border-sand/20">
      <h4 className="text-sm font-semibold text-brown-deep mb-2">Tarifs</h4>
      <div>
        {tarifs.map((t, i) => (
          <div key={t?.espace ?? `tarif-${i}`} className="flex justify-between text-sm text-gray-600">
            <span>{t?.label ?? '—'}</span>
            <span className="font-semibold text-sand">{t?.prix ?? 0} DT</span>
          </div>
        ))}
      </div>
    </div>
  );
}