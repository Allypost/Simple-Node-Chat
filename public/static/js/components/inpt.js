Vue.component('inpt', {
    template: '<div class="input-field col s12"><input :id="name" :name="name" :type="type" class="validate" autocomplete="off"><label :for="name"><slot ref="text"></slot></label></div>',
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

            // Get options for the select element
            let opts     = el.options;
            // Get selected element's index
            let selected = el.selectedIndex;

            // Get selected value
            let data = opts[ selected ].value;

            //Emit input event to parents
            this.$emit('input', data);
        }
    }
});