const pool = require("../database")

async function addFavorite(account_id, inv_id) {
    const sql = `
    INSERT INTO favorite (account_id, inv_id)
    VALUES ($1, $2)
    ON CONFLICT (account_id, inv_id) DO NOTHING
    RETURNING favorite_id
  `
    const result = await pool.query(sql, [account_id, inv_id])
    return result.rows[0] 
}

async function removeFavorite(account_id, inv_id) {
    const sql = `DELETE FROM favorite WHERE account_id = $1 AND inv_id = $2`
    await pool.query(sql, [account_id, inv_id])
    return true
}

async function listFavorites(account_id) {
  const sql = `
    SELECT i.inv_id, i.inv_make, i.inv_model, i.inv_year, i.inv_price,
           i.inv_color, i.inv_image, c.classification_name
    FROM favorite f
    JOIN inventory i ON i.inv_id = f.inv_id
    JOIN classification c ON c.classification_id = i.classification_id
    WHERE f.account_id = $1
    ORDER BY f.created_at DESC
  `
  const result = await pool.query(sql, [account_id])
  return result.rows
}

async function isFavorite(account_id, inv_id) {
    const sql = `SELECT 1 FROM favorite WHERE account_id = $1 AND inv_id = $2`
    const result = await pool.query(sql, [account_id, inv_id])
    return result.rowCount > 0
}

module.exports = { addFavorite, removeFavorite, listFavorites, isFavorite }
