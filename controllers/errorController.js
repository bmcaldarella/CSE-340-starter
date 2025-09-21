const errorCont = {}

errorCont.cause500 = async function (req, res, next) {
  const err = new Error("Intentional 500 for testing")
  err.status = 500
  throw err
}

module.exports = errorCont
