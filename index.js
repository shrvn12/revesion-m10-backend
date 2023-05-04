const express = require('express');
const http = require('http');
const fs = require('fs');
const { userRouter } = require('./routes/user.routes');
const cors = require('cors');
const socket = require('socket.io');
require('dotenv').config();

const app = express();

const users = [];

app.use(cors());

app.use(express.json());

app.get("/",(req, res) => {
    res.send('Basic API endpoint');
})

app.use('/',userRouter);

const server = http.createServer(app);

server.listen(process.env.port,() => {
    console.log(`Server is running at ${process.env.port}`)
})

const io = socket(server);

io.on('connection',(socket) => {
    console.log('One user online');

    socket.on('joinroom',({email}) => {
        let dbusers = fs.readFileSync(__dirname+'/./configs/users.json','utf-8');
        dbusers = JSON.parse(dbusers);
        let user = dbusers.filter(elem => elem.email == email)[0];

        users.push(user);

        socket.join('groupchat');
        socket.emit('message',`welcome to groupchat`);
    })

    socket.on('group_message',(msg) => {
        socket.broadcast.emit('message',msg);
    })
})