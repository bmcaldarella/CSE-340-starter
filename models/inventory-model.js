// models/inventory-model.js
const pool = require("../database")

/* ***************************
 *  Get all classification data
 * ************************** */
async function getClassifications() {
  try {
    const result = await pool.query(
      "SELECT * FROM public.classification ORDER BY classification_name"
    )
    return result.rows // ← devuelve array
  } catch (err) {
    console.error("getClassifications error:", err)
    return []
  }
}

/* ***************************
 *  Insert new classification
 * ************************** */
async function addClassification(classification_name) {
  const sql = `
    INSERT INTO public.classification (classification_name)
    VALUES ($1)
    RETURNING classification_id
  `
  try {
    const r = await pool.query(sql, [classification_name])
    return r.rowCount === 1
  } catch (err) {
    console.error("addClassification error:", err)
    return false
  }
}

/* ***************************
 *  Insert new inventory item
 * ************************** */
async function addInventory(inv) {
  const sql = `
    INSERT INTO public.inventory
      (inv_make, inv_model, inv_year, inv_description,
       inv_image, inv_thumbnail, inv_price, inv_miles,
       inv_color, classification_id)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    RETURNING inv_id
  `
  const params = [
    inv.inv_make,
    inv.inv_model,
    Number(inv.inv_year),
    inv.inv_description,
    inv.inv_image,
    inv.inv_thumbnail,
    Number(inv.inv_price),
    Number(inv.inv_miles),
    inv.inv_color,
    Number(inv.classification_id),
  ]
  try {
    const r = await pool.query(sql, params)
    return r.rowCount === 1
  } catch (err) {
    console.error("addInventory error:", err)
    return false
  }
}

/* ***************************
 *  Get inventory by classification_id
 * ************************** */
async function getInventoryByClassificationId(classification_id) {
  try {
    const data = await pool.query(
      `SELECT i.*, c.classification_name
         FROM public.inventory AS i
         JOIN public.classification AS c
           ON i.classification_id = c.classification_id
        WHERE i.classification_id = $1
        ORDER BY i.inv_make, i.inv_model`,
      [classification_id]
    )
    return data.rows
  } catch (error) {
    console.error("getInventoryByClassificationId error:", error)
    return []
  }
}

/* ***************************
 *  Get a single vehicle by inv_id
 * ************************** */
async function getVehicleByInvId(inv_id) {
  try {
    const sql = `
      SELECT i.*, c.classification_name
        FROM public.inventory AS i
        JOIN public.classification AS c
          ON i.classification_id = c.classification_id
       WHERE i.inv_id = $1
    `
    const result = await pool.query(sql, [inv_id])
    return result.rows[0] || null
  } catch (error) {
    console.error("getVehicleByInvId error:", error)
    throw error
  }
}

/* ***************************
 *  Update Inventory Data
 * ************************** */
async function updateInventory(
  inv_id,
  inv_make,
  inv_model,
  inv_description,
  inv_image,
  inv_thumbnail,
  inv_price,
  inv_year,
  inv_miles,
  inv_color,
  classification_id
) {
  try {
    const sql = `
      UPDATE public.inventory
         SET inv_make = $1,
             inv_model = $2,
             inv_description = $3,
             inv_image = $4,
             inv_thumbnail = $5,
             inv_price = $6,
             inv_year = $7,
             inv_miles = $8,
             inv_color = $9,
             classification_id = $10
       WHERE inv_id = $11
       RETURNING *`
    const data = await pool.query(sql, [
      inv_make,
      inv_model,
      inv_description,
      inv_image,
      inv_thumbnail,
      inv_price,
      inv_year,
      inv_miles,
      inv_color,
      classification_id,
      inv_id
    ])
    return data.rows[0]
  } catch (error) {
    console.error("Model error in updateInventory:", error)
    throw error
  }
}

/* ***************************
 *  Delete Inventory Item
 * ************************** */
async function deleteInventoryItem(inv_id) {
  try {
    const sql = "DELETE FROM public.inventory WHERE inv_id = $1"
    const result = await pool.query(sql, [inv_id])
    return result.rowCount 
  } catch (error) {
    console.error("deleteInventoryItem error:", error)
    return 0
  }
}

module.exports = {
  getClassifications,
  addClassification,
  addInventory,
  getInventoryByClassificationId,
  getVehicleByInvId,
  updateInventory,
  deleteInventoryItem
}
