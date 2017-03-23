Vue.component('inpt', {
    template: '<div class="input-field col s12"><input @change="$input" :id="name" :name="name" :type="type" class="validate" autocomplete="off"><label :for="name"><slot ref="text"></slot></label></div>',
    props   : {
        'name': {
            'type': String,
            default() {
                return this.$refs.text.text().toKebabCase();
            }
        },
        'text': [ String ],
        'type': [ String ]
    },
    methods : {
        /**
         * Emit input event to the parent function
         * @param {Event} evt
         */
        $input(evt) {
            // Get element that the Event is bound to
            let el = evt.srcElement;

            // Get input value
            let data = el.value;

            //Emit input event to parents
            this.$emit('input', data);
        }
    }
});