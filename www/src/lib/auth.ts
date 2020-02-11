import { App } from "./app";
import { Backend } from "./backend";


export class Auth {
    static phone: string;
    static sms: string;

    static checkAuthentication(returnUrl?: string) {
        if (!App.User.isAuthenticated) {
            App.showSignupDlg(returnUrl);
            return false;
        } return true;
    }

    static async  signup() {
        if ((<HTMLFormElement>$("#signup-form-1")[0]).checkValidity()) {
            event.preventDefault();
            var tel = $('#su-tel').val();
            App.gTag('account', 'signup/try-send-sms-code', tel);

            try {
                let result = await Backend.post('user/signup', {
                    phone: tel
                });
                Auth.phone = <string>tel;
                App.gTag('account', 'signup/send-sms-code', tel);
                $("#signup-form-2").removeClass('d-none');
                $("#signup-form-1").addClass('d-none');
            } catch (err) {
                if (err && err.response && err.response.status == 400) {
                    $('#si-email').val(tel);
                    $('#si-password').focus();
                    App.activaTab("signin-tab");
                } else {
                    App.gTag('account', 'signup/error-send-sms-code', tel);
                }
                App.HandleError(err)
            }
        }
    }

    static async  signup_verify() {
        if ((<HTMLFormElement>$("#signup-form-2")[0]).checkValidity()) {
            event.preventDefault();
            let sms = $('#su-sms').val();
            App.gTag('account', 'signup/try-verify-sms-code', Auth.phone);
            try {
                let result = await Backend.post('user/signupverify', {
                    phone: Auth.phone,
                    password: sms
                })
                Auth.sms = <string>sms;
                App.gTag('account', 'signup/verify-sms-code',  Auth.phone);

                $("#signup-form-3").removeClass('d-none');
                $("#signup-form-2").addClass('d-none');
            } catch (err) {
                App.gTag('account', 'signup/error-verify-sms-code',  Auth.phone);
                App.HandleError(err)
            }
        }
    }
    static async signin() {
        if ((<HTMLFormElement>$("#signin-form")[0]).checkValidity()) {
            event.preventDefault();
            let email = $('#si-email').val();
            let password = $('#si-password').val();
            let rememberme = $('#si-remember').val();
            App.gTag('account', 'signin/try', email);
            try {
                let result = await Backend.post('authenticate', {
                    password: password,
                    email: email,
                    remember_me: rememberme == "on"
                })
                App.gTag('account', 'signin/success', email);
                var urlParams = new URLSearchParams(window.location.search);
                if (urlParams.has('r')) {
                    window.location.href = urlParams.get('r');
                }
                else window.location.href = App.RunConfig['returnUrl'] || '/'
            } catch (err) {
                App.gTag('account', 'signin/error', email);
                App.HandleError(err)
            }
        }
    }



    static async signup_complete() {
        if ((<HTMLFormElement>$("#signup-form-3")[0]).checkValidity()) {
            event.preventDefault();
            let name = $('#su-name').val();
            let email = $('#su-email').val();
            App.gTag('account', 'signup/try-complete', Auth.phone);
            try {
                let result = await Backend.post('user/signupcomplete', {
                    phone: Auth.phone,
                    password: Auth.sms,
                    name: name,
                    email: email
                })
                App.gTag('account', 'signup/complete', Auth.phone);
                window.location.href = App.RunConfig['returnUrl'] || '/'
                //$("#signup-form-4").removeClass('d-none');
                //$("#signup-form-3").addClass('d-none');
                //App.setCookie("auth", JSON.stringify(result.token))
            } catch (err) {
                App.gTag('account', 'signup/error-complete', Auth.phone);
                App.HandleError(err)
            }
        }
    }
}