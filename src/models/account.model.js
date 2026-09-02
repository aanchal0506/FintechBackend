const mongoose = require("mongoose")

const accountSchema = new mongoose.Schema({
    user: {
        type : mongoose.Schema.Types.ObjectId,
        reference : "user",
        required : [true,"Account must be associated with a user"],
        index : true //easy search of account (b+ tree)
    },
    status: {
        type: String,
        enum: {
        values: ["ACTIVE", "FROZEN", "CLOSED"],
        message: "Status can be either ACTIVE, FROZEN or CLOSED"
        },
        default: "ACTIVE"
    },
    currency : {
        type : String,
        required : [true, "Currency is required for creating an account"],
        dafault : "INR"
    }
    //balance is never stored directly in database 
},{
    timestamps : true
})

accountSchema.index({
    user : 1,
    status : 1//compound index -> index on 2 columns
})

const accountModel = mongoose.model("account", accountSchema)

module.exports = accountModel