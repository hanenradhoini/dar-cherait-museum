// backend/controllers/museumController.js

// جلب جميع المعارض النشطة
exports.getExpositions = async (req, res, next) => {
  try {
    const result = await req.db.query(
      'SELECT * FROM expositions WHERE actif = TRUE ORDER BY id DESC'
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

// جلب جميع الأعمال الفنية النشطة مع إمكانية الفرز حسب المعرض
exports.getOeuvres = async (req, res, next) => {
  try {
    const { exposition_id } = req.query;
    let query = 'SELECT * FROM oeuvres WHERE actif = TRUE';
    const params = [];

    if (exposition_id) {
      query += ' AND exposition_id = $1';
      params.push(exposition_id);
    }
    
    query += ' ORDER BY id DESC';

    const result = await req.db.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};