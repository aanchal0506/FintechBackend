const accountModel = require("../models/account.model");

//create account 
async function createAccountController(req, res){
    const user = req.user;
    const account = await accountModel.create({
        user : user._id,
        currency: req.body.currency
    })
    res.status(201).json({
        account
    })
}
//get account
async function getUserAccountController(req,res){
    const accounts = await accountModel.find({
        user: req.user._id
    })
    return res.status(200).json({
        accounts
    })
}

module.exports = {
    createAccountController,getUserAccountController}