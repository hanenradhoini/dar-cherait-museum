// backend/setup.js
// Script à lancer UNE SEULE FOIS pour créer la base de données
// Usage : node setup.js

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setup() {
  console.log('🔧 Configuration de la base de données Dar Cheraït...\n');

  // 1. Créer la base de données si elle n'existe pas
  const adminClient = new Client({
    host:     process.env.PG_HOST || 'localhost',
    port:     parseInt(process.env.PG_PORT) || 5432,
    user:     process.env.PG_USER || 'postgres',
    password: process.env.PG_PASSWORD || 'postgres',
    database: 'postgres', // connexion à la DB par défaut
  });

  try {
    await adminClient.connect();
    const dbName = process.env.PG_DATABASE || 'dar_cherait_reservations';

    const exists = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]
    );

    if (exists.rows.length === 0) {
      await adminClient.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Base de données "${dbName}" créée`);
    } else {
      console.log(`ℹ️  Base de données "${dbName}" existe déjà`);
    }
    await adminClient.end();
  } catch (err) {
    console.error('❌ Erreur création DB :', err.message);
    console.log('\n💡 Vérifiez que PostgreSQL est démarré et que le mot de passe dans .env est correct');
    await adminClient.end().catch(() => {});
    process.exit(1);
  }

  // 2. Appliquer le schema.sql
  const schemaClient = new Client({
    host:     process.env.PG_HOST || 'localhost',
    port:     parseInt(process.env.PG_PORT) || 5432,
    user:     process.env.PG_USER || 'postgres',
    password: process.env.PG_PASSWORD || 'postgres',
    database: process.env.PG_DATABASE || 'dar_cherait_reservations',
  });

  try {
    await schemaClient.connect();
    const schema = fs.readFileSync(path.join(__dirname, 'config', 'schema.sql'), 'utf8');
    await schemaClient.query(schema);
    console.log('✅ Schéma SQL appliqué (tables créées)');
    await schemaClient.end();
  } catch (err) {
    console.error('❌ Erreur schema :', err.message);
    await schemaClient.end().catch(() => {});
    process.exit(1);
  }

  console.log('\n🎉 Setup terminé ! Lancez maintenant : npm run dev');
}

setup();
