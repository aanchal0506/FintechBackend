// server instance creation and server config
const express = require("express")
const cookieParser  = require("cookie-parser")

//routes required 
const authRouter = require("./routes/auth.routes")
const accountRouter = require("./routes/account.routes")
const transactionRouter = require("./routes/transaction.routes")
const app = express();
app.use(express.json())
app.use(cookieParser())


// use routes
app.use("/api/auth", authRouter)
app.use("/api/accounts",accountRouter)
app.use("api/transactions",transactionRouter)
module.exports = app 
