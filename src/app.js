// server instance creation and server config
const express = require("express")
const cookieParser  = require("cookie-parser")

//routes
const authRouter = require("./routes/auth.routes")
const accountRouter = require("./routes/account.routes")

const app = express();
app.use(express.json())
app.use(cookieParser())


// use routes
app.use("/api/auth", authRouter)
app.use("/api/accounts",accountRouter)
module.exports = app 
