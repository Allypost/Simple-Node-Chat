let app    = require('express')();
let server = require('http').Server(app);
let io     = require('socket.io')(server);

server.listen(3000);

io.on('connection', function (socket) {
    socket.emit('user set', socket.id);
    socket.broadcast.emit('user join', socket.id);


    socket.on('disconnect', function () {
        socket.broadcast.emit('user leave', socket.id);
    });

    socket.on('chat message', function (msg) {
        socket.broadcast.emit('chat message', { 'message': msg, 'username': socket.id });
    });
});