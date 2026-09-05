const mongoose = require("mongoose");


const tokenBlaclistSchema = new mongoose.Schema({
    token : {
        type :String ,
        required : [true, "Token is required to blacklist"],
        unique : [true, "token is already blacklisted"]
    
    }
},{
    timestamps : true
})


tokenBlaclistSchema.index({
    createdAt : 1
},{
    expireAfterSeconds : 60*60*24*3  //3days
})

const tokenBlaclistModel = mongoose.model("tokenBlacklist",tokenBlaclistSchema)

module.exports = tokenBlaclistModel