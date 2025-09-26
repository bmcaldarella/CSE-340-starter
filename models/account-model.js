const pool = require("../database/")

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
 *  Check if email already exists  (para registro)
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
 *  Get account by email (para login)
 * **************************************** */
async function getAccountByEmail(account_email) {
  try {
    const sql = `
      SELECT account_id, account_firstname, account_lastname, account_email, account_type, account_password
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

module.exports = {
  registerAccount,
  checkExistingEmail,
  getAccountByEmail, 
}
