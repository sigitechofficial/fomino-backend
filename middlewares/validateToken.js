require('dotenv').config();
const {verify} = require('jsonwebtoken');
//importing redis
const redis_Client = require('../routes/redis_connect');
module.exports = async function validateToken(req,res, next){
    try {
        const acccessToken = req.header('accessToken');
       
       
        if(!acccessToken) throw new Error();
       
        const validToken = verify(acccessToken, process.env.JWT_ACCESS_SECRET);
        
        
//         const redis_Token = await redis_Client.hGetAll(`fom${validToken.id}`);
//   console.log(redis_Token)
//         if(!redis_Token) throw new Error();
//         let dvToken = validToken.deviceToken;
     
        // const redis_valid = verify(redis_Token[dvToken], process.env.JWT_ACCESS_SECRET); 
        // req.user = redis_valid;
        req.user = validToken;
        next();
    } 
    catch (error) {
        return res.json({
            status: '0',
            message: 'Access Denied',
            data: {},
            error: `${error}`,
        })  
    }
}

//redis_Client.del(key);