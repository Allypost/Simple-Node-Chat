let express = require('express');
let app     = express();
let http    = require('http').Server(app);
let io      = require('socket.io')(http);

const PORT = 3000;

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/templates/index.html');
});

app.use(express.static(__dirname + '/static'));

io.on('connection', function (socket) {

    socket.emit('user set', socket.id);

    socket.broadcast.emit('user join', socket.id);

    socket.on('chat message', function (msg) {
        socket.broadcast.emit('chat message', { 'message': msg, 'username': socket.id });
    });

    socket.on('disconnect', function () {
        socket.broadcast.emit('user leave', socket.id);
    })

});

http.listen(PORT, function () {
    console.log(`listening on *:${PORT}`);
});