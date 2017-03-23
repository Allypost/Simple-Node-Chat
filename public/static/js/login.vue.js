let loginVM = new Vue({
    el     : '#login',
    data   : {
        identifier: '',
        password  : '',
        loading   : false
    },
    methods: {
        getURL() {
            return this.$el.getAttribute('action');
        },
        send() {
            let data = {
                identifier: this.identifier,
                password  : this.password
            };

            this.loading = true;

            $.post(this.getURL(), data)
             .done(() => {
                 window.location.reload(true);
             })
             .fail((d) => {
                 let data = d.responseJSON;

                 let errors = data.errors;

                 for (let error in errors)
                     if (errors.hasOwnProperty(error))
                         Materialize.toast(errors[ error ], 5000, 'blue-grey darken-4 red-text');
             })
             .always(() => {
                 this.loading = false;
             });
        }
    }
});