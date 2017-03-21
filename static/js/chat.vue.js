var chatVM = new Vue({
    el     : '#chatframe',
    data   : {
        message : '',
        username: '',
        io      : null
    },
    methods: {
        /**
         * Make node "fat" (apply bold and make it gray)
         *
         * @param {Element} node - The node to change
         *
         * @return {Element} Styled node
         */
        _fat          : function (node) {
            node.style.fontWeight = 'bold';
            node.style.color      = 'gray';

            return node;
        },
        /**
         * Make node font monospace
         *
         * @param {Element} node - The node to change
         *
         * @return {Element} Styled node
         */
        _mono         : function (node) {
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
        span          : function (text, mono) {
            // Create span node...
            var span     = document.createElement('span');
            // ...and a text node to fill it
            var textNode = document.createTextNode(text);

            // It's marked as monospace worthy
            if (mono)
            // mmmmm yes... Monospace...
                span = this._mono(span);

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
        li            : function (username, text, status) {
            // Create new li node
            var liNode = document.createElement('li');

            // Create spans for username and message
            var usrNode = this.span(username + ': ', true); // Username is set to monospace (just because)
            var msgNode = this.span(text);

            // If it's marked as status
            if (status) {
                // Make the whole li bold...
                liNode  = this._fat(liNode);
                // ...and make the message monospace to fit with the username
                msgNode = this._mono(msgNode);
            }

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
        addMessage    : function (username, text) {
            // Create a new li node
            var node = this.li(username, text);

            // Append it to the display element
            this.$add(node);
        },
        /**
         * Add the user's current message to display element and clear text field
         */
        addSelfMessage: function () {
            // Add message to the screen
            this.addMessage(this.username, this.message);

            // Clear the input
            this.message = '';
        },
        /**
         * Broadcast the message and display it
         */
        sendMessage   : function () {
            // Send message on an adventure
            this.io.emit('chat message', this.message);

            // Hang it's farewell picture on the wall
            this.addSelfMessage();
        },
        /**
         * Add status to display element
         *
         * @param {string} text - The status text
         */
        addStatus     : function (text) {
            // Create a new list element
            var el = this.li(":~Status~", text, true);

            // Append it to the display element
            this.$add(el);
        },
        /**
         * Appends a node to the display element
         *
         * @param {Element} node - The node to append
         */
        $add          : function (node) {
            this.$refs.messageDisplay.appendChild(node);
        },
        /**
         * Register Socket.IO related listeners
         */
        socketRegister: function () {
            var vm = this;
            var io = vm.io;

            // Receive new message
            io.on('chat message', function (msg) {
                vm.addMessage(msg.username, msg.message);
            });

            // New user joins
            io.on('user join', function (username) {
                vm.addStatus('+ ' + username + ' joined the chat');
            });

            // Existing user leaves
            io.on('user leave', function (username) {
                vm.addStatus('- ' + username + ' left the chat');
            });

            // Store server returned username
            io.on('user set', function (username) {
                vm.username = username;
            });
        }
    },
    mounted: function () {
        // Store Socket.IO in data
        this.io = io();

        // Register Socket.IO event handlers
        this.socketRegister();
    }
});