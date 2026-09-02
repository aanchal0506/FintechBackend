const {Router} = require('express');




const transactionRoutes = Router();

//POST /api/transactions/
//create a new transaction


transactionRoutes.post("/")


module.exports = transactionRoutes;
