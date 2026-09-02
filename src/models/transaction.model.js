const mongoose = require("mongoose")

const transactionSchema = new mongoose.Schema({

    fromAccount : {
        type: mongoose.Schema.Types.ObjectId,
        reference : "account",
        required : ["true","Transaction must be associated with a from account"],
        index : true
    },
    toAccount : {
        type: mongoose.Schema.Types.ObjectId,
        reference : "account",
        required : ["true","Transaction must be associated with a to account"],
        index : true
    },
    status : {
    type :String,
    enum: {
        values: ["PENDING", "COMPLETED", "FAILED","RESERVED"],
        message: "Status can be either PENDING, COMPLETED, FAILED or RESERVED"
       },
    default: "ACTIVE"
    },
    amount : {
        type :Number ,
        required : [true,"Amount is required for creating a trsaction"],
        min : [0,"Transaction amount cannot be negative"]
    },
    idempotencyKey : {
        type : String ,
        required : [true,"Idempotency key is required to create a transaction"],
        index : true,
        unique : true
    }
    
},{
    timestamps : true
})

const trasactionModel = mongoose.model("transaction",transactionSchema)
module.exports = {
    trasactionModel
}