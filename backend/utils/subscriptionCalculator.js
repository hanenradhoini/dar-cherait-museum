const pool = require('../config/postgres');

async function calculateSubscriptionPrice({ categoryId, numberOfPersons, planType }) {
  const catResult = await pool.query(
    'SELECT * FROM subscription_categories WHERE id = $1',
    [categoryId]
  );
  if (catResult.rows.length === 0) throw new Error('Catégorie introuvable');
  const category = catResult.rows[0];

  const tierResult = await pool.query(
    `SELECT * FROM discount_tiers
     WHERE category_id = $1 AND min_persons <= $2
       AND (max_persons IS NULL OR max_persons >= $2)
     ORDER BY min_persons DESC LIMIT 1`,
    [categoryId, numberOfPersons]
  );
  const discountPercent = tierResult.rows.length ? parseFloat(tierResult.rows[0].discount_percent) : 0;

  const months = planType === 'annual' ? 12 : 1;
  const basePrice = parseFloat(category.price_per_person_month) * numberOfPersons * months;
  const totalPrice = basePrice * (1 - discountPercent / 100);

  return {
    categoryName: category.name,
    basePrice: parseFloat(basePrice.toFixed(2)),
    discountPercent,
    totalPrice: parseFloat(totalPrice.toFixed(2)),
  };
}

module.exports = { calculateSubscriptionPrice };