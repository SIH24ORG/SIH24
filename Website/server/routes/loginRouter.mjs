import express from 'express';
import {verifyLogin} from '../utils/loginUtils.mjs';


const loginRouter = express.Router();

loginRouter.post('/login', (req, res) => {
    try{
        const username = req.body.username;
        const password = req.body.password;

        console.log(req.body);

        
        if(!username || !password){
            return res.status(401).json({'Login': 'insufficient details'});
        }
        if(verifyLogin(username, password)){
            return res.status(200).json({'Login': 'successful'});
        }else{
            return res.status(403).json({'Login': 'failed'});
        }
    }catch(err){
        console.log(req.body);
        return res.status(500).json({'Server Error': err.message});
    }
});

export default loginRouter;