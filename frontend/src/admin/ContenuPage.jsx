// src/admin/ContenuPage.jsx
import { useState, useEffect } from 'react';
import api from '../services/api';
import GalleryManager from './GalleryManager';
import DiaporamaManager from './DiaporamaManager';
const TABS = ['🏠 Accueil','🏛️ Expositions','🎨 Œuvres','🚶 Visite Guidée','📞 Contact','📅 Réservation'];

const DEFAULT_HORAIRES = [
  { jour: 'lundi',    ouvertureJournee: '08:00', fermetureJournee: '18:30', ouvertureSoiree: '20:00', fermetureSoiree: '00:00', ferme: false },
  { jour: 'mardi',    ouvertureJournee: '08:00', fermetureJournee: '18:30', ouvertureSoiree: '20:00', fermetureSoiree: '00:00', ferme: false },
  { jour: 'mercredi', ouvertureJournee: '08:00', fermetureJournee: '18:30', ouvertureSoiree: '20:00', fermetureSoiree: '00:00', ferme: false },
  { jour: 'jeudi',    ouvertureJournee: '08:00', fermetureJournee: '18:30', ouvertureSoiree: '20:00', fermetureSoiree: '00:00', ferme: false },
  { jour: 'vendredi', ouvertureJournee: '08:00', fermetureJournee: '18:30', ouvertureSoiree: '20:00', fermetureSoiree: '00:00', ferme: false },
  { jour: 'samedi',   ouvertureJournee: '08:00', fermetureJournee: '18:30', ouvertureSoiree: '20:00', fermetureSoiree: '00:00', ferme: false },
  { jour: 'dimanche', ouvertureJournee: '08:00', fermetureJournee: '18:30', ouvertureSoiree: '20:00', fermetureSoiree: '00:00', ferme: false },
];

const DEFAULT_TARIFS = [
  { espace: 'arts_traditions',   label: 'Arts & Traditions',   prix: 5.5, ordre: 1, actif: true },
  { espace: 'medina_1001_nuits', label: 'Médina 1001 Nuits',   prix: 6,   ordre: 2, actif: true },
  { espace: 'dar_zamen',         label: 'Dar Zamen',           prix: 6,   ordre: 3, actif: true },
  { espace: 'forfait_complet',   label: 'Forfait Tout Inclus', prix: 15,  ordre: 4, actif: true },
];

const DEFAULT_HERO_IMAGES = { accueil:'', expositions:'', oeuvres:'', visite:'', contact:'', informations:'' };

function errMsg(e) {
  const data = e.response?.data;
  if (!data) return e.message || 'Erreur réseau';
  console.error('Réponse erreur complète :', data);
  return data.detail ? `${data.message} — ${data.detail}` : (data.message || 'Erreur');
}

function normalizeSettings(raw) {
  return {
    nomSite: raw?.nomSite || 'Musée Dar Cheraït',
    slogan: raw?.slogan || '',
    heroImages: { ...DEFAULT_HERO_IMAGES, ...(raw?.heroImages || {}) },
    heroImagesSlider: raw?.heroImagesSlider || [],
    fondsContenu: {
      visite: raw?.fondsContenu?.visite || '',
      expositions: raw?.fondsContenu?.expositions || '',
      oeuvres: raw?.fondsContenu?.oeuvres || '',
      contact: raw?.fondsContenu?.contact || '',
      informations: raw?.fondsContenu?.informations || '',
    },
    horaires: (raw?.horaires && raw.horaires.length === 7) ? raw.horaires : DEFAULT_HORAIRES,
    tarifs: (raw?.tarifs && raw.tarifs.length > 0) ? raw.tarifs : DEFAULT_TARIFS,
    contact: {
      adresse: raw?.contact?.adresse || '',
      telephone: raw?.contact?.telephone || '',
      telephoneMobile: raw?.contact?.telephoneMobile || '',
      email: raw?.contact?.email || '',
      latitude: raw?.contact?.latitude ?? '',
      longitude: raw?.contact?.longitude ?? '',
      googleMapsUrl: raw?.contact?.googleMapsUrl || '',
    },
    reseauxSociaux: raw?.reseauxSociaux || [],
  };
}

export default function ContenuPage() {
  const [tab, setTab]           = useState(0);
  const [settings, setSettings] = useState(null);
  const [espaces, setEspaces]   = useState([]);
  const [collections, setCollections] = useState([]);
  const [visite, setVisite]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [msg, setMsg]           = useState('');
  const [err, setErr]           = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/content/settings').catch(() => ({ data: { settings: null } })),
      api.get('/content/espaces').catch(() => ({ data: { espaces: [] } })),
      api.get('/content/collections').catch(() => ({ data: { collections: [] } })),
      api.get('/content/visite').catch(() => ({ data: { visite: null } })),
    ]).then(([s, e, c, v]) => {
      setSettings(normalizeSettings(s.data.settings));
      setEspaces(e.data.espaces || []);
      setCollections(c.data.collections || []);
      setVisite(v.data.visite || { introduction: '', horairesDepart: [], languesDisponibles: [] });
    }).finally(() => setLoading(false));
  }, []);

  async function saveSettings(patch) {
    try {
      const { data } = await api.put('/content/settings', patch);
      setSettings(normalizeSettings(data.settings));
      flash('✅ Enregistré avec succès');
    } catch (e) { flashErr(errMsg(e)); }
  }

  function flash(m) { setMsg(m); setErr(''); setTimeout(() => setMsg(''), 3000); }
  function flashErr(m) { setErr(m); setMsg(''); setTimeout(() => setErr(''), 6000); }

  async function reloadEspaces() {
    const r = await api.get('/content/espaces'); setEspaces(r.data.espaces || []);
  }
  async function reloadCollections() {
    const r = await api.get('/content/collections'); setCollections(r.data.collections || []);
  }
  async function reloadSettings() {
    const r = await api.get('/content/settings');
    setSettings(normalizeSettings(r.data.settings));
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-sand border-t-transparent rounded-full animate-spin"/>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold text-brown-deep mb-2">Gestion du contenu</h1>

      {msg && <div className="text-green-700 bg-green-50 border border-green-200 px-4 py-2 rounded mb-4 text-sm inline-block">{msg}</div>}
      {err && <div className="text-red-700 bg-red-50 border border-red-200 px-4 py-2 rounded mb-4 text-sm inline-block">{err}</div>}

      <div className="flex flex-wrap gap-1 border-b border-gray-200 mb-6">
        {TABS.map((t, i) => (
          <button type="button" key={i} onClick={() => setTab(i)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab===i ? 'border-sand text-brown-deep' : 'border-transparent text-gray-500 hover:text-brown-deep'
            }`}>{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <AccueilTab settings={settings} setSettings={setSettings} onSave={saveSettings}
          flash={flash} flashErr={flashErr} />
      )}

      {tab === 1 && (
        <ExpositionsTab espaces={espaces} onReload={reloadEspaces} flash={flash} flashErr={flashErr} />
      )}

      {tab === 2 && (
        <OeuvresTab collections={collections} onReload={reloadCollections} flash={flash} flashErr={flashErr} />
      )}

      {tab === 3 && visite && (
        <VisiteTab visite={visite} setVisite={setVisite} flash={flash} flashErr={flashErr}
          settings={settings} setSettings={setSettings} onSaveSettings={saveSettings} />
      )}

      {tab === 4 && (
        <InfoTab settings={settings} setSettings={setSettings} onSave={saveSettings}
          flash={flash} flashErr={flashErr} onReloadSettings={reloadSettings} />
      )}

      {tab === 5 && (
        <ReservationTab settings={settings} setSettings={setSettings} onSave={saveSettings} />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   ACCUEIL TAB — diaporama + hero images + horaires + tarifs
───────────────────────────────────────────── */
function AccueilTab({ settings, setSettings, onSave, flash, flashErr }) {
  const inputCls = 'w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sand/40';
  const PAGE_LABELS = { accueil:'Accueil', expositions:'Expositions', oeuvres:'Œuvres', visite:'Visite guidée' };
  const FOND_CONTENU_LABELS = { visite:'Visite guidée', expositions:'Expositions', oeuvres:'Œuvres' };

  return (
    <div className="space-y-10 max-w-3xl">

      {/* Diaporama accueil */}
      <DiaporamaManager
        images={settings.heroImagesSlider || []}
        onChange={urls => setSettings(s => ({ ...s, heroImagesSlider: urls }))}
        onSave={onSave}
        flash={flash}
        flashErr={flashErr}
      />

      {/* Hero Images */}
      <section>
        <h2 className="font-heading text-lg font-semibold text-brown-deep mb-1">Images Hero (bannières)</h2>
        <p className="text-gray-400 text-xs mb-4">Image affichée en haut de chaque page publique</p>
        <div className="space-y-4">
          {Object.keys(PAGE_LABELS).map(page => (
            <div key={page} className="bg-white rounded-xl border border-gray-200 p-4">
              <label className="block text-sm font-semibold text-brown-deep mb-2">
                Page : {PAGE_LABELS[page]}
              </label>
              <div className="flex gap-2 items-start">
                <input className={inputCls} placeholder="URL de l'image (https://...)"
                  value={settings.heroImages[page] || ''}
                  onChange={e => setSettings(s => ({...s, heroImages:{...s.heroImages, [page]:e.target.value}}))} />
                <UploadButton onUploaded={url => setSettings(s => ({...s, heroImages:{...s.heroImages, [page]:url}}))} />
              </div>
              {settings.heroImages[page] && (
                <div className="mt-2 relative group">
                  <img src={settings.heroImages[page]} alt=""
                    className="h-24 w-full object-cover rounded opacity-80 group-hover:opacity-100 transition-opacity"/>
                  <button type="button" onClick={() => setSettings(s => ({...s, heroImages:{...s.heroImages, [page]:''} }))}
                    className="absolute top-1 right-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    Retirer
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        <button type="button" onClick={() => onSave({ heroImages: settings.heroImages })}
          className="mt-4 bg-brown-deep text-ivory px-6 py-2 text-sm rounded hover:bg-sand hover:text-brown-deep transition-colors">
          💾 Sauvegarder les bannières
        </button>
      </section>

      {/* Fonds de contenu (distincts des bannières) */}
      <section>
        <h2 className="font-heading text-lg font-semibold text-brown-deep mb-1">🖼️ Fonds de contenu des pages</h2>
        <p className="text-gray-400 text-xs mb-4">
          Photo affichée en arrière-plan du corps de chaque page (sous la bannière du haut).
          Si vide, la bannière ci-dessus ne s'affiche pas non plus et cette photo devient l'unique fond, du haut au bas de la page.
        </p>
        <div className="space-y-4">
          {Object.entries(FOND_CONTENU_LABELS).map(([page, label]) => (
            <div key={page} className="bg-white rounded-xl border border-gray-200 p-4">
              <label className="block text-sm font-semibold text-brown-deep mb-2">
                Page : {label}
              </label>
              <div className="flex gap-2 items-start">
                <input className={inputCls} placeholder="URL de l'image (https://...)"
                  value={settings.fondsContenu?.[page] || ''}
                  onChange={e => setSettings(s => ({...s, fondsContenu:{...s.fondsContenu, [page]:e.target.value}}))} />
                <UploadButton onUploaded={url => setSettings(s => ({...s, fondsContenu:{...s.fondsContenu, [page]:url}}))} />
              </div>
              {settings.fondsContenu?.[page] && (
                <div className="mt-2 relative group">
                  <img src={settings.fondsContenu[page]} alt=""
                    className="h-24 w-full object-cover rounded opacity-80 group-hover:opacity-100 transition-opacity"/>
                  <button type="button" onClick={() => setSettings(s => ({...s, fondsContenu:{...s.fondsContenu, [page]:''} }))}
                    className="absolute top-1 right-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    Retirer
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        <button type="button" onClick={() => onSave({ fondsContenu: settings.fondsContenu })}
          className="mt-4 bg-brown-deep text-ivory px-6 py-2 text-sm rounded hover:bg-sand hover:text-brown-deep transition-colors">
          💾 Sauvegarder les fonds de contenu
        </button>
      </section>

      {/* Horaires */}
      <section>
        <h2 className="font-heading text-lg font-semibold text-brown-deep mb-1">Horaires d'ouverture</h2>
        <p className="text-gray-400 text-xs mb-4">Journée : ouverture → fermeture &nbsp;|&nbsp; Soirée : ouverture → fermeture</p>
        <div className="space-y-2">
          {settings.horaires.map((h, i) => (
            <div key={h.jour || i} className="grid grid-cols-5 gap-2 items-center bg-white p-3 rounded-lg border border-gray-100">
              <span className="text-sm capitalize text-brown-deep font-semibold">{h.jour}</span>
              {['ouvertureJournee','fermetureJournee','ouvertureSoiree','fermetureSoiree'].map(field => (
                <input key={field} type="time" className={inputCls} value={h[field] || ''}
                  onChange={e => {
                    const hs = [...settings.horaires];
                    hs[i] = { ...hs[i], [field]: e.target.value };
                    setSettings(s => ({ ...s, horaires: hs }));
                  }} />
              ))}
            </div>
          ))}
        </div>
        <button type="button" onClick={() => onSave({ horaires: settings.horaires })}
          className="mt-4 bg-brown-deep text-ivory px-6 py-2 text-sm rounded hover:bg-sand hover:text-brown-deep transition-colors">
          💾 Sauvegarder les horaires
        </button>
      </section>

      {/* Tarifs */}
      <section>
        <h2 className="font-heading text-lg font-semibold text-brown-deep mb-4">Tarifs</h2>
        <div className="space-y-2">
          {settings.tarifs.map((t, i) => (
            <div key={t.espace || i} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-100">
              <span className="flex-1 text-sm text-brown-deep font-medium">{t.label}</span>
              <input type="number" step="0.5" min="0"
                className="border border-gray-300 rounded px-3 py-1.5 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-sand/40"
                value={t.prix}
                onChange={e => {
                  const ts = [...settings.tarifs];
                  ts[i] = { ...ts[i], prix: parseFloat(e.target.value) || 0 };
                  setSettings(s => ({ ...s, tarifs: ts }));
                }} />
              <span className="text-sm text-gray-500 w-6">DT</span>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => onSave({ tarifs: settings.tarifs })}
          className="mt-4 bg-brown-deep text-ivory px-6 py-2 text-sm rounded hover:bg-sand hover:text-brown-deep transition-colors">
          💾 Sauvegarder les tarifs
        </button>
      </section>
    </div>
  );
}

/* Petit bouton d'upload réutilisable qui renvoie l'URL via callback */
function UploadButton({ onUploaded }) {
  const [busy, setBusy] = useState(false);
  async function handleFile(file) {
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData(); fd.append('images', file);
      const { data } = await api.post('/media/upload', fd, { headers:{'Content-Type':'multipart/form-data'} });
      onUploaded(data.medias[0].url);
    } catch (e) {
      alert(e.response?.data?.message || 'Erreur upload');
    } finally { setBusy(false); }
  }
  return (
    <label className="cursor-pointer flex-shrink-0 text-xs text-sand border border-sand px-3 py-1.5 rounded hover:bg-sand hover:text-brown-deep transition-colors whitespace-nowrap">
      {busy ? '⏳...' : '📁 Upload'}
      <input type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files[0])} />
    </label>
  );
}

/* Zone de drop multi-fichiers réutilisable */
function SalleDropZone({ onFiles }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useState(() => Math.random().toString(36).slice(2))[0];

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    onFiles(e.dataTransfer.files);
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onClick={() => document.getElementById(`salle-drop-${inputRef}`).click()}
      className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
        dragOver ? 'border-sand bg-sand/10' : 'border-gray-300 hover:border-sand/50 bg-white'
      }`}
    >
      <input
        id={`salle-drop-${inputRef}`}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => { onFiles(e.target.files); e.target.value = ''; }}
      />
      <p className="text-xl mb-1">📸</p>
      <p className="text-xs text-gray-500 font-medium">
        Glissez plusieurs photos ici, ou cliquez pour sélectionner
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   EXPOSITIONS TAB — espaces + salles + galerie
───────────────────────────────────────────── */
function ExpositionsTab({ espaces, onReload, flash, flashErr }) {
  const [creating, setCreating] = useState(false);
  const [newEspace, setNewEspace] = useState({ titre:'', description:'', imageUrl:'' });

  async function createEspace() {
    if (!newEspace.titre.trim()) { flashErr('Le titre est requis'); return; }
    try {
      await api.post('/content/espaces', newEspace);
      setNewEspace({ titre:'', description:'', imageUrl:'' });
      setCreating(false);
      flash('✅ Espace créé');
      await onReload();
    } catch (e) { flashErr(errMsg(e)); }
  }

  const inputCls = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sand/40';

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <p className="text-gray-500 text-sm">Gérez les espaces, leurs salles et la galerie photo de chaque salle.</p>
        <button type="button" onClick={() => setCreating(!creating)}
          className="bg-brown-deep text-ivory px-4 py-2 text-sm rounded font-semibold hover:bg-sand hover:text-brown-deep transition-colors flex-shrink-0">
          {creating ? '✕ Annuler' : '+ Nouvel espace'}
        </button>
      </div>

      {creating && (
        <div className="bg-sand/10 border-2 border-dashed border-sand/40 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase font-semibold mb-3">Créer un nouvel espace</p>
          <div className="space-y-3 mb-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Titre *</label>
              <input className={inputCls} value={newEspace.titre}
                onChange={e => setNewEspace(n => ({...n, titre:e.target.value}))}
                placeholder="ex: Médina 1001 Nuits" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Description</label>
              <textarea rows={2} className={`${inputCls} resize-none`} value={newEspace.description}
                onChange={e => setNewEspace(n => ({...n, description:e.target.value}))} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Photo de couverture (optionnel)</label>
              <div className="flex gap-2 items-start">
                <input className={inputCls} placeholder="URL image" value={newEspace.imageUrl}
                  onChange={e => setNewEspace(n => ({...n, imageUrl:e.target.value}))} />
                <UploadButton onUploaded={url => setNewEspace(n => ({...n, imageUrl:url}))} />
              </div>
              {newEspace.imageUrl && (
                <img src={newEspace.imageUrl} alt="" className="mt-2 h-24 w-full object-cover rounded"/>
              )}
            </div>
          </div>
          <button type="button" onClick={createEspace}
            className="bg-sand text-brown-deep px-5 py-2 text-sm rounded font-semibold hover:bg-gold transition-colors">
            + Créer l'espace
          </button>
        </div>
      )}

      {espaces.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">Aucun espace pour le moment. Créez-en un avec le bouton ci-dessus.</p>
      ) : (
        espaces.map(e => (
          <EspaceEditor key={e._id} espace={e} onReload={onReload} flash={flash} flashErr={flashErr} />
        ))
      )}
    </div>
  );
}

function EspaceEditor({ espace, onReload, flash, flashErr }) {
  const [open, setOpen]         = useState(false);
  const [titre, setTitre]       = useState(espace.titre || '');
  const [desc, setDesc]         = useState(espace.description || '');
  const [imageUrl, setImageUrl] = useState(espace.imageUrl || '');
  const [saving, setSaving]     = useState(false);

  const [newSalle, setNewSalle] = useState({ titre:'', categorie:'univers', description:'' });
  const [newSallePhotos, setNewSallePhotos] = useState([]);
  const [uploadingSalle, setUploadingSalle] = useState(false);
  const [expandedSalle, setExpandedSalle] = useState(null);

  function addPhotosToNewSalle(fileList) {
    const files = Array.from(fileList || []).filter(f => f.type.startsWith('image/'));
    const withPreview = files.map(file => ({ file, previewUrl: URL.createObjectURL(file) }));
    setNewSallePhotos(prev => [...prev, ...withPreview]);
  }

  function removeNewSallePhoto(index) {
    setNewSallePhotos(prev => prev.filter((_, i) => i !== index));
  }

  async function saveEspace() {
    setSaving(true);
    try {
      await api.put(`/content/espaces/${espace._id}`, { titre, description: desc, imageUrl });
      flash('✅ Espace mis à jour');
      await onReload();
    } catch(e) { flashErr(errMsg(e)); }
    finally { setSaving(false); }
  }

  async function deleteEspace() {
    if (!window.confirm(`Supprimer définitivement l'espace "${espace.titre}" et toutes ses salles ?`)) return;
    try {
      await api.delete(`/content/espaces/${espace._id}`);
      flash('✅ Espace supprimé');
      await onReload();
    } catch (e) { flashErr(errMsg(e)); }
  }

  async function addSalle() {
    if (!newSalle.titre) { flashErr('Titre requis'); return; }
    setUploadingSalle(true);
    try {
      const { data } = await api.post(`/content/espaces/${espace._id}/salles`, newSalle);

      if (newSallePhotos.length > 0) {
        const salleCree = data.espace.salles[data.espace.salles.length - 1];

        const fd = new FormData();
        newSallePhotos.forEach(p => fd.append('images', p.file));
        const { data: uploadData } = await api.post('/media/upload', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        const photos = uploadData.medias.map(m => ({ url: m.url, alt: '', legende: '' }));
        await api.post(`/content/espaces/${espace._id}/salles/${salleCree._id}/galerie`, { photos });
      }

      newSallePhotos.forEach(p => URL.revokeObjectURL(p.previewUrl));
      setNewSalle({ titre:'', categorie:'univers', description:'' });
      setNewSallePhotos([]);
      flash(`✅ Salle ajoutée${newSallePhotos.length ? ` avec ${newSallePhotos.length} photo(s)` : ''}`);
      await onReload();
    } catch(e) { flashErr(errMsg(e)); }
    finally { setUploadingSalle(false); }
  }

  const inputCls = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sand/40';

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="w-full flex items-center justify-between px-5 py-4">
        <button type="button" onClick={() => setOpen(!open)} className="flex items-center gap-3 flex-1 text-left">
          {espace.imageUrl
            ? <img src={espace.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover"/>
            : <div className="w-12 h-12 rounded-lg bg-sand/30 flex items-center justify-center text-xl">🏛️</div>
          }
          <div>
            <h3 className="font-heading font-semibold text-brown-deep">{titre || espace.titre}</h3>
            <p className="text-xs text-gray-400">{espace.salles?.length || 0} salle(s)</p>
          </div>
        </button>
        <button type="button" onClick={deleteEspace}
          className="text-xs text-red-400 hover:text-red-600 px-2 flex-shrink-0">🗑️ Supprimer</button>
        <button type="button" onClick={() => setOpen(!open)} className="text-gray-400 text-lg ml-2 flex-shrink-0">{open ? '▲' : '▼'}</button>
      </div>

      {open && (
        <div className="border-t border-gray-100 p-5 space-y-6">

          {/* ── Champs d'édition de l'espace ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 uppercase font-semibold mb-1 block">Titre</label>
              <input className={inputCls} value={titre}
                onChange={e => setTitre(e.target.value)}
                placeholder="ex: Médina 1001 Nuits" />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase font-semibold mb-1 block">Image principale</label>
              <div className="flex gap-2 items-start">
                <input className={inputCls} placeholder="URL image" value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)} />
                <UploadButton onUploaded={setImageUrl} />
              </div>
              {imageUrl && <img src={imageUrl} alt="" className="h-16 w-full object-cover rounded mt-2"/>}
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-gray-500 uppercase font-semibold mb-1 block">Description</label>
              <textarea rows={3} className={`${inputCls} resize-none`} value={desc}
                onChange={e => setDesc(e.target.value)} />
            </div>
          </div>

          <button type="button" onClick={saveEspace} disabled={saving}
            className="bg-brown-deep text-ivory px-5 py-2 text-sm rounded hover:bg-sand hover:text-brown-deep transition-colors disabled:opacity-50">
            {saving ? 'Enregistrement...' : '💾 Sauvegarder l\'espace'}
          </button>

          {/* ── Salles ── */}
          <div>
            <h4 className="font-heading font-semibold text-brown-deep mb-3 border-t border-gray-100 pt-4">
              Salles ({espace.salles?.length || 0})
            </h4>

            {(!espace.salles || espace.salles.length === 0)
              ? <p className="text-gray-400 text-sm mb-4">Aucune salle pour le moment</p>
              : (
                <div className="space-y-3 mb-4">
                  {espace.salles.map(s => (
                    <SalleEditor
                      key={s._id}
                      salle={s}
                      espaceId={espace._id}
                      expandedSalle={expandedSalle}
                      setExpandedSalle={setExpandedSalle}
                      onReload={onReload}
                      flash={flash}
                      flashErr={flashErr}
                    />
                  ))}
                </div>
              )
            }

            <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-4">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-3">+ Ajouter une salle</p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Titre *</label>
                  <input className={inputCls} value={newSalle.titre}
                    onChange={e => setNewSalle(n=>({...n,titre:e.target.value}))} placeholder="ex: Salle des bijoux" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Catégorie</label>
                  <select className={inputCls} value={newSalle.categorie}
                    onChange={e => setNewSalle(n=>({...n,categorie:e.target.value}))}>
                    <option value="architecture">Architecture</option>
                    <option value="scenographie">Scénographie</option>
                    <option value="univers">Univers</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-400 mb-1 block">Description (optionnel)</label>
                  <input className={inputCls} value={newSalle.description}
                    onChange={e => setNewSalle(n=>({...n,description:e.target.value}))} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-400 mb-1 block">Photos de la galerie (plusieurs à la fois)</label>
                  <SalleDropZone onFiles={addPhotosToNewSalle} />
                  {newSallePhotos.length > 0 && (
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mt-3">
                      {newSallePhotos.map((p, i) => (
                        <div key={i} className="relative group">
                          <img src={p.previewUrl} alt="" className="w-full h-16 object-cover rounded border border-gray-200"/>
                          <button type="button" onClick={() => removeNewSallePhoto(i)}
                            className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <button type="button" onClick={addSalle} disabled={uploadingSalle}
                className="bg-sand text-brown-deep px-5 py-2 text-sm rounded font-semibold hover:bg-gold transition-colors disabled:opacity-50">
                {uploadingSalle ? '⏳ Envoi en cours...' : `+ Créer la salle${newSallePhotos.length ? ` (${newSallePhotos.length} photo${newSallePhotos.length > 1 ? 's' : ''})` : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   SALLE EDITOR — titre + catégorie + galerie
───────────────────────────────────────────── */
function SalleEditor({ salle, espaceId, expandedSalle, setExpandedSalle, onReload, flash, flashErr }) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titre, setTitre]               = useState(salle.titre || '');
  const [categorie, setCategorie]       = useState(salle.categorie || 'univers');
  const [saving, setSaving]             = useState(false);
  const isExpanded = expandedSalle === salle._id;
  const couverture = salle.galerie?.find(p => p.isCouverture) || salle.galerie?.[0];

  async function saveSalle() {
    if (!titre.trim()) { flashErr('Le titre est requis'); return; }
    setSaving(true);
    try {
      await api.put(`/content/espaces/${espaceId}/salles/${salle._id}`, { titre, categorie });
      flash('✅ Salle mise à jour');
      setEditingTitle(false);
      await onReload();
    } catch (e) { flashErr(errMsg(e)); }
    finally { setSaving(false); }
  }

  async function deleteSalle() {
    if (!window.confirm('Supprimer cette salle et toute sa galerie ?')) return;
    try {
      await api.delete(`/content/espaces/${espaceId}/salles/${salle._id}`);
      flash('✅ Salle supprimée');
      await onReload();
    } catch (e) { flashErr(errMsg(e)); }
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex items-center gap-3 p-3 bg-gray-50">
        {couverture
          ? <img src={couverture.url} alt="" className="w-14 h-14 rounded object-cover flex-shrink-0"/>
          : <div className="w-14 h-14 rounded bg-sand/20 flex items-center justify-center text-xl flex-shrink-0">🖼️</div>
        }
        <div className="flex-1 min-w-0">
          {editingTitle ? (
            <div className="flex gap-2 items-center">
              <input className="border border-gray-300 rounded px-2 py-1 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-sand/40"
                value={titre} onChange={e => setTitre(e.target.value)}
                autoFocus onKeyDown={e => { if (e.key === 'Enter') saveSalle(); if (e.key === 'Escape') setEditingTitle(false); }} />
              <select className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none"
                value={categorie} onChange={e => setCategorie(e.target.value)}>
                <option value="architecture">Architecture</option>
                <option value="scenographie">Scénographie</option>
                <option value="univers">Univers</option>
              </select>
              <button type="button" onClick={saveSalle} disabled={saving}
                className="text-xs bg-brown-deep text-ivory px-2 py-1 rounded hover:bg-sand hover:text-brown-deep transition-colors disabled:opacity-50">
                {saving ? '...' : '💾'}
              </button>
              <button type="button" onClick={() => { setTitre(salle.titre); setEditingTitle(false); }}
                className="text-xs text-gray-400 hover:text-gray-600 px-1">✕</button>
            </div>
          ) : (
            <div className="flex items-center gap-1 min-w-0">
              <p className="text-sm font-semibold text-brown-deep truncate">{titre}</p>
              <button type="button" onClick={() => setEditingTitle(true)}
                className="text-gray-400 hover:text-brown-deep flex-shrink-0 text-xs">✏️</button>
            </div>
          )}
          <p className="text-xs text-gray-400">{categorie} · {salle.galerie?.length || 0} photo(s)</p>
        </div>
        <button type="button"
          onClick={() => setExpandedSalle(isExpanded ? null : salle._id)}
          className="text-xs bg-sand text-brown-deep px-3 py-1.5 rounded font-semibold hover:bg-gold transition-colors flex-shrink-0">
          {isExpanded ? 'Fermer' : '📸 Galerie'}
        </button>
        <button type="button" onClick={deleteSalle}
          className="text-xs text-red-400 hover:text-red-600 flex-shrink-0">🗑️</button>
      </div>

      {isExpanded && (
        <div className="p-4 border-t border-gray-200">
          <GalleryManager
            galerie={salle.galerie || []}
            uploadUrl={`/content/espaces/${espaceId}/salles/${salle._id}/galerie`}
            baseUrl={`/content/espaces/${espaceId}/salles/${salle._id}/galerie`}
            onChange={() => onReload()}
            flash={flash}
            flashErr={flashErr}
          />
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   ŒUVRES TAB — collections + pièces + galerie
───────────────────────────────────────────── */
function OeuvresTab({ collections, onReload, flash, flashErr }) {
  const [creating, setCreating] = useState(false);
  const [newCollection, setNewCollection] = useState({ titre:'', description:'', imageUrl:'' });

  async function createCollection() {
    if (!newCollection.titre.trim()) { flashErr('Le titre est requis'); return; }
    try {
      await api.post('/content/collections', newCollection);
      setNewCollection({ titre:'', description:'', imageUrl:'' });
      setCreating(false);
      flash('✅ Collection créée');
      await onReload();
    } catch (e) { flashErr(errMsg(e)); }
  }

  const inputCls = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sand/40';

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <p className="text-gray-500 text-sm">Gérez les collections, leurs pièces et la galerie photo de chaque pièce.</p>
        <button type="button" onClick={() => setCreating(!creating)}
          className="bg-brown-deep text-ivory px-4 py-2 text-sm rounded font-semibold hover:bg-sand hover:text-brown-deep transition-colors flex-shrink-0">
          {creating ? '✕ Annuler' : '+ Nouvelle collection'}
        </button>
      </div>

      {creating && (
        <div className="bg-sand/10 border-2 border-dashed border-sand/40 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase font-semibold mb-3">Créer une nouvelle collection</p>
          <div className="space-y-3 mb-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Titre *</label>
              <input className={inputCls} value={newCollection.titre}
                onChange={e => setNewCollection(n => ({...n, titre:e.target.value}))}
                placeholder="ex: Costumes Traditionnels" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Description</label>
              <textarea rows={2} className={`${inputCls} resize-none`} value={newCollection.description}
                onChange={e => setNewCollection(n => ({...n, description:e.target.value}))} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Photo de couverture (optionnel)</label>
              <div className="flex gap-2 items-start">
                <input className={inputCls} placeholder="URL image" value={newCollection.imageUrl}
                  onChange={e => setNewCollection(n => ({...n, imageUrl:e.target.value}))} />
                <UploadButton onUploaded={url => setNewCollection(n => ({...n, imageUrl:url}))} />
              </div>
              {newCollection.imageUrl && (
                <img src={newCollection.imageUrl} alt="" className="mt-2 h-24 w-full object-cover rounded"/>
              )}
            </div>
          </div>
          <button type="button" onClick={createCollection}
            className="bg-sand text-brown-deep px-5 py-2 text-sm rounded font-semibold hover:bg-gold transition-colors">
            + Créer la collection
          </button>
        </div>
      )}

      {collections.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">Aucune collection pour le moment. Créez-en une avec le bouton ci-dessus.</p>
      ) : (
        collections.map(c => (
          <CollectionEditor key={c._id} collection={c} onReload={onReload} flash={flash} flashErr={flashErr} />
        ))
      )}
    </div>
  );
}

function CollectionEditor({ collection, onReload, flash, flashErr }) {
  const [open, setOpen]             = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titre, setTitre]           = useState(collection.titre || '');
  const [savingTitle, setSavingTitle] = useState(false);
  const [expandedPiece, setExpandedPiece] = useState(null);
  const [newPiece, setNewPiece]     = useState({ titre:'', periode:'', origine:'', materiaux:'', description:'' });
  const [newPiecePhotos, setNewPiecePhotos] = useState([]);
  const [uploadingPiece, setUploadingPiece] = useState(false);

  const inputCls = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sand/40';

  function addPhotosToNewPiece(fileList) {
    const files = Array.from(fileList || []).filter(f => f.type.startsWith('image/'));
    const withPreview = files.map(file => ({ file, previewUrl: URL.createObjectURL(file) }));
    setNewPiecePhotos(prev => [...prev, ...withPreview]);
  }

  function removeNewPiecePhoto(index) {
    setNewPiecePhotos(prev => prev.filter((_, i) => i !== index));
  }

  async function saveCollectionTitle() {
    if (!titre.trim()) { flashErr('Le titre est requis'); return; }
    setSavingTitle(true);
    try {
      await api.put(`/content/collections/${collection._id}`, { titre });
      flash('✅ Collection mise à jour');
      setEditingTitle(false);
      await onReload();
    } catch (e) { flashErr(errMsg(e)); }
    finally { setSavingTitle(false); }
  }

  async function deleteCollection() {
    if (!window.confirm(`Supprimer définitivement la collection "${titre}" et toutes ses pièces ?`)) return;
    try {
      await api.delete(`/content/collections/${collection._id}`);
      flash('✅ Collection supprimée');
      await onReload();
    } catch (e) { flashErr(errMsg(e)); }
  }

  async function addPiece() {
    if (!newPiece.titre) { flashErr('Titre requis'); return; }
    setUploadingPiece(true);
    try {
      const { data } = await api.post(`/content/collections/${collection._id}/pieces`, newPiece);

      if (newPiecePhotos.length > 0) {
        const pieceCree = data.collection.pieces[data.collection.pieces.length - 1];
        const fd = new FormData();
        newPiecePhotos.forEach(p => fd.append('images', p.file));
        const { data: uploadData } = await api.post('/media/upload', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const photos = uploadData.medias.map(m => ({ url: m.url, alt: '', legende: '' }));
        await api.post(`/content/collections/${collection._id}/pieces/${pieceCree._id}/galerie`, { photos });
      }

      newPiecePhotos.forEach(p => URL.revokeObjectURL(p.previewUrl));
      setNewPiece({ titre:'', periode:'', origine:'', materiaux:'', description:'' });
      setNewPiecePhotos([]);
      flash(`✅ Pièce ajoutée${newPiecePhotos.length ? ` avec ${newPiecePhotos.length} photo(s)` : ''}`);
      await onReload();
    } catch(e) { flashErr(errMsg(e)); }
    finally { setUploadingPiece(false); }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="w-full flex items-center justify-between px-5 py-4">
        <div className="flex-1 min-w-0 mr-2">
          {editingTitle ? (
            <div className="flex gap-2 items-center">
              <input
                className="border border-gray-300 rounded px-2 py-1 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-sand/40 font-heading font-semibold text-brown-deep"
                value={titre} onChange={e => setTitre(e.target.value)}
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter') saveCollectionTitle(); if (e.key === 'Escape') { setTitre(collection.titre); setEditingTitle(false); } }}
              />
              <button type="button" onClick={saveCollectionTitle} disabled={savingTitle}
                className="text-xs bg-brown-deep text-ivory px-2 py-1 rounded hover:bg-sand hover:text-brown-deep transition-colors disabled:opacity-50">
                {savingTitle ? '...' : '💾'}
              </button>
              <button type="button" onClick={() => { setTitre(collection.titre); setEditingTitle(false); }}
                className="text-xs text-gray-400 hover:text-gray-600 px-1">✕</button>
            </div>
          ) : (
            <button type="button" onClick={() => setOpen(!open)} className="text-left w-full">
              <div className="flex items-center gap-1">
                <h3 className="font-heading font-semibold text-brown-deep">{titre}</h3>
                <span
                  role="button" tabIndex={0}
                  onClick={e => { e.stopPropagation(); setEditingTitle(true); }}
                  onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); setEditingTitle(true); } }}
                  className="text-gray-400 hover:text-brown-deep text-xs cursor-pointer">✏️</span>
              </div>
              <p className="text-xs text-gray-400">{collection.pieces?.length || 0} pièce(s)</p>
            </button>
          )}
        </div>
        <button type="button" onClick={deleteCollection}
          className="text-xs text-red-400 hover:text-red-600 px-2 flex-shrink-0">🗑️ Supprimer</button>
        <button type="button" onClick={() => setOpen(!open)} className="text-gray-400 text-lg ml-2 flex-shrink-0">{open ? '▲' : '▼'}</button>
      </div>

      {open && (
        <div className="border-t border-gray-100 p-5 space-y-4">

          {(!collection.pieces || collection.pieces.length === 0)
            ? <p className="text-gray-400 text-sm">Aucune pièce dans cette collection</p>
            : (
              <div className="space-y-3">
                {collection.pieces.map(p => (
                  <PieceEditor
                    key={p._id}
                    piece={p}
                    collectionId={collection._id}
                    expandedPiece={expandedPiece}
                    setExpandedPiece={setExpandedPiece}
                    onReload={onReload}
                    flash={flash}
                    flashErr={flashErr}
                  />
                ))}
              </div>
            )
          }

          <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-4">
            <p className="text-xs text-gray-500 uppercase font-semibold mb-3">+ Ajouter une pièce</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="col-span-2">
                <label className="text-xs text-gray-400 mb-1 block">Titre *</label>
                <input className={inputCls} value={newPiece.titre}
                  onChange={e => setNewPiece(n=>({...n,titre:e.target.value}))} placeholder="ex: Collier en or" />
              </div>
              {[['periode','Période'],['origine','Origine'],['materiaux','Matériaux']].map(([k,l]) => (
                <input key={k} placeholder={l} className={inputCls}
                  value={newPiece[k]} onChange={e => setNewPiece(n=>({...n,[k]:e.target.value}))} />
              ))}
              <textarea placeholder="Description" rows={2} className={`${inputCls} resize-none col-span-2`}
                value={newPiece.description} onChange={e => setNewPiece(n=>({...n,description:e.target.value}))}/>
              <div className="col-span-2">
                <label className="text-xs text-gray-400 mb-1 block">Photos de la galerie (plusieurs à la fois)</label>
                <SalleDropZone onFiles={addPhotosToNewPiece} />
                {newPiecePhotos.length > 0 && (
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mt-3">
                    {newPiecePhotos.map((p, i) => (
                      <div key={i} className="relative group">
                        <img src={p.previewUrl} alt="" className="w-full h-16 object-cover rounded border border-gray-200"/>
                        <button type="button" onClick={() => removeNewPiecePhoto(i)}
                          className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <button type="button" onClick={addPiece} disabled={uploadingPiece}
              className="bg-sand text-brown-deep px-5 py-2 text-sm rounded font-semibold hover:bg-gold transition-colors disabled:opacity-50">
              {uploadingPiece ? '⏳ Envoi en cours...' : `+ Créer la pièce${newPiecePhotos.length ? ` (${newPiecePhotos.length} photo${newPiecePhotos.length > 1 ? 's' : ''})` : ''}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   PIECE EDITOR — titre inline + galerie
───────────────────────────────────────────── */
function PieceEditor({ piece, collectionId, expandedPiece, setExpandedPiece, onReload, flash, flashErr }) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titre, setTitre]               = useState(piece.titre || '');
  const [saving, setSaving]             = useState(false);
  const isExpanded = expandedPiece === piece._id;
  const couverture = piece.galerie?.find(g => g.isCouverture) || piece.galerie?.[0];

  async function savePiece() {
    if (!titre.trim()) { flashErr('Le titre est requis'); return; }
    setSaving(true);
    try {
      await api.put(`/content/collections/${collectionId}/pieces/${piece._id}`, { titre });
      flash('✅ Pièce mise à jour');
      setEditingTitle(false);
      await onReload();
    } catch (e) { flashErr(errMsg(e)); }
    finally { setSaving(false); }
  }

  async function deletePiece() {
    if (!window.confirm('Supprimer cette pièce et toute sa galerie ?')) return;
    try {
      await api.delete(`/content/collections/${collectionId}/pieces/${piece._id}`);
      flash('✅ Pièce supprimée');
      await onReload();
    } catch (e) { flashErr(errMsg(e)); }
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex items-center gap-3 p-3 bg-gray-50">
        {couverture
          ? <img src={couverture.url} alt="" className="w-14 h-14 rounded object-cover flex-shrink-0"/>
          : <div className="w-14 h-14 rounded bg-sand/20 flex items-center justify-center text-xl flex-shrink-0">🎨</div>
        }
        <div className="flex-1 min-w-0">
          {editingTitle ? (
            <div className="flex gap-2 items-center">
              <input
                className="border border-gray-300 rounded px-2 py-1 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-sand/40"
                value={titre} onChange={e => setTitre(e.target.value)}
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter') savePiece(); if (e.key === 'Escape') { setTitre(piece.titre); setEditingTitle(false); } }}
              />
              <button type="button" onClick={savePiece} disabled={saving}
                className="text-xs bg-brown-deep text-ivory px-2 py-1 rounded hover:bg-sand hover:text-brown-deep transition-colors disabled:opacity-50">
                {saving ? '...' : '💾'}
              </button>
              <button type="button" onClick={() => { setTitre(piece.titre); setEditingTitle(false); }}
                className="text-xs text-gray-400 hover:text-gray-600 px-1">✕</button>
            </div>
          ) : (
            <div className="flex items-center gap-1 min-w-0">
              <p className="text-sm font-semibold text-brown-deep truncate">{titre}</p>
              <button type="button" onClick={() => setEditingTitle(true)}
                className="text-gray-400 hover:text-brown-deep flex-shrink-0 text-xs">✏️</button>
            </div>
          )}
          <p className="text-xs text-gray-400">{piece.periode || '—'} · {piece.galerie?.length || 0} photo(s)</p>
        </div>
        <button type="button"
          onClick={() => setExpandedPiece(isExpanded ? null : piece._id)}
          className="text-xs bg-sand text-brown-deep px-3 py-1.5 rounded font-semibold hover:bg-gold transition-colors flex-shrink-0">
          {isExpanded ? 'Fermer' : '📸 Galerie'}
        </button>
        <button type="button" onClick={deletePiece}
          className="text-xs text-red-400 hover:text-red-600 flex-shrink-0">🗑️</button>
      </div>

      {isExpanded && (
        <div className="p-4 border-t border-gray-200">
          <GalleryManager
            galerie={piece.galerie || []}
            uploadUrl={`/content/collections/${collectionId}/pieces/${piece._id}/galerie`}
            baseUrl={`/content/collections/${collectionId}/pieces/${piece._id}/galerie`}
            onChange={() => onReload()}
            flash={flash}
            flashErr={flashErr}
          />
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   VISITE TAB
───────────────────────────────────────────── */
function VisiteTab({ visite, setVisite, flash, flashErr, settings, setSettings, onSaveSettings }) {
  const inputCls = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sand/40';

  async function save() {
    try {
      await api.put('/content/visite', {
        introduction: visite.introduction,
        horairesDepart: visite.horairesDepart,
        languesDisponibles: visite.languesDisponibles,
        etapes: visite.etapes || [],
      });
      flash('✅ Visite guidée mise à jour');
    } catch (e) { flashErr(errMsg(e)); }
  }

  function addEtape() {
    const etapes = [...(visite.etapes || [])];
    etapes.push({ ordre: etapes.length + 1, titre: '', description: '', dureeMinutes: 30, imageUrl: '' });
    setVisite(v => ({ ...v, etapes }));
  }

  function updateEtape(index, patch) {
    const etapes = [...(visite.etapes || [])];
    etapes[index] = { ...etapes[index], ...patch };
    setVisite(v => ({ ...v, etapes }));
  }

  function removeEtape(index) {
    const etapes = (visite.etapes || []).filter((_, i) => i !== index)
      .map((e, i) => ({ ...e, ordre: i + 1 }));
    setVisite(v => ({ ...v, etapes }));
  }

  function moveEtape(index, dir) {
    const etapes = [...(visite.etapes || [])];
    const target = index + dir;
    if (target < 0 || target >= etapes.length) return;
    [etapes[index], etapes[target]] = [etapes[target], etapes[index]];
    setVisite(v => ({ ...v, etapes: etapes.map((e, i) => ({ ...e, ordre: i + 1 })) }));
  }

  return (
    <div className="max-w-3xl space-y-10">

      {/* ── Introduction / horaires / langues ── */}
      <section className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-brown-deep mb-1">Introduction</label>
          <textarea rows={4} className={`${inputCls} resize-none`}
            value={visite.introduction || ''}
            onChange={e => setVisite(v=>({...v,introduction:e.target.value}))} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-brown-deep mb-1">Horaires de départ</label>
          <input className={inputCls} placeholder="09:00, 10:30, 14:00, 15:30"
            value={(visite.horairesDepart || []).join(', ')}
            onChange={e => setVisite(v=>({...v,horairesDepart:e.target.value.split(',').map(s=>s.trim()).filter(Boolean)}))} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-brown-deep mb-1">Langues disponibles</label>
          <input className={inputCls} placeholder="Français, Arabe, Anglais"
            value={(visite.languesDisponibles || []).join(', ')}
            onChange={e => setVisite(v=>({...v,languesDisponibles:e.target.value.split(',').map(s=>s.trim()).filter(Boolean)}))} />
        </div>
      </section>

      {/* ── Circuit de visite (étapes) ── */}
      <section>
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-heading text-lg font-semibold text-brown-deep">🚶 Circuit de visite (étapes)</h2>
          <button type="button" onClick={addEtape}
            className="bg-sand text-brown-deep px-4 py-1.5 text-xs rounded font-semibold hover:bg-gold transition-colors">
            + Ajouter une étape
          </button>
        </div>
        <p className="text-gray-400 text-xs mb-4">
          Chaque étape peut avoir une photo. L'ordre définit la position dans la timeline publique.
        </p>

        {(!visite.etapes || visite.etapes.length === 0) ? (
          <p className="text-gray-400 text-sm text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            Aucune étape pour le moment.
          </p>
        ) : (
          <div className="space-y-3">
            {visite.etapes.map((e, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 flex flex-col items-center gap-1">
                    <span className="w-8 h-8 rounded-full bg-sand text-brown-deep font-bold text-sm flex items-center justify-center">
                      {e.ordre}
                    </span>
                    <button type="button" onClick={() => moveEtape(i, -1)} disabled={i === 0}
                      className="text-xs text-gray-400 hover:text-brown-deep disabled:opacity-20">▲</button>
                    <button type="button" onClick={() => moveEtape(i, 1)} disabled={i === visite.etapes.length - 1}
                      className="text-xs text-gray-400 hover:text-brown-deep disabled:opacity-20">▼</button>
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <input className={inputCls} placeholder="Titre de l'étape" value={e.titre}
                        onChange={ev => updateEtape(i, { titre: ev.target.value })} />
                      <input type="number" min="1" className={inputCls} placeholder="Durée (minutes)"
                        value={e.dureeMinutes}
                        onChange={ev => updateEtape(i, { dureeMinutes: parseInt(ev.target.value) || 0 })} />
                    </div>
                    <textarea rows={2} className={`${inputCls} resize-none`} placeholder="Description"
                      value={e.description} onChange={ev => updateEtape(i, { description: ev.target.value })} />
                    <div className="flex gap-2 items-start">
                      <input className={inputCls} placeholder="URL image (optionnel)" value={e.imageUrl}
                        onChange={ev => updateEtape(i, { imageUrl: ev.target.value })} />
                      <UploadButton onUploaded={url => updateEtape(i, { imageUrl: url })} />
                    </div>
                    {e.imageUrl && (
                      <img src={e.imageUrl} alt="" className="h-20 w-full object-cover rounded" />
                    )}
                  </div>

                  <button type="button" onClick={() => removeEtape(i)}
                    className="flex-shrink-0 text-red-400 hover:text-red-600 text-sm">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <button type="button" onClick={save}
        className="bg-brown-deep text-ivory px-6 py-2 text-sm rounded hover:bg-sand hover:text-brown-deep transition-colors">
        💾 Enregistrer la visite guidée
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   INFORMATIONS TAB — contact, carte, réseaux sociaux
───────────────────────────────────────────── */
const PLATEFORMES_SUGGEREES = [
  { plateforme: 'facebook',  label: 'Facebook',  icone: '📘' },
  { plateforme: 'instagram', label: 'Instagram', icone: '📸' },
  { plateforme: 'twitter',   label: 'Twitter / X', icone: '✕' },
  { plateforme: 'tiktok',    label: 'TikTok',    icone: '🎵' },
  { plateforme: 'youtube',   label: 'YouTube',   icone: '▶️' },
  { plateforme: 'whatsapp',  label: 'WhatsApp',  icone: '💬' },
  { plateforme: 'autre',     label: 'Autre',     icone: '🔗' },
];

function InfoTab({ settings, setSettings, onSave, flash, flashErr, onReloadSettings }) {
  const inputCls = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sand/40';

  return (
    <div className="max-w-2xl space-y-10">

      {/* ── Image de la page Contact ── */}
      <section>
        <h2 className="font-heading text-lg font-semibold text-brown-deep mb-1">🖼️ Images de la page Contact</h2>
        <p className="text-gray-400 text-xs mb-4">
          Bannière du haut et fond de contenu de la page publique "Contact" (menu du site).
          Si les deux sont vides, aucune image ne s'affiche. Si seul le fond est renseigné, il devient l'unique photo de haut en bas.
        </p>
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-3">
          <label className="block text-sm font-semibold text-brown-deep mb-2">Bannière (haut de page)</label>
          <div className="flex gap-2 items-start">
            <input className={inputCls} placeholder="URL de l'image (https://...)"
              value={settings.heroImages?.informations || ''}
              onChange={e => setSettings(s => ({...s, heroImages:{...s.heroImages, informations:e.target.value}}))} />
            <UploadButton onUploaded={url => setSettings(s => ({...s, heroImages:{...s.heroImages, informations:url}}))} />
          </div>
          {settings.heroImages?.informations && (
            <div className="mt-2 relative group">
              <img src={settings.heroImages.informations} alt="" className="h-24 w-full object-cover rounded opacity-80 group-hover:opacity-100 transition-opacity"/>
              <button type="button" onClick={() => setSettings(s => ({...s, heroImages:{...s.heroImages, informations:''} }))}
                className="absolute top-1 right-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                Retirer
              </button>
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <label className="block text-sm font-semibold text-brown-deep mb-2">Fond de contenu (corps de page)</label>
          <div className="flex gap-2 items-start">
            <input className={inputCls} placeholder="URL de l'image (https://...)"
              value={settings.fondsContenu?.informations || ''}
              onChange={e => setSettings(s => ({...s, fondsContenu:{...s.fondsContenu, informations:e.target.value}}))} />
            <UploadButton onUploaded={url => setSettings(s => ({...s, fondsContenu:{...s.fondsContenu, informations:url}}))} />
          </div>
          {settings.fondsContenu?.informations && (
            <div className="mt-2 relative group">
              <img src={settings.fondsContenu.informations} alt="" className="h-24 w-full object-cover rounded opacity-80 group-hover:opacity-100 transition-opacity"/>
              <button type="button" onClick={() => setSettings(s => ({...s, fondsContenu:{...s.fondsContenu, informations:''} }))}
                className="absolute top-1 right-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                Retirer
              </button>
            </div>
          )}
        </div>
        <button type="button"
          onClick={() => onSave({ heroImages: settings.heroImages, fondsContenu: settings.fondsContenu })}
          className="mt-4 bg-brown-deep text-ivory px-6 py-2 text-sm rounded hover:bg-sand hover:text-brown-deep transition-colors">
          💾 Sauvegarder les images
        </button>
      </section>

      {/* ── Coordonnées ── */}
      <section>
        <h2 className="font-heading text-lg font-semibold text-brown-deep mb-4">Coordonnées</h2>
        <div className="space-y-4">
          {[['Adresse','adresse','text'],['Téléphone (fixe)','telephone','tel'],
            ['Téléphone mobile / WhatsApp','telephoneMobile','tel'],['Email','email','email']].map(([label,key,type]) => (
            <div key={key}>
              <label className="block text-sm font-semibold text-brown-deep mb-1">{label}</label>
              <input type={type} className={inputCls}
                value={settings.contact?.[key] || ''}
                onChange={e => setSettings(s=>({...s,contact:{...s.contact,[key]:e.target.value}}))} />
            </div>
          ))}
        </div>
        <button type="button"
          onClick={() => onSave({ contact:settings.contact })}
          className="mt-4 bg-brown-deep text-ivory px-6 py-2 text-sm rounded hover:bg-sand hover:text-brown-deep transition-colors">
          💾 Sauvegarder les coordonnées
        </button>
      </section>

      {/* ── Carte Google Maps ── */}
      <section>
        <h2 className="font-heading text-lg font-semibold text-brown-deep mb-1">Localisation (Google Maps)</h2>
        <p className="text-gray-400 text-xs mb-4">
          Renseignez les coordonnées GPS pour afficher la carte sur la page Contact.
          Pour les trouver : ouvrez Google Maps, clic droit sur l'emplacement → cliquez sur les coordonnées affichées.
        </p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          {[['Latitude','latitude'],['Longitude','longitude']].map(([label,key]) => (
            <div key={key}>
              <label className="block text-sm font-semibold text-brown-deep mb-1">{label}</label>
              <input type="number" step="any" className={inputCls}
                value={settings.contact?.[key] ?? ''}
                onChange={e => setSettings(s=>({...s,contact:{...s.contact,[key]:e.target.value === '' ? '' : parseFloat(e.target.value)}}))} />
            </div>
          ))}
        </div>
        <div>
          <label className="block text-sm font-semibold text-brown-deep mb-1">
            Lien Google Maps personnalisé (optionnel)
          </label>
          <input className={inputCls} placeholder="https://maps.google.com/?q=..."
            value={settings.contact?.googleMapsUrl || ''}
            onChange={e => setSettings(s=>({...s,contact:{...s.contact,googleMapsUrl:e.target.value}}))} />
          <p className="text-xs text-gray-400 mt-1">Si vide, un lien sera généré automatiquement à partir des coordonnées GPS.</p>
        </div>
        <button type="button"
          onClick={() => onSave({ contact:settings.contact })}
          className="mt-4 bg-brown-deep text-ivory px-6 py-2 text-sm rounded hover:bg-sand hover:text-brown-deep transition-colors">
          💾 Sauvegarder la localisation
        </button>
      </section>

      {/* ── Réseaux sociaux ── */}
      <ReseauxSociauxSection
        reseaux={settings.reseauxSociaux}
        flash={flash}
        flashErr={flashErr}
        onReloadSettings={onReloadSettings}
      />

      {/* ── Identité du site ── */}
      <section>
        <h2 className="font-heading text-lg font-semibold text-brown-deep mb-4">Identité du site</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-brown-deep mb-1">Nom du site</label>
            <input className={inputCls} value={settings.nomSite || ''}
              onChange={e => setSettings(s=>({...s,nomSite:e.target.value}))} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-brown-deep mb-1">Slogan</label>
            <input className={inputCls} value={settings.slogan || ''}
              onChange={e => setSettings(s=>({...s,slogan:e.target.value}))} />
          </div>
        </div>
        <button type="button"
          onClick={() => onSave({ nomSite:settings.nomSite, slogan:settings.slogan })}
          className="mt-4 bg-brown-deep text-ivory px-6 py-2 text-sm rounded hover:bg-sand hover:text-brown-deep transition-colors">
          💾 Sauvegarder l'identité
        </button>
      </section>
    </div>
  );
}

/* Gestion de la liste libre des réseaux sociaux */
/* ─────────────────────────────────────────────
   RESERVATION TAB — images dédiées de la page Réservation (clé "contact")
───────────────────────────────────────────── */
function ReservationTab({ settings, setSettings, onSave }) {
  const inputCls = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sand/40';

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="font-heading text-lg font-semibold text-brown-deep mb-1">📅 Page Réservation</h2>
        <p className="text-gray-400 text-xs mb-4">
          Bannière et fond de contenu de la page publique "Réserver" (bouton du menu du site).
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <label className="block text-sm font-semibold text-brown-deep mb-2">Bannière (haut de page)</label>
        <div className="flex gap-2 items-start">
          <input className={inputCls} placeholder="URL de l'image (https://...)"
            value={settings.heroImages?.contact || ''}
            onChange={e => setSettings(s => ({...s, heroImages:{...s.heroImages, contact:e.target.value}}))} />
          <UploadButton onUploaded={url => setSettings(s => ({...s, heroImages:{...s.heroImages, contact:url}}))} />
        </div>
        {settings.heroImages?.contact && (
          <div className="mt-2 relative group">
            <img src={settings.heroImages.contact} alt="" className="h-24 w-full object-cover rounded opacity-80 group-hover:opacity-100 transition-opacity"/>
            <button type="button" onClick={() => setSettings(s => ({...s, heroImages:{...s.heroImages, contact:''} }))}
              className="absolute top-1 right-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
              Retirer
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <label className="block text-sm font-semibold text-brown-deep mb-2">Fond de contenu (corps de page)</label>
        <div className="flex gap-2 items-start">
          <input className={inputCls} placeholder="URL de l'image (https://...)"
            value={settings.fondsContenu?.contact || ''}
            onChange={e => setSettings(s => ({...s, fondsContenu:{...s.fondsContenu, contact:e.target.value}}))} />
          <UploadButton onUploaded={url => setSettings(s => ({...s, fondsContenu:{...s.fondsContenu, contact:url}}))} />
        </div>
        {settings.fondsContenu?.contact && (
          <div className="mt-2 relative group">
            <img src={settings.fondsContenu.contact} alt="" className="h-24 w-full object-cover rounded opacity-80 group-hover:opacity-100 transition-opacity"/>
            <button type="button" onClick={() => setSettings(s => ({...s, fondsContenu:{...s.fondsContenu, contact:''} }))}
              className="absolute top-1 right-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
              Retirer
            </button>
          </div>
        )}
      </div>

      <button type="button"
        onClick={() => onSave({ heroImages: settings.heroImages, fondsContenu: settings.fondsContenu })}
        className="bg-brown-deep text-ivory px-6 py-2 text-sm rounded hover:bg-sand hover:text-brown-deep transition-colors">
        💾 Sauvegarder les images
      </button>
    </div>
  );
}

function ReseauxSociauxSection({ reseaux, flash, flashErr, onReloadSettings }) {
  const [adding, setAdding] = useState(false);
  const [newReseau, setNewReseau] = useState({ plateforme: 'facebook', label: '', url: '', icone: '' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const inputCls = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sand/40';

  function applySuggestion(plateforme) {
    const sugg = PLATEFORMES_SUGGEREES.find(p => p.plateforme === plateforme);
    setNewReseau(n => ({
      ...n,
      plateforme,
      label: sugg?.label || '',
      icone: sugg?.icone || '',
    }));
  }

  async function addReseau() {
    if (!newReseau.url.trim()) { flashErr('L\'URL est requise'); return; }
    try {
      await api.post('/content/settings/reseaux-sociaux', newReseau);
      setNewReseau({ plateforme: 'facebook', label: '', url: '', icone: '' });
      setAdding(false);
      flash('✅ Réseau social ajouté');
      await onReloadSettings();
    } catch (e) { flashErr(errMsg(e)); }
  }

  function startEdit(r) {
    setEditingId(r._id);
    setEditForm({ plateforme: r.plateforme, label: r.label, url: r.url, icone: r.icone });
  }

  async function saveEdit() {
    try {
      await api.put(`/content/settings/reseaux-sociaux/${editingId}`, editForm);
      setEditingId(null);
      flash('✅ Réseau social modifié');
      await onReloadSettings();
    } catch (e) { flashErr(errMsg(e)); }
  }

  async function deleteReseau(id) {
    if (!window.confirm('Supprimer ce réseau social ?')) return;
    try {
      await api.delete(`/content/settings/reseaux-sociaux/${id}`);
      flash('✅ Réseau social supprimé');
      await onReloadSettings();
    } catch (e) { flashErr(errMsg(e)); }
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-lg font-semibold text-brown-deep">Réseaux sociaux</h2>
        <button type="button" onClick={() => setAdding(!adding)}
          className="bg-brown-deep text-ivory px-4 py-1.5 text-xs rounded font-semibold hover:bg-sand hover:text-brown-deep transition-colors">
          {adding ? '✕ Annuler' : '+ Ajouter'}
        </button>
      </div>

      {(!reseaux || reseaux.length === 0) ? (
        <p className="text-gray-400 text-sm mb-4">Aucun réseau social ajouté pour le moment.</p>
      ) : (
        <div className="space-y-2 mb-4">
          {reseaux.map(r => (
            <div key={r._id} className="bg-white border border-gray-200 rounded-lg p-3">
              {editingId === r._id ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <input className={inputCls} placeholder="Icône (emoji)" value={editForm.icone}
                      onChange={e => setEditForm(f => ({...f, icone:e.target.value}))} />
                    <input className={`${inputCls} col-span-2`} placeholder="Libellé" value={editForm.label}
                      onChange={e => setEditForm(f => ({...f, label:e.target.value}))} />
                  </div>
                  <input className={inputCls} placeholder="URL" value={editForm.url}
                    onChange={e => setEditForm(f => ({...f, url:e.target.value}))} />
                  <div className="flex gap-2">
                    <button type="button" onClick={saveEdit}
                      className="flex-1 bg-brown-deep text-ivory py-1.5 text-xs rounded hover:bg-sand hover:text-brown-deep transition-colors">
                      💾 Enregistrer
                    </button>
                    <button type="button" onClick={() => setEditingId(null)}
                      className="px-3 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50">
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-xl flex-shrink-0">{r.icone || '🔗'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-brown-deep">{r.label || r.plateforme}</p>
                    <p className="text-xs text-gray-400 truncate">{r.url}</p>
                  </div>
                  <button type="button" onClick={() => startEdit(r)}
                    className="text-xs text-gray-500 hover:text-brown-deep px-2 flex-shrink-0">✏️</button>
                  <button type="button" onClick={() => deleteReseau(r._id)}
                    className="text-xs text-red-400 hover:text-red-600 px-2 flex-shrink-0">🗑️</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {adding && (
        <div className="bg-sand/10 border-2 border-dashed border-sand/40 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase font-semibold mb-3">Nouveau réseau social</p>
          <div className="space-y-3 mb-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Plateforme</label>
              <select className={inputCls} value={newReseau.plateforme}
                onChange={e => applySuggestion(e.target.value)}>
                {PLATEFORMES_SUGGEREES.map(p => (
                  <option key={p.plateforme} value={p.plateforme}>{p.label}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Icône</label>
                <input className={inputCls} value={newReseau.icone}
                  onChange={e => setNewReseau(n => ({...n, icone:e.target.value}))} placeholder="📘" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-400 mb-1 block">Libellé affiché</label>
                <input className={inputCls} value={newReseau.label}
                  onChange={e => setNewReseau(n => ({...n, label:e.target.value}))} placeholder="Facebook" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">URL *</label>
              <input className={inputCls} value={newReseau.url}
                onChange={e => setNewReseau(n => ({...n, url:e.target.value}))}
                placeholder="https://facebook.com/darcherait" />
            </div>
          </div>
          <button type="button" onClick={addReseau}
            className="bg-sand text-brown-deep px-5 py-2 text-sm rounded font-semibold hover:bg-gold transition-colors">
            + Ajouter ce réseau
          </button>
        </div>
      )}
    </section>
  );
}