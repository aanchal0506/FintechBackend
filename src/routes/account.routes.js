const express = require("express")
const authMiddleware = require("../middlewares/auth.middleware")
const accountController = require("../controllers/account.controller")

const router = express.Router()

// POST /api/accounts/
//create mew account // protected route 
router.post("/",authMiddleware.authMiddleware,accountController.createAccountController)

// GET /api/accounts/
//get all accounts of logged in user
//protected api

router.get("/",authMiddleware.authMiddleware,
    accountController.getUserAccountController
)


module.exports = router ;
