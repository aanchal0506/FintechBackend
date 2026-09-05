const transactionModel = require("../models/transaction.model")
const ledgerModel = require("../models/ledger.model")
const accountModel = require("../models/account.model")
const emailService = require("../services/email.service")
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

async function createTransaction(req, res) {

    //validate request

    const { fromAccount, toAccount, amount, idempotencyKey } = req.body

    if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "FromAccount, toAccount, amount and idempotencyKey are required"
        })
    }

    // Prevent transferring money to the same account

    if (fromAccount === toAccount) {
        return res.status(400).json({
            message: "Cannot transfer money to the same account"
        })
    }

    // Validate amount

    if (amount <= 0) {
        return res.status(400).json({
            message: "Amount must be greater than 0"
        })
    }

    const fromUserAccount = await accountModel.findOne({
        _id: fromAccount
    })

    const toUserAccount = await accountModel.findOne({
        _id: toAccount
    })

    if (!fromUserAccount || !toUserAccount) {
        return res.status(400).json({
            message: "Invalid fromAccount or toAccount"
        })
    }

    // Validate idempotency key

    const isTransactionAlreadyExists = await transactionModel.findOne({
        idempotencyKey: idempotencyKey
    })

    if (isTransactionAlreadyExists) {

        if (isTransactionAlreadyExists.status === "COMPLETED") {
            return res.status(200).json({
                message: "Transaction already processed",
                transaction: isTransactionAlreadyExists
            })
        }

        if (isTransactionAlreadyExists.status === "PENDING") {
            return res.status(200).json({
                message: "Transaction is still processing"
            })
        }

        if (isTransactionAlreadyExists.status === "FAILED") {
            return res.status(500).json({
                message: "Transaction processing failed, please retry"
            })
        }

        if (isTransactionAlreadyExists.status === "REVERSED") {
            return res.status(500).json({
                message: "Transaction was reversed, please retry"
            })
        }
    }

    //check account status

    if (
        fromUserAccount.status !== "ACTIVE" ||
        toUserAccount.status !== "ACTIVE"
    ) {
        return res.status(400).json({
            message: "Both fromAccount and toAccount must be ACTIVE to process transaction"
        })
    }

    //derive sender balance from ledger

    const balance = await fromUserAccount.getBalance()

    if (balance < amount) {
        return res.status(400).json({
            message: `Insufficient balance. Current balance is ${balance}. Requested amount is ${amount}`
        })
    }

    let transaction
    let session

    try {

        //Create transaction (PENDING)

        session = await mongoose.startSession()
        session.startTransaction()

        transaction = (
            await transactionModel.create([{
                fromAccount,
                toAccount,
                amount,
                idempotencyKey,
                status: "PENDING"
            }], { session })
        )[0]

        //Create DEBIT ledger entry

        const debitLedgerEntry = await ledgerModel.create([{
            account: fromAccount,
            amount: amount,
            transaction: transaction._id,
            type: "DEBIT"
        }], { session })

        //wait 15 sec to credit the money

        await (() => {
            return new Promise((resolve) => {
                setTimeout(resolve, 15 * 1000)
            })
        })()

        //Create CREDIT ledger entry

        const creditLedgerEntry = await ledgerModel.create([{
            account: toAccount,
            amount: amount,
            transaction: transaction._id,
            type: "CREDIT"
        }], { session })

        // Mark transaction COMPLETED

        transaction.status = "COMPLETED"

        await transaction.save({ session })

        // Commit MongoDB session

        await session.commitTransaction()

    } catch (err) {

        // Rollback transaction if any step fails

        if (session) {
            await session.abortTransaction()
        }

        console.error("Transaction error:", err)

        return res.status(500).json({
            message: "Transaction failed. Please retry after sometime"
        })

    } finally {

        // End MongoDB session

        if (session) {
            session.endSession()
        }
    }

    //send email notification

    try {

        await emailService.sendTransactionEmail(
            req.user.email,
            req.user.name,
            amount,
            toAccount
        )

    } catch (err) {

        // Email failure should not rollback completed transaction

        console.error("Transaction email failed:", err)
    }

    return res.status(201).json({
        message: "Transaction completed successfully",
        transaction: transaction
    })
}


async function createInitialFundsTransaction(req, res) {

    const { toAccount, amount, idempotencyKey } = req.body

    //validate request

    if (!toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "toAccount, amount and idempotencyKey are required"
        })
    }

    // Validate amount

    if (amount <= 0) {
        return res.status(400).json({
            message: "Amount must be greater than 0"
        })
    }

    // Validate idempotency key

    const isTransactionAlreadyExists = await transactionModel.findOne({
        idempotencyKey: idempotencyKey
    })

    if (isTransactionAlreadyExists) {

        if (isTransactionAlreadyExists.status === "COMPLETED") {
            return res.status(200).json({
                message: "Transaction already processed",
                transaction: isTransactionAlreadyExists
            })
        }

        if (isTransactionAlreadyExists.status === "PENDING") {
            return res.status(200).json({
                message: "Transaction is still processing"
            })
        }

        if (isTransactionAlreadyExists.status === "FAILED") {
            return res.status(500).json({
                message: "Transaction processing failed, please retry"
            })
        }

        if (isTransactionAlreadyExists.status === "REVERSED") {
            return res.status(500).json({
                message: "Transaction was reversed, please retry"
            })
        }
    }

    // Find receiver account

    const toUserAccount = await accountModel.findOne({
        _id: toAccount
    })

    if (!toUserAccount) {
        return res.status(400).json({
            message: "Invalid toAccount"
        })
    }

    // Find system user account

    const fromUserAccount = await accountModel.findOne({
        user: req.user._id
    })

    if (!fromUserAccount) {
        return res.status(400).json({
            message: "System user account not found"
        })
    }

    let session
    let transaction

    try {

        // Start MongoDB session

        session = await mongoose.startSession()
        session.startTransaction()

        // Create transaction (PENDING)

        transaction = new transactionModel({
            fromAccount: fromUserAccount._id,
            toAccount,
            amount,
            idempotencyKey,
            status: "PENDING"
        })

        // Create DEBIT ledger entry

        const debitLedgerEntry = await ledgerModel.create([{
            account: fromUserAccount._id,
            amount: amount,
            transaction: transaction._id,
            type: "DEBIT"
        }], { session })

        // Create CREDIT ledger entry

        const creditLedgerEntry = await ledgerModel.create([{
            account: toAccount,
            amount: amount,
            transaction: transaction._id,
            type: "CREDIT"
        }], { session })

        // Mark transaction COMPLETED

        transaction.status = "COMPLETED"

        await transaction.save({ session })

        // Commit MongoDB session

        await session.commitTransaction()

    } catch (err) {

        // Rollback transaction if any step fails

        if (session) {
            await session.abortTransaction()
        }

        console.error("Initial funds transaction error:", err)

        return res.status(500).json({
            message: "Initial funds transaction failed. Please retry"
        })

    } finally {

        // End MongoDB session

        if (session) {
            session.endSession()
        }
    }

    return res.status(201).json({
        message: "Initial funds transaction completed successfully",
        transaction: transaction
    })
}


module.exports = {
    createTransaction,
    createInitialFundsTransaction
}