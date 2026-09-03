const {Router} = require('express');
const authMiddleware = require("../middlewares/auth.middleware")
const transactionController = require('../controllers/transaction.controller')


const transactionRoutes = Router();

//POST /api/transactions/
//create a new transaction
transactionRoutes.post("/",authMiddleware.authMiddleware,transactionController.createTransaction)



/* POST /api/transactions/system/initial-funds */
//create inital funds transaction from system user
transactionRoutes.post("/system/intial-funds",authMiddleware.authSystemUserMiddleware,transactionController.createInitialFundsTransaction)

module.exports = transactionRoutes;
