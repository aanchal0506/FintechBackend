const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const emailService = require("../services/email.service")
const accountModel = require("../models/account.model")
const mongoose = require("mongoose")

//create new transaction
/*
    * THE 10-STEP TRANSFER FLOW:
    * 1. Validate request
    * 2. Validate idempotency key
    * 3. Check account status
    * 4. Derive sender balance from ledger
    * 5. Create transaction (PENDING)
    * 6. Create DEBIT ledger entry
    * 7. Create CREDIT ledger entry
    * 8. Mark transaction COMPLETED
    * 9. Commit MongoDB session
    * 10. Send email notification
 */
async function createTransaction(req, res){
    const {fromAccount,toAccount,amount,idempotencyKey} = req.body
    //validate request 
    if(!fromAccount || !toAccount || !amount || !idempotencyKey){
            return res.status(400).json({
            message : "From Account,To Account, Amount or Idempotency Key are required"
        })
    }
    const fromUserAccount = await accountModel.findOne({
        _id : fromAccount
    })

    const toUserAccount = await accountModel.findOne({
        _id : toAccount
    })

    if(!fromUserAccount || !toUserAccount){
        return res.status(400).json({
            message : "Account not found"
        })
    }
    // Validate idempotency key

    const isTransactionAlreadyExist = await transactionModel.findOne({
        idempotencyKey : idempotencyKey
    })
    if(isTransactionAlreadyExist){
        if(isTransactionAlreadyExist.status === "COMPLETED"){
            return res.status(200).json({
                message :"Transaction already processed",
                transaction : isTransactionAlreadyExist
                })
        }
        if(isTransactionAlreadyExist.status === "PENDING"){
            return res.status(200).json({
            message :"Transaction is still processing"
                })
        }
        if(isTransactionAlreadyExist.status === "FAILED"){
            return res.status(500).json({
            message :"Transaction processing failed"
                })
        }
        if(isTransactionAlreadyExist.status === "REVERSED"){
            return res.status(500).json({
            message :"Transaction reversed. Please try again"
                })
        }
    }

    //check account status 
    if(fromAccount.status !== "ACTIVE" || toUserAccount.status!== "ACTIVE"){
        return res.status(400).json({
            message : "Account not active, Both account should be active"
        })
    }

    //derive sender balance from ledger
    const balance =await fromUserAccount.getBalance();
    if(balance<amount){
        res.status(400).json({
            message : `Insuffiecient balance. Current balance is ${balance}. Requested amount is ${amount}`
        })
    }

    //Create transaction (PENDING)
    const session = await mongoose.startSession()
    session.startTransaction() //for step 5 to 8 either everything is completed or everything is reverted

    const transaction = await transactionModel.create({
        fromAccount,toAccount,amount,idempotencyKey,status : "PENDING"
    },{session})//pass session to include in session
    
    
    //Create DEBIT ledger entry
    const debitLedgerEntry = await transactionModel.create({
        account : fromAccount,
        amount : amount ,
        transaction : transaction._id,
        type : "DEBIT"
     },{
        session
     })


     //Create CREDIT ledger entry
    const creditLedgerEntry = await transactionModel.create({
        account : toAccount,
        amount : amount ,
        transaction : transaction._id,
        type : "CREDIT"
     },{
        session
     })

     // Mark transaction COMPLETED
    transaction.status="COMPLETED"
    await transaction.save({session})

    await session.commitTransaction()
    session.endSession()

    //send email notification
    await emailService.sendTransactionEmail(req.user.email, req.user.name, amount, toAccount)

    return res.status(201).json({
        message : "transaction completed successfully",
        transaction : transaction
    })
} 

module.exports = {
    createTransaction
}



