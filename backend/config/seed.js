// backend/config/seed.js
const bcrypt = require('bcryptjs');
const pool = require('./postgres');
const Settings = require('../models/Settings');
const Espace = require('../models/Espace');
const Collection = require('../models/Collection');
const VisiteGuidee = require('../models/VisiteGuidee');

async function seedAdmin() {
  try {
    // ─── Admin par défaut ───────────────────────────────────────
    const existing = await pool.query('SELECT COUNT(*) FROM admins');
    if (parseInt(existing.rows[0].count) === 0) {
      const hash = await bcrypt.hash(process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123', 10);
      await pool.query(
        'INSERT INTO admins (email, password_hash, nom, role) VALUES ($1, $2, $3, $4)',
        [
          process.env.DEFAULT_ADMIN_EMAIL || 'admin@darcherait.tn',
          hash,
          'Administrateur',
          'super_admin',
        ]
      );
      console.log('✅ Admin par défaut créé :', process.env.DEFAULT_ADMIN_EMAIL);
    }

    // ─── Settings (site) ────────────────────────────────────────
    const settingsCount = await Settings.countDocuments();
    if (settingsCount === 0) {
      await Settings.create({
        nomSite: 'Musée Dar Cheraït',
        slogan: 'Un voyage à travers la civilisation tunisienne',
        logoUrl: '',
        heroImages: {
          accueil:      '',
          expositions:  '',
          oeuvres:      '',
          visite:       '',
          contact:      '',
        },
        horaires: [
          { jour: 'lundi',    ouvertureJournee: '08:00', fermetureJournee: '18:30', ouvertureSoiree: '20:00', fermetureSoiree: '00:00', ferme: false },
          { jour: 'mardi',    ouvertureJournee: '08:00', fermetureJournee: '18:30', ouvertureSoiree: '20:00', fermetureSoiree: '00:00', ferme: false },
          { jour: 'mercredi', ouvertureJournee: '08:00', fermetureJournee: '18:30', ouvertureSoiree: '20:00', fermetureSoiree: '00:00', ferme: false },
          { jour: 'jeudi',    ouvertureJournee: '08:00', fermetureJournee: '18:30', ouvertureSoiree: '20:00', fermetureSoiree: '00:00', ferme: false },
          { jour: 'vendredi', ouvertureJournee: '08:00', fermetureJournee: '18:30', ouvertureSoiree: '20:00', fermetureSoiree: '00:00', ferme: false },
          { jour: 'samedi',   ouvertureJournee: '08:00', fermetureJournee: '18:30', ouvertureSoiree: '20:00', fermetureSoiree: '00:00', ferme: false },
          { jour: 'dimanche', ouvertureJournee: '08:00', fermetureJournee: '18:30', ouvertureSoiree: '20:00', fermetureSoiree: '00:00', ferme: false },
        ],
        tarifs: [
          { espace: 'arts_traditions',   label: 'Arts & Traditions',   prix: 5.5, ordre: 1 },
          { espace: 'medina_1001_nuits', label: 'Médina 1001 Nuits',   prix: 6,   ordre: 2 },
          { espace: 'dar_zamen',         label: 'Dar Zamen',           prix: 6,   ordre: 3 },
          { espace: 'forfait_complet',   label: 'Forfait Tout Inclus', prix: 15,  ordre: 4 },
        ],
        contact: {
          adresse:    'Avenue Abou El Kacem Chebbi, Tozeur, Tunisie',
          telephone:  '+216 76 452 636',
          email:      'contact@darcherait.tn',
          latitude:   33.9195,
          longitude:  8.1335,
        },
        reseauxSociaux: {
          facebook:  '',
          instagram: '',
          youtube:   '',
        },
      });
      console.log('✅ Settings initiaux créés');
    }

    // ─── Espaces ────────────────────────────────────────────────
    const espacesCount = await Espace.countDocuments();
    if (espacesCount === 0) {
      await Espace.insertMany([
        {
          slug: 'arts-traditions',
          titre: 'Arts & Traditions',
          description: 'Un voyage à travers les arts traditionnels tunisiens.',
          imageUrl: '',
          ordre: 1,
          salles: [],
        },
        {
          slug: 'medina-1001-nuits',
          titre: 'Médina 1001 Nuits',
          description: 'Découvrez la magie des contes des Mille et Une Nuits.',
          imageUrl: '',
          ordre: 2,
          salles: [],
        },
        {
          slug: 'dar-zamen',
          titre: 'Dar Zamen',
          description: 'La maison du temps passé, témoin de la vie tunisienne.',
          imageUrl: '',
          ordre: 3,
          salles: [],
        },
      ]);
      console.log('✅ Espaces initiaux créés');
    }

    // ─── Collections ────────────────────────────────────────────
    const collectionsCount = await Collection.countDocuments();
    if (collectionsCount === 0) {
      const collectionsData = [
        { slug: 'bijoux-parures',       titre: 'Bijoux & Parures',        description: 'Parures traditionnelles en or et argent.', ordre: 1 },
        { slug: 'costumes-traditionnels', titre: 'Costumes Traditionnels', description: 'Tenues régionales des différentes villes.', ordre: 2 },
        { slug: 'poterie-ceramique',    titre: 'Poterie & Céramique',      description: 'L\'art de la terre cuite tunisienne.',     ordre: 3 },
        { slug: 'tapis-tissages',       titre: 'Tapis & Tissages',         description: 'Tapis berbères et mergoums.',              ordre: 4 },
        { slug: 'calligraphie-arts',    titre: 'Calligraphie & Arts',      description: 'L\'art de l\'écriture arabe.',             ordre: 5 },
        { slug: 'musique-instruments',  titre: 'Musique & Instruments',    description: 'Instruments de musique traditionnels.',    ordre: 6 },
      ];
      await Collection.insertMany(collectionsData.map(c => ({ ...c, imageUrl: '', pieces: [] })));
      console.log('✅ Collections initiales créées');
    }

    // ─── Visite Guidée ──────────────────────────────────────────
    const visiteCount = await VisiteGuidee.countDocuments();
    if (visiteCount === 0) {
      await VisiteGuidee.create({
        introduction: 'Nos guides passionnés vous accompagnent dans un voyage inoubliable.',
        etapes: [
          { ordre: 1, titre: 'Accueil',         description: 'Présentation du musée et remise du plan.',    dureeMinutes: 10 },
          { ordre: 2, titre: 'Arts & Traditions', description: 'Visite du premier espace.',                 dureeMinutes: 45 },
          { ordre: 3, titre: '1001 Nuits',       description: 'Plongée dans l\'univers des contes.',        dureeMinutes: 40 },
          { ordre: 4, titre: 'Dar Zamen',        description: 'La maison du temps.',                        dureeMinutes: 35 },
          { ordre: 5, titre: 'Clôture',          description: 'Questions / réponses et boutique souvenirs.', dureeMinutes: 15 },
        ],
        formules: [
          { slug: 'decouverte', titre: 'Découverte',  description: '1 espace au choix.',      prix: 8,  dureeMinutes: 60,  inclus: ['Guide bilingue', 'Plan du musée'] },
          { slug: 'classique',  titre: 'Classique',   description: '2 espaces au choix.',     prix: 12, dureeMinutes: 100, inclus: ['Guide bilingue', 'Plan', 'Livret'] },
          { slug: 'complete',   titre: 'Complète',    description: 'Les 3 espaces.',          prix: 18, dureeMinutes: 150, inclus: ['Guide bilingue', 'Plan', 'Livret', 'Thé offert'] },
          { slug: 'prestige',   titre: 'Prestige',    description: 'Visite privée VIP.',      prix: 50, dureeMinutes: 180, inclus: ['Guide privé', 'Plan', 'Livret', 'Thé & pâtisseries'] },
        ],
        guides: [],
        horairesDepart: ['09:00', '10:30', '14:00', '15:30'],
        languesDisponibles: ['Français', 'Arabe', 'Anglais'],
      });
      console.log('✅ VisiteGuidee initiale créée');
    }
  } catch (err) {
    console.error('❌ Erreur seed :', err.message);
  }
}

module.exports = { seedAdmin };