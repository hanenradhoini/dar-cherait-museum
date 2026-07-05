/**
 * Script de création d'un compte admin PostgreSQL
 * Usage : node config/createAdmin.js
 *
 * Ce script crée un admin dans la table 'admins' (PAS dans 'users')
 * Les admins se connectent via /admin/login (pas via /connexion du site public)
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool   = require('./postgres');

const ADMIN_EMAIL    = process.env.DEFAULT_ADMIN_EMAIL    || 'admin@darcherait.tn';
const ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@2024!';
const ADMIN_NOM      = 'Administrateur Principal';
const ADMIN_ROLE     = 'super_admin';

async function createAdmin() {
  console.log('\n══════════════════════════════════════════');
  console.log('   Création du compte Administrateur');
  console.log('══════════════════════════════════════════\n');

  try {
    // Vérifier si la table admins existe
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'admins'
      ) AS exists
    `);

    if (!tableCheck.rows[0].exists) {
      console.error('❌ La table "admins" n\'existe pas.');
      console.error('   Exécutez d\'abord : psql -U postgres -d dar_cherait_reservations -f config/schema.sql');
      process.exit(1);
    }

    // Vérifier si cet email existe déjà
    const existing = await pool.query(
      'SELECT id, email, role FROM admins WHERE email = $1',
      [ADMIN_EMAIL]
    );

    if (existing.rows.length > 0) {
      console.log(`⚠️  Un admin existe déjà avec l'email : ${ADMIN_EMAIL}`);
      console.log(`   Rôle actuel : ${existing.rows[0].role}`);
      console.log('\n   Voulez-vous réinitialiser son mot de passe ? (modification directe en base)');

      // Réinitialiser le mot de passe quand même
      const newHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
      await pool.query(
        'UPDATE admins SET password_hash = $1, actif = true WHERE email = $2',
        [newHash, ADMIN_EMAIL]
      );
      console.log('✅ Mot de passe réinitialisé avec succès !');
    } else {
      // Créer le nouvel admin
      const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
      const result = await pool.query(
        `INSERT INTO admins (email, password_hash, nom, role, actif)
         VALUES ($1, $2, $3, $4, true)
         RETURNING id, email, nom, role`,
        [ADMIN_EMAIL, passwordHash, ADMIN_NOM, ADMIN_ROLE]
      );
      console.log('✅ Compte admin créé avec succès !');
      console.log(`   ID   : ${result.rows[0].id}`);
      console.log(`   Role : ${result.rows[0].role}`);
    }

    console.log('\n══════════════════════════════════════════');
    console.log('   IDENTIFIANTS DE CONNEXION ADMIN');
    console.log('══════════════════════════════════════════');
    console.log(`   URL    : http://localhost:3000/admin/login`);
    console.log(`   Email  : ${ADMIN_EMAIL}`);
    console.log(`   Mot de passe : ${ADMIN_PASSWORD}`);
    console.log('══════════════════════════════════════════');
    console.log('\n⚠️  IMPORTANT :');
    console.log('   • Ne jamais utiliser ces identifiants sur le site public (/connexion)');
    console.log('   • La page admin est : /admin/login (pas /connexion)');
    console.log('   • Changez le mot de passe après la première connexion\n');

  } catch (err) {
    console.error('❌ Erreur :', err.message);
    if (err.code === 'ECONNREFUSED') {
      console.error('   PostgreSQL n\'est pas démarré ou les paramètres .env sont incorrects.');
    }
  } finally {
    await pool.end();
  }
}

createAdmin();