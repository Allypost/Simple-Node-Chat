let app    = require('express')();
let server = require('http').Server(app);
let io     = require('socket.io')(server);

server.listen(3000);

let users = {};

let sockets = {};

function getUser(socketID) {
    return users[ sockets[ socketID ] ];
}

function setUser(socketID, user) {
    sockets[ socketID ] = user.id;
    users[ user.id ]    = user;
}

function removeUser(socketID) {
    let user = getUser(socketID);

    delete users[ user.id ];
    delete sockets[ socketID ];
}

function getUserUsername(socketID) {
    return getUser(socketID)[ 'username' ];
}

app.get('/online', (req, res) => {
    res.json(users);
});

app.get('/online/count', (req, res) => {
    let len = Object.keys(users).length;

    res.json({ online: len });
});

io.on('connection', function (socket) {
    socket.on('user set', function (user) {
        setUser(socket.id, user);

        socket.broadcast.emit('user join', user.username);
    });

    socket.on('disconnect', function () {
        removeUser(socket.id);

        socket.broadcast.emit('user leave', getUserUsername(socket.id));
    });

    socket.on('chat message', function (msg) {
        socket.broadcast.emit('chat message', { 'message': msg, 'username': getUserUsername(socket.id) });
    });
});