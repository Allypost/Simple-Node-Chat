let chatVM = new Vue({
    el      : '#chatframe',
    data    : {
        message: '',
        user   : null,
        io     : null
    },
    computed: {
        /**
         * Lazily compute input placeholder message
         *
         * @return {string} The formatted placeholder message
         */
        placeholder: function () {
            return `Press [Enter ↵] to send message as ${this.username}`;
        },
        /**
         * Compute the username from the user object to save some time
         * in methods and in rendering
         *
         * @return {string} The username
         */
        username   : function () {
            let user = this.user || { username: '' };
            return user.username;
        }
    },
    methods : {
        /**
         * Make node bold
         *
         * @param {Element} node - The node to change
         *
         * @return {Element} Styled node
         */
        _bold(node) {
            node.style.fontWeight = 'bold';

            return node;
        },
        /**
         * Make node gray
         *
         * @param {Element} node - The node to change
         * @return {Element} Styled node
         */
        _gray(node) {
            node.style.color = 'gray';

            return node;
        },
        /**
         * Style the node to be a status (gray and bold)
         *
         * @param {Element} node - The node to change
         * @return {Element} Styled node
         */
        _status(node) {
            node = this._gray(node);
            node = this._bold(node);

            return node;
        },
        /**
         * Make node font monospace
         *
         * @param {Element} node - The node to change
         *
         * @return {Element} Styled node
         */
        _mono(node) {
            node.style.fontFamily = 'monospace';

            return node;
        },
        /**
         * Create a span node
         *
         * @param {string}  text   - The text to add to the span
         * @param {boolean} [mono] - Whether to add monospace font
         *
         * @return {Element} A new span element
         */
        span(text, mono = false) {
            // Create span node...
            let span     = document.createElement('span');
            // ...and a text node to fill it
            let textNode = document.createTextNode(text);

            // It's marked as monospace worthy
            if (mono)
                span = this._mono(span); // mmmmm yes... Monospace...

            // Reunite text with it's parent
            span.appendChild(textNode);

            // Return span
            return span;
        },
        /**
         * Create a li node
         *
         * @param {string}  username - The name of the user
         * @param {string}  text     - The text to add to the li (the message contents)
         * @param {boolean} [status] - Whether the li represents a message or a status
         *
         * @return {Element} A new span element
         */
        li(username, text, status = false) {
            // Create new li node
            let liNode = document.createElement('li');

            // Create spans for username and message
            let usrNode = this.span(username + ': ', true); // Username is set to monospace (just because)
            let msgNode = this.span(text);

            // If it's marked as status
            if (status) {
                // Make the whole li bold and gray...
                liNode  = this._status(liNode);
                // ...and make the message monospace to fit with the username
                msgNode = this._mono(msgNode);
            }

            // If you're the poster
            if (username == this.username)
                liNode.setAttribute('class', 'my-message'); // Mark the li with the class my-message

            // Append username and message nodes to the main li node
            liNode.appendChild(usrNode);
            liNode.appendChild(msgNode);

            // Live happily ever after
            return liNode;
        },
        /**
         * Add message to display element
         *
         * @param {string} username - The name of the user
         * @param {string} text     - The message contents
         */
        addMessage(username, text) {
            // Create a new li node
            let node = this.li(username, text);

            // Append it to the display element
            this.$add(node);
        },
        /**
         * Add the user's current message to display element and clear the text field
         */
        addSelfMessage() {
            // Add message to the screen
            this.addMessage(this.username, this.message);

            // Clear the input
            this.message = '';
        },
        /**
         * Broadcast the message and display it
         */
        sendMessage() {
            // Send message on an adventure
            this.io.emit('chat message', this.message);

            // Hang its farewell picture on the wall
            this.addSelfMessage();
        },
        /**
         * Add status to display element
         *
         * @param {string} text - The status text
         */
        addStatus(text) {
            // Create a new list element
            let el = this.li(':~Status~', text, true);

            // Append it to the display element
            this.$add(el);
        },
        /**
         * Appends a node to the display element
         *
         * @param {Element} node - The node to append
         */
        $add(node) {
            this.$refs.messageDisplay.appendChild(node);
        },
        /**
         * Register Socket.IO related listeners
         */
        socketRegister() {
            let io = this.io;

            // On established connection
            io.on('connect', () => {
                // Request user data synchronisation
                // aka
                // request the server's user object
                io.emit('user sync', (user) => {
                    // Set current user to server supplied user object
                    this.$set(this, 'user', user);
                });
            });

            // Receive new message
            io.on('chat message', (msg) => {
                this.addMessage(msg.username, msg.message);
            });

            // New user joins
            io.on('user join', (username) => {
                this.addStatus(`+ ${username} joined the chat`);
            });

            // Existing user leaves
            io.on('user leave', (username) => {
                this.addStatus(`- ${username} left the chat`);
            });
        }
    },
    mounted : function () {
        // Store Socket.IO in data
        this.io = io();

        // Register Socket.IO event handlers
        this.socketRegister();
    }
});