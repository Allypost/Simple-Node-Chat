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

/**
 * Check if variable is a function
 *
 * @param {*} potentialFunction - The potential function to check
 *
 * @return {boolean}
 */
function isFunction(potentialFunction) {
    return !!(potentialFunction && {}.toString.call(potentialFunction) === {}.toString.call(new Function()));
}

/**
 * Make sure the variable is a function.
 * Return func if it's a function. Otherwise return empty function
 *
 * @param {*} func - The potential function
 *
 * @return {Function} A function (original if it was a function and empty if it wasn't)
 */
function fnc(func) {
    if (!isFunction(func))
        return new Function;

    return func;
}

/**
 * Parse request header cookies into an easily digestible object
 *
 * @param request - The current request object
 * @return {Object} The cookie object
 */
function parseCookies(request) {
    let list = {},
        rc   = request.headers.cookie;

    if (rc)
        rc  // Split header on ; (standard delimiter)
            .split(';')
            // Iterate over loosely separated headers
            .forEach(function (cookie) {
                // Split into key and value
                let parts = cookie.split('=');
                //                                       Join other parts
                //                                       in case of = in
                //     Get first element                 the value
                //    vvvvvvvvvvvvvvvvvvvv               vvvvvvvvvvvvvvv
                list[ parts.shift().trim() ] = decodeURI(parts.join('='));
            });

    return list;
}

/**
 * Get remember me cookie (aka user persistence cookie)
 *
 * @param request - The current request object
 *
 * @return {string} The whole remember me string (token and identifier)
 */
function getUserCookie(request) {
    let cookies = parseCookies(request);

    return cookies[ 'remember_me' ];
}

/**
 * Get identifier from current request
 *
 * @param request - The current request object
 *
 * @return {string} The identifier linked to current request's user
 */
function getUserIdentifier(request) {
    let cookie = getUserCookie(request);
    // The token and identifier are separated by a `..`.
    // The first part is the identifier and the second is the token
    // We only need the identifier
    return cookie.slice(0, cookie.indexOf('..'));
}

/**
 * Fetch the user from the cached DB
 *
 * @param {string}   identifier - The identifier from the remember cookie
 * @param {function} [fn]       - Callback function
 *
 * @return {Object|null} Object if user was found, otherwise null
 */
function fetchUser(identifier, fn) {
    for (let u in usersDB) {
        if (!usersDB.hasOwnProperty(u))
            continue;

        // Get the user
        let user = usersDB[ u ];

        // We found a match
        if (user.identifier == identifier) {
            // Call callback function the safe way
            fnc(fn)(user);
            // Return on first find (we don't expect duplicates)
            return user;
        }
    }

    // No users found :(
    // Send back NULL and probably break most stuff
    fnc(fn)(null);
    return null;
}

/**
 * Set the local online users and associated sockets
 *
 * @param socket - The current socket object
 * @param user   - The User object
 */
function setUser(socket, user) {
    // Link socket id to user id
    sockets[ socket.id ] = user.id;
    // Link user id to user object
    users[ user.id ]     = user;
}

/**
 * Get the user object from the current socket object
 * And register it with the local store
 *
 * @param            socket - The current socket object
 * @param {Function} [fn]   - Callback function
 *
 * @return {Object} User object
 */
function fetchAndSetUser(socket, fn) {
    // Try and get the user if possible
    let currentUser = getUserFromSocket(socket);

    // Define callback
    let cb = function (user) {
        // Set the local user
        setUser(socket, user);
        // Call callback the safe way
        fnc(fn)(user);

        // Return the user because we're just nice like that
        return user;
    };

    // We've got a cache match!
    if (currentUser)
    // Just pretend like we got it from the DB/DBcache
        return cb(currentUser);

    // Get identifier...
    let identifier = getUserIdentifier(socket.request);
    // ...and use it to fetch a user from the DB/DBcache
    return fetchUser(identifier, cb);
}

/**
 * Get the user object from the current socket object
 *
 * @param socket - The current socket object
 * @return {Object}
 */
function getUserFromSocket(socket) {
    let id   = sockets[ socket.id ];
    let user = users[ id ];

    // If we can't find the user locally
    if (!user) {
        // Then we get the identifier from the request
        let userIdentifier = getUserIdentifier(socket.request);

        // And we grab a fresh user
        user = fetchUser(userIdentifier);
    }

    return user;
}

/**
 * Remove socket session from online users
 * Delete user if they don't have any sockets open
 *
 * @param socket - The current socket object
 */
function removeUser(socket) {
    // Get user object and extract ID from it
    let userID = getUserFromSocket(socket).id;
    // Get sessions count.
    // The -1 is because we're going to be
    // deleting a session in a moment.
    let sessions = getUserSessionsCount(userID) - 1;

    // Delete the specified socket
    delete sockets[ socket.id ];

    // If the user doesn't have any sockets left...
    if (sessions <= 0)
    // ...then delete him from the local store too.
        delete users[ userID ];
}

/**
 * Get current user's username
 *
 * @param socket - The current socket object
 *
 * @return {string} The username
 */
function getUserUsername(socket) {
    let user = getUserFromSocket(socket);

    return user[ 'username' ];
}

/**
 * Get all sessions for the user of userID
 *
 * @param {int} userID - The user id
 *
 * @return {Array} List of all sessions (sockets) that belong to the user
 */
function getUserSessions(userID) {
    let sessions = [];

    for (let s in sockets)
        if (
            sockets.hasOwnProperty(s)
            && sockets[ s ] == userID
        )
            sessions.push(s);

    return sessions;
}

/**
 * Get number of sessions for the user of userID
 *
 * @param {int} userID - The user id
 *
 * @return {int} Number of sessions (sockets) that belong to the user
 */
function getUserSessionsCount(userID) {
    let sessions = 0;

    for (let s in sockets)
        if (sockets.hasOwnProperty(s))
        // This is just because I like how spooky it looks.
        // It's basically a glorified if matches add 1, else add 0
            sessions += sockets[ s ] == userID;

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