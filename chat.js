let app    = require('express')();
let server = require('http').Server(app);
let io     = require('socket.io')(server);
let mysql  = require('mysql');

let connection = mysql.createConnection(
    {
        host    : 'localhost',
        database: 'node_lon_chat',
        user    : 'node_lon_chat',
        password: 'K3PUJqbmodF7cKG6KD9Sn8GJ0QYHLTEIAQO0gIYyTa1ELz54ssmWyIMvNDSNURyS54RolCo5v3fFBz0BwqiM2T5IDYtpOKyO0D99'
    }
);

let usersDB = {};

console.log('Caching user DB...');
connection.query('SELECT `id`, `username`, `email`, `remember_identifier` as `identifier` FROM `users`', function (err, res) {
    console.log("\tDone!");
    console.log('Processing result set...');
    for (let i in res) {
        if (!res.hasOwnProperty(i))
            continue;
        let user = res[ i ];

        usersDB[ user.id ] = user;
    }
    console.log("\tDone!");

    console.log('Starting server...');
    server.listen(3000, function () {
        console.log("\tDone!");
        console.log('Started server on 127.0.0.1:3000');
    });
});

let users   = {};
let sockets = {};

function isFunction(potentialFunction) {
    return potentialFunction && {}.toString.call(potentialFunction) === {}.toString.call(new Function());
}

function fnc(func) {
    if (!isFunction(func))
        return new Function;

    return func;
}

function parseCookies(request) {
    let list = {},
        rc   = request.headers.cookie;

    rc && rc.split(';').forEach(function (cookie) {
        let parts = cookie.split('=');

        list[ parts.shift().trim() ] = decodeURI(parts.join('='));
    });

    return list;
}

function getUserCookie(request) {
    let cookies = parseCookies(request);

    return cookies[ 'remember_me' ];
}

function getUserIdentifier(request) {
    let cookie = getUserCookie(request);

    return cookie.slice(0, cookie.indexOf('..'));
}

function fetchUser(identifier, fn) {
    for (let u in usersDB) {
        if (!usersDB.hasOwnProperty(u))
            continue;

        let user = usersDB[ u ];

        if (user.identifier == identifier) {
            fnc(fn)(user);
            return user;
        }
    }

    fnc(fn)(null);
    return null;
}

function setUser(socket, user) {
    sockets[ socket.id ] = user.id;
    users[ user.id ]     = user;
}

function fetchAndSetUser(socket, fn) {
    let currentUser = getUserFromSocket(socket);

    let cb = function (user) {
        setUser(socket, user);
        fnc(fn)(user);

        return user;
    };

    if (currentUser)
        return cb(currentUser);

    let identifier = getUserIdentifier(socket.request);

    fetchUser(identifier, cb);
}

function getUserFromSocket(socket) {
    let id   = sockets[ socket.id ];
    let user = users[ id ];

    if (!user) {
        let userIdentifier = getUserIdentifier(socket.request);

        user = fetchUser(userIdentifier);
    }

    return user;
}

function removeUser(socket) {
    let user     = getUserFromSocket(socket);
    let sessions = getUserSessions(user.id).length - 1;

    delete sockets[ socket.id ];

    if (sessions <= 0)
        delete users[ user.id ];
}

function getUserUsername(socket) {
    let user = getUserFromSocket(socket);

    return user[ 'username' ];
}

function getUserSessions(userID) {
    let sessions = [];

    for (let s in sockets)
        if (sockets.hasOwnProperty(s) && sockets[ s ] == userID)
            sessions.push(s);

    return sessions;
}

// Get all unique online users with how many sessions they occupy
app.get('/online', (req, res) => {
    for (let u in users)
        if (users.hasOwnProperty(u))
            users[ u ][ 'sessions' ] = getUserSessions(u).length;

    res.json(users);
});

// Get how many unique users are online
app.get('/online/count', (req, res) => {
    let len = Object.keys(users).length;

    res.json({ online: len });
});

io.on('connection', function (socket) {

    // On connect, set user data
    fetchAndSetUser(socket, function (user) {
        // Also broadcast join even to other users
        socket.broadcast.emit('user join', user.username);
    });

    // Client requests syncing of user data
    socket.on('user sync', function (fn) {
        // Get current user object
        let user = getUserFromSocket(socket);
        // Send data back to client
        fn(user);
    });

    // Upon disconnect or timeout
    socket.on('disconnect', function () {
        // Get username
        let username = getUserUsername(socket);
        // Remove user from online users
        removeUser(socket);
        // Broadcast to other users
        socket.broadcast.emit('user leave', username);
    });

    // On receive chat message
    socket.on('chat message', function (msg) {
        // Get username
        let username = getUserUsername(socket);
        // Broadcast message to other subscribers
        socket.broadcast.emit('chat message', { 'message': msg, 'username': username });
    });
});