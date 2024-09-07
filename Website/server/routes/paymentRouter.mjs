import express from 'express';
import {pay, getBalance} from '../utils/payUtils.mjs';

const paymentRouter = express.Router();

paymentRouter.post('/payment', (req, res) => {
    const amount = req.body.amount;
    try{
        if(!amount){
            return res.status(401).json({'Payment': 'request details insufficient'});
        }
        if(amount > getBalance()){
            return res.status(402).json({'Payment': 'insufficient funds'});
        }
        if(amount < 0){
            return res.status(403).json({'Payment': 'invalid amount'});
        }
        
        pay(amount);

        return res.status(200).json({'Payment': 'successful'});
    }catch(err){
        return res.status(500).json({'Server Error': err.message});
    }
});

paymentRouter.get('/balance', (_req, res) => {
    try{
        return res.status(200).json({'Balance': getBalance()});
    }catch(err){
        return res.status(500).json({'Server Error': err.message});
    }
});

export default paymentRouter;