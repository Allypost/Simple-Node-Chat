let io = require('socket.io')(3000, { transports: [ 'polling', 'websocket' ] });

io.on('connection', function (socket) {

    socket.emit('user set', socket.id);

    socket.broadcast.emit('user join', socket.id);

    socket.on('chat message', function (msg) {
        socket.broadcast.emit('chat message', { 'message': msg, 'username': socket.id });
    });

    socket.on('disconnect', function () {
        socket.broadcast.emit('user leave', socket.id);
    });

});