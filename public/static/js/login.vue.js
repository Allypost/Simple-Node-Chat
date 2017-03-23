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
            let vm = this;

            let data = {
                identifier: vm.identifier,
                password  : vm.password
            };

            vm.loading = true;

            $.post(this.getURL(), data)
             .done(function () {
                 window.location.reload(true);
             })
             .fail(function (d) {
                 let data = d.responseJSON;

                 let errors = data.errors;

                 for (let error in errors)
                     if (errors.hasOwnProperty(error))
                         Materialize.toast(errors[ error ], 5000, 'blue-grey darken-4 red-text');
             })
             .always(function () {
                 vm.loading = false;
             });
        }
    }
});