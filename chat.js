let app    = require('express')();
let server = require('http').Server(app);
let io     = require('socket.io')(server);

server.listen(3000);

let users = {};

app.get('/online', (req, res) => {
    res.json(users);
});

app.get('/online/count', (req, res) => {
    let len = Object.keys(users).length;

    res.json({ online: len });
});

io.on('connection', function (socket) {
    socket.on('user set', function (user) {
        users[ socket.id ] = user;
        socket.broadcast.emit('user join', user.username);
    });

    socket.on('disconnect', function () {
        socket.broadcast.emit('user leave', users[ socket.id ].username);
        delete users[ socket.id ];
    });

    socket.on('chat message', function (msg) {
        socket.broadcast.emit('chat message', { 'message': msg, 'username': users[ socket.id ].username });
    });
});