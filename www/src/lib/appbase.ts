export default class AppBase {
    public static RunConfig = {
        
    }    

    static jq(selector?) {
        return selector ? <any>$(selector) : <any>$;
    }

    static shareFb() {
        let url = 'https://work.facebook.com/sharer.php?display=popup&u=' + window.location.href;
        let options = 'toolbar=0,status=0,resizable=1,width=626,height=436';
        return window.open(url,'sharer',options);
    
}
    static alert(msg, type?) {
        // debugger;
        // (<any>window).bootbox.alert({
        //     message: msg,
        //     backdrop: true
        // });
        this.jq().notify({
            message: msg,
            
        }, {
            
            placement: {
                from: "top",
                align: "center"
            },
            type: type || 'info',
            z_index: 2000,
            delay: 15000,
            allow_dismiss: true,
        });
    }

    static activaTab(tab) {
        this.jq('a[href="#' + tab + '"]').tab('show');
    };

    static showSignupDlg(returnUrl: string = null, showAd: boolean = false, message?: string) {
        message ? $('#signupDlgMessageDiv').show(): $('#signupDlgMessageDiv').hide();
        message ? $('#signupDlgMessage').html(message): $('#signupDlgMessage').html("")        
        this.activaTab("signup-tab");
        this.RunConfig['returnUrl'] = returnUrl;    
        showAd ? this.jq('#signupad').show(): this.jq('#signupad').hide();
        this.jq('#signin-modal').modal('show');
        $('#signin-modal').one('shown.bs.modal', function () {
            $('#su-tel').focus();
    
          })


    }    

    static showLoginDlg(returnUrl: string = null, showAd: boolean = false, user: string = '') {
        $('#signupDlgMessageDiv').hide();
        $('#signupDlgMessage').html("") 
        this.activaTab("signin-tab")
        this.RunConfig['returnUrl'] = returnUrl;
        showAd ? this.jq('#signupad').show(): this.jq('#signupad').hide();
        user ?  this.jq('#si-email').val(user):null;
        this.jq('#signin-modal').modal('show');

        $('#signin-modal').one('shown.bs.modal', function () {
            if ($('#si-email').val()) {
                $('#si-password').focus();                
            }
            else $('#si-email').focus();
          })
    }
}