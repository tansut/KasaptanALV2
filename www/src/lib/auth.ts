import { App } from "./app";
import { Backend } from "./backend";


export class Auth {
    static phone: string;
    static sms: string;

    static checkAuthentication(returnUrl?: string | Function, message?: string) {
        if (!App.User.isAuthenticated) {
            App.showSignupDlg(returnUrl, false, message);
            return false;
        } return true;
    }

    static async  signup() {
        if ((<HTMLFormElement>$("#signup-form-1")[0]).checkValidity()) {
            event.preventDefault();
            var iti = window['intlTelInputGlobals'].getInstance(document.querySelector('#su-tel'));
            var tel = iti ? iti.getNumber(): $('#su-tel').val();
            App.gTag('signup', 'try-send-sms-code', tel);
            $('#btn-signup-sendsms').attr("disabled", "true");              
            
            try {
                if (iti && !iti.isValidNumber()) throw new Error('Geçersiz telefon numarası');
                let result = await Backend.post('user/signup', {
                    phone: tel                    
                }, null, true);
                $('#btn-signup-sendsms').removeAttr("disabled");
                Auth.phone = <string>tel;
                App.gTag('signup', 'send-sms-code', tel);
                $("#signup-form-2").removeClass('d-none');
                $("#signup-form-1").addClass('d-none');
                if (result && result.pwd) {
                    alert('Otomatik doğrulama yapıldı. Lütfen SMS/KasaptanAl.com şifrenizi not edin: ' + result.pwd)
                    $('#su-sms').val(result.pwd);
                }
                setTimeout(() => {
                    $('#signupad').hide();
                    $('#su-sms').focus();
                    
                });
            } catch (err) {

                if (err && err.response && err.response.status == 400) {
                    $('#si-email').val(tel);                    
                    App.activaTab("signin-tab");
                    setTimeout(() => {
                        let msg = err.response.data.msg || err.response.data;
                        $("#signinMsg").removeClass("d-none");
                        $("#signinMsg").text(msg)
                        $('#si-password').focus();
                    }, 250);
                    //App.HandleError(err)

                } else {
                    App.gTag('signup', 'error-send-sms-code', tel);
                    App.HandleError(err)
                }
                
            } finally {
            $('#btn-signup-sendsms').removeAttr("disabled");
                
            }
        }
    }

    static async  signup_verify() {
        if ((<HTMLFormElement>$("#signup-form-2")[0]).checkValidity()) {
            event.preventDefault();
            let sms = $('#su-sms').val();
            App.gTag('signup', 'try-verify-sms-code', Auth.phone);
            $('#signup-btn-verifysms').attr("disabled", "true");

            
            try {
                let result = await Backend.post('user/signupverify', {
                    phone: Auth.phone,
                    password: sms
                })
                Auth.sms = <string>sms;
                App.gTag('signup', 'verify-sms-code',  Auth.phone);

                $("#signup-form-3").removeClass('d-none');
                $("#signup-form-2").addClass('d-none');
                setTimeout(() => {
                    $('#su-name').focus();
                });

            } catch (err) {
                App.gTag('signup', 'error-verify-sms-code',  Auth.phone);
                App.HandleError(err)
            } finally {
            $('#signup-btn-verifysms').removeAttr("disabled");

            }
        }
    }

    static handleAferLogin() {
        if (typeof App.RunConfig['returnUrl'] == 'function') {
            App.jq('#signin-modal').modal('hide');
            App.RunConfig['returnUrl']()
        } else {
            window.location.href = App.RunConfig['returnUrl'] || '/';
        }
        
    }

    static async signin() {
        if ((<HTMLFormElement>$("#signin-form")[0]).checkValidity()) {
            event.preventDefault();
            let email = $('#si-email').val();
            let password = $('#si-password').val();
            let rememberme = $('#si-remember').prop('checked')
            App.gTag('signin', 'try', email);
            $('#signin-btn').attr("disabled", "true");
            try {
                let result = await Backend.post('authenticate', {
                    password: password,
                    email: email,
                    remember_me: rememberme 
                })
                App.gTag('signin', 'success', email);
                var urlParams = new URLSearchParams(window.location.search);
                if (urlParams.has('r')) {
                    window.location.href = urlParams.get('r');
                }
                else  Auth.handleAferLogin();
            } catch (err) {
                App.gTag('signin', 'error', email);
                App.HandleError(err);
            } finally {
                $('#signin-btn').removeAttr("disabled");
            }
        }
    }



    static async signup_complete() {
        if ((<HTMLFormElement>$("#signup-form-3")[0]).checkValidity()) {
            event.preventDefault();
            let name = $('#su-name').val();
            let email = $('#su-email').val();
            let sex = $('#sex').val();
            let birthYear = $('#birthYear').val();

            
            App.gTag('signup', 'try-complete', Auth.phone);
            $('#signup-btn-complete').attr("disabled", "true");

            
            try {
                let result = await Backend.post('user/signupcomplete', {
                    phone: Auth.phone,
                    password: Auth.sms,
                    name: name,
                    email: email,
                    sex: sex,
                    birthYear: birthYear
                })
                App.gTag('signup', 'signup/complete', Auth.phone);
                Auth.handleAferLogin();
            } catch (err) {
                App.gTag('signup', 'error-complete', Auth.phone);
                App.HandleError(err)
            } finally {
            $('#signup-btn-complete').removeAttr("disabled");

            }
        }
    }
}