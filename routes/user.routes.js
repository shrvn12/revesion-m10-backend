const express = require('express');
const fs = require('fs')
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const saltRounds = +process.env.saltRounds;
const userRouter = express.Router();

const transport = nodemailer.createTransport({
    service:'gmail',
    host:'smtp.gmail.com',
    secure: false,
    auth:{
        user:process.env.from_email,
        pass:process.env.email_password
    }
});

userRouter.post('/signup',async (req, res) => {
    console.log(req.body);
    let {username, email, password} = req.body;
    let payload = {username, email, password, emailVerified:false};
    let users = fs.readFileSync(__dirname+'/../configs/users.json','utf-8');
    users = JSON.parse(users);
    for(let elem of users){
        if(elem.email == email){
            return res.status(409).send({msg:'Account alredy exists'});
        }
    }
    console.log(payload);
    payload.password = bcrypt.hashSync(payload.password,+saltRounds);
    users.push(payload);
    const mail = {
        from:process.env.from_email,
        to:email,
        subject:"Account Verification",
        text:`Click this link to verify your email => http://localhost:4500/verify?email=${email}`
    }
    
    transport.sendMail(mail, (err, response) => {
        if(err){
            console.log(err);
        }
        else{
            console.log(response);
            fs.writeFileSync(__dirname+'/../configs/users.json',JSON.stringify(users));
        }
        res.status(201).send({msg:'Registration successful'});
    })
})

userRouter.get('/verify',(req, res) => {
    const {email} = req.query;
    let users = fs.readFileSync(__dirname+'/../configs/users.json','utf-8');
    users = JSON.parse(users);
    for(let elem of users){
        if(elem.email == email){
            elem.emailVerified = true;
            break;
        }
    }
    const mail = {
        from:process.env.from_email,
        to:email,
        subject:"Account Verified",
        text:`Your account has been verified`
    }
    
    transport.sendMail(mail, (err, response) => {
        if(err){
            console.log(err);
        }
        else{
            console.log(response);
            fs.writeFileSync(__dirname+'/../configs/users.json',JSON.stringify(users));
        }
        res.status(200).send({msg:'Email Verified'});
    })

})

userRouter.post('/login',(req, res) => {
    console.log(req.body);
    const {email, password} = req.body;

    let users = fs.readFileSync(__dirname+'/../configs/users.json','utf-8');

    users = JSON.parse(users);

    const user = users.filter(elem => elem.email == email)[0];

    if(!user){
        return res.status(404).send({msg:'Account does not exist'});
    }
    if(!user.emailVerified){
        return res.status(401).send({msg:'Your email is not verified'});
    }

    bcrypt.compare(password,user.password,(err, response) => {
        if(err){
            res.status(500).send({msg:'Something went wrong'});
        }
        else{
            if(response){
                const token = jwt.sign(user,process.env.key);
                res.status(202).send({msg:'Login Success', token});
            }
        }
    })  
})

module.exports = {
    userRouter
}