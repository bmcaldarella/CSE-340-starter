// models/account-model.js
const pool = require("../database")

/* ****************************************
 *  Register new account
 * **************************************** */
async function registerAccount(account_firstname, account_lastname, account_email, account_password) {
  try {
    const sql = `
      INSERT INTO public.account
        (account_firstname, account_lastname, account_email, account_password, account_type)
      VALUES ($1, $2, $3, $4, 'Client')
      RETURNING account_id
    `
    const result = await pool.query(sql, [
      account_firstname,
      account_lastname,
      account_email,
      account_password,
    ])
    return result.rowCount === 1
  } catch (error) {
    console.error("registerAccount error:", error)
    return false
  }
}

/* ****************************************
 *  Check if email already exists (for registration)
 * **************************************** */
async function checkExistingEmail(account_email) {
  try {
    const sql = `SELECT 1 FROM public.account WHERE account_email = $1 LIMIT 1`
    const result = await pool.query(sql, [account_email])
    return result.rowCount > 0
  } catch (error) {
    console.error("checkExistingEmail error:", error)
    return false
  }
}

/* ****************************************
 *  Get account by email (for login / validations)
 * **************************************** */
async function getAccountByEmail(account_email) {
  try {
    const sql = `
      SELECT account_id,
             account_firstname,
             account_lastname,
             account_email,
             account_type,
             account_password
        FROM public.account
       WHERE account_email = $1
       LIMIT 1
    `
    const result = await pool.query(sql, [account_email])
    return result.rows[0] || null
  } catch (error) {
    console.error("getAccountByEmail error:", error)
    throw error
  }
}

/* ****************************************
 *  Get account by id
 * **************************************** */
async function getAccountById(account_id) {
  try {
    const sql = `
      SELECT account_id,
             account_firstname,
             account_lastname,
             account_email,
             account_type
        FROM public.account
       WHERE account_id = $1
       LIMIT 1
    `
    const r = await pool.query(sql, [account_id])
    return r.rows[0] || null
  } catch (error) {
    console.error("getAccountById error:", error)
    throw error
  }
}

/* ****************************************
 *  Update account (firstname, lastname, email)
 * **************************************** */
async function updateAccount({ account_id, account_firstname, account_lastname, account_email }) {
  try {
    const sql = `
      UPDATE public.account
         SET account_firstname = $1,
             account_lastname  = $2,
             account_email     = $3
       WHERE account_id = $4
       RETURNING account_id, account_firstname, account_lastname, account_email, account_type
    `
    const r = await pool.query(sql, [account_firstname, account_lastname, account_email, account_id])
    return r.rows[0] || null
  } catch (error) {
    console.error("updateAccount error:", error)
    throw error
  }
}

/* ****************************************
 *  Update password (hashed)
 * **************************************** */
async function updatePassword(account_id, hash) {
  try {
    const sql = `
      UPDATE public.account
         SET account_password = $1
       WHERE account_id = $2
    `
    const r = await pool.query(sql, [hash, account_id])
    return r.rowCount === 1
  } catch (error) {
    console.error("updatePassword error:", error)
    return false
  }
}

module.exports = {
  registerAccount,
  checkExistingEmail,
  getAccountByEmail,
  getAccountById,
  updateAccount,
  updatePassword,
}
