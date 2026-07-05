// backend/utils/mailer.js
const nodemailer = require('nodemailer');

let transporter;
function getT() {
  if (!transporter) transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST || 'smtp.gmail.com',
    port:   parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth:   { user:process.env.SMTP_USER, pass:process.env.SMTP_PASS },
  });
  return transporter;
}

async function sendConfirmationEmail({ to, prenom, reference, espace, dateVisite, heureVisite }) {
  await getT().sendMail({
    from:    process.env.SMTP_FROM || '"Musée Dar Cheraït" <no-reply@darcherait.tn>',
    to, subject: `Confirmation réservation — ${reference}`,
    html: `<div style="font-family:Georgia,serif;max-width:600px;margin:auto;padding:20px;border:1px solid #C4A265">
      <h2 style="color:#3A2210">Musée Dar Cheraït</h2>
      <p>Bonjour <strong>${prenom}</strong>, votre demande a bien été reçue.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Référence</td><td style="padding:8px;border:1px solid #ddd">${reference}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Espace</td><td style="padding:8px;border:1px solid #ddd">${espace}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Date</td><td style="padding:8px;border:1px solid #ddd">${dateVisite}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Heure</td><td style="padding:8px;border:1px solid #ddd">${heureVisite}</td></tr>
      </table>
      <p>Vous recevrez un email dès validation.</p>
      <p style="color:#8B6914;font-size:12px">Musée Dar Cheraït — Tozeur, Tunisie</p>
    </div>`,
  });
}

async function sendAdminResponseEmail({ to, prenom, reference, statut, reponse }) {
  const label = { confirmee:'✅ Confirmée', annulee:'❌ Annulée', terminee:'🏁 Terminée' }[statut] || statut;
  await getT().sendMail({
    from:    process.env.SMTP_FROM || '"Musée Dar Cheraït" <no-reply@darcherait.tn>',
    to, subject: `Mise à jour réservation ${reference} — ${label}`,
    html: `<div style="font-family:Georgia,serif;max-width:600px;margin:auto;padding:20px;border:1px solid #C4A265">
      <h2 style="color:#3A2210">Musée Dar Cheraït</h2>
      <p>Bonjour <strong>${prenom}</strong>, votre réservation <strong>${reference}</strong> : <strong>${label}</strong></p>
      ${reponse ? `<blockquote style="border-left:3px solid #C4A265;padding-left:12px;color:#555">${reponse}</blockquote>` : ''}
      <p style="color:#8B6914;font-size:12px">Musée Dar Cheraït — Tozeur, Tunisie</p>
    </div>`,
  });
}

module.exports = { sendConfirmationEmail, sendAdminResponseEmail };