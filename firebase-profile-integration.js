// Firebase Profile Integration
// This script populates user info from Firebase and adds password/email change modals

(function() {
    'use strict';
    
    // Firebase configuration
    var firebaseConfig = {
        apiKey: "AIzaSyAhu1CM7JL9S-c_7ek0fLayjOZ0xakIxgA",
        authDomain: "voicemail-37c23.firebaseapp.com",
        projectId: "voicemail-37c23",
        storageBucket: "voicemail-37c23.firebasestorage.app",
        messagingSenderId: "788357276498",
        appId: "1:788357276498:web:1266946350b5774acb508b",
        measurementId: "G-KW0BJWCK1K"
    };
    
    // Initialize Firebase
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    
    var auth = firebase.auth();
    
    // ============================================
    // POPULATE USER INFO FROM FIREBASE
    // ============================================
    function populateUserInfo(user) {
        console.log('Populating user info:', user);
        
        // Update email in the profile
        var emailSpan = document.querySelector('.profile-block-table-ln .data span');
        if (emailSpan && !emailSpan.classList.contains('not-confirmed-desc')) {
            emailSpan.textContent = user.email;
        }
        
        // Update email verification status
        var notConfirmedDesc = document.querySelector('.not-confirmed-desc');
        var confirmBtn = document.getElementById('confirm_email');
        
        if (user.emailVerified) {
            if (notConfirmedDesc) {
                notConfirmedDesc.remove();
            }
            if (confirmBtn) {
                confirmBtn.remove();
            }
        } else {
            if (confirmBtn) {
                // Remove the confirm button as requested
                confirmBtn.remove();
            }
        }
        
        // Update registration date if we have metadata
        if (user.metadata && user.metadata.creationTime) {
            var regDate = new Date(user.metadata.creationTime);
            var regTimestamp = Math.floor(regDate.getTime() / 1000);
            var regTimeElement = document.querySelector('header time[timestamp]');
            if (regTimeElement) {
                regTimeElement.setAttribute('timestamp', regTimestamp);
                if (typeof moment !== 'undefined') {
                    regTimeElement.textContent = moment(regDate).format('lll');
                } else {
                    regTimeElement.textContent = regDate.toLocaleString();
                }
            }
        }
        
        // Update last visit
        if (user.metadata && user.metadata.lastSignInTime) {
            var lastVisit = new Date(user.metadata.lastSignInTime);
            var lastTimestamp = Math.floor(lastVisit.getTime() / 1000);
            var lastTimeElement = document.querySelector('header time.fromago[timestamp]');
            if (lastTimeElement) {
                lastTimeElement.setAttribute('timestamp', lastTimestamp);
                if (typeof moment !== 'undefined') {
                    var timeAgo = moment(lastVisit).fromNow();
                    var fullTime = moment(lastVisit).format('lll');
                    lastTimeElement.textContent = timeAgo + ' (' + fullTime + ')';
                } else {
                    lastTimeElement.textContent = lastVisit.toLocaleString();
                }
            }
        }
    }
    
    // ============================================
    // MODAL HELPERS
    // ============================================
    
    // Get modal HTML
    function getPasswordModalHTML() {
        return `
            <div class="popup-content" style="max-width: 27em;">
                <form id="change_pswd_form" class="popup-profile-changepswd">
                    <h3>Change password</h3>
                    <div>
                        <div class="input-texttype empty">
                            <input name="pswd" required type="password" value="" 
                                   data-label="Current password" 
                                   data-error-empty="This is a required field" 
                                   data-error-invalid="Wrong password">
                            <label>Current password</label>
                            <div class="ico input-texttype-pswd"></div>
                            <div class="input-texttype-error"><i class="ico"></i></div>
                            <div class="input-texttype-errortxt"></div>
                        </div>
                        <div class="input-texttype empty">
                            <input name="newpswd" required type="password" value="" 
                                   data-label="New password" 
                                   data-error-empty="This is a required field" 
                                   data-error-invalid="The password must contain at least one uppercase and one lowercase letter, one number, and contain at least 6 characters.">
                            <label>New password</label>
                            <div class="ico input-texttype-pswd"></div>
                            <div class="input-texttype-error"><i class="ico"></i></div>
                            <div class="input-texttype-errortxt"></div>
                        </div>
                        <div class="input-texttype empty">
                            <input name="repswd" required type="password" value="" 
                                   data-label="Confirm Password" 
                                   data-error-empty="This is a required field" 
                                   data-error-invalid="Passwords do not match.">
                            <label>Confirm Password</label>
                            <div class="ico input-texttype-pswd"></div>
                            <div class="input-texttype-error"><i class="ico"></i></div>
                            <div class="input-texttype-errortxt"></div>
                        </div>
                    </div>
                    <div class="auth-wrap-btn">
                        <button class="btn submit" type="button" id="change_pswd_submit">Submit</button>
                    </div>
                </form>
            </div>
        `;
    }
    
    function getEmailModalHTML() {
        return `
            <div class="popup-content" style="max-width: 27em;">
                <form id="change_email_form" class="popup-profile-changepswd">
                    <h3>Change email</h3>
                    <div>
                        <div class="input-texttype">
                            <input name="pswd" required type="password" value="" 
                                   data-label="Current password" 
                                   data-error-empty="This is a required field" 
                                   data-error-invalid="Wrong password">
                            <label>Current password</label>
                            <div class="ico input-texttype-pswd"></div>
                            <div class="input-texttype-error"><i class="ico"></i></div>
                            <div class="input-texttype-errortxt"></div>
                        </div>
                        <div class="input-texttype with-clrbtn">
                            <input name="email" required type="text" value="" 
                                   data-label="New email" 
                                   data-error-empty="This is a required field" 
                                   data-error-invalid="Email entered is not a valid email" 
                                   data-error-exists="An account with this email already exists.">
                            <div class="ico input-texttype-clr"></div>
                            <label>New email</label>
                            <div class="input-texttype-error"><i class="ico"></i></div>
                            <div class="input-texttype-errortxt"></div>
                        </div>
                    </div>
                    <div class="auth-wrap-btn">
                        <button class="btn submit" type="button" id="change_email_submit">Submit</button>
                    </div>
                </form>
            </div>
        `;
    }
    
    // ============================================
    // VALIDATORS
    // ============================================
    var Validator = {
        email: function(txt) {
            var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(txt);
        },
        pswd: function(txt) {
            return txt && txt.length > 0;
        },
        newpswd: function(txt) {
            var re = /^.*(?=.{6,})(?=.*[a-zA-Z])(?=.*\d).*$/;
            return re.test(txt);
        },
        repswd: function(txt, compareWith) {
            return txt === compareWith;
        }
    };
    
    // ============================================
    // PASSWORD CHANGE HANDLER (Firebase)
    // ============================================
    function setupPasswordChange() {
        var changePswdBtn = document.getElementById('change_pswd');
        if (!changePswdBtn) return;
        
        // Remove existing click handlers
        var newBtn = changePswdBtn.cloneNode(true);
        changePswdBtn.parentNode.replaceChild(newBtn, changePswdBtn);
        
        newBtn.addEventListener('click', function() {
            if (typeof UI === 'undefined' || !UI.popup) {
                console.error('UI.popup not available');
                return;
            }
            
            var Ppform = {
                form: undefined,
                fields: {
                    pswd: undefined,
                    newpswd: undefined,
                    repswd: undefined
                },
                btn: undefined,
                check: function(field, cycle) {
                    var o = this.fields[field];
                    var val = o.val ? o.val() : o.obj.value;
                    
                    if (!cycle && field === 'newpswd' && val && this.fields.repswd.val()) {
                        if (typeof UI.func !== 'undefined') {
                            UI.func.remClass(this.fields.repswd.obj, 'error');
                        }
                        return this.check('repswd');
                    }
                    
                    var newpswdVal = this.fields.newpswd.val ? this.fields.newpswd.val() : this.fields.newpswd.obj.value;
                    var isValid = Validator[field](val, newpswdVal);
                    
                    if (!isValid && o.error) {
                        o.error(o.obj.getAttribute('data-error-invalid'));
                        return false;
                    }
                    return isValid;
                },
                validate: function() {
                    if (typeof UI.func !== 'undefined') {
                        UI.func.remClass([this.fields.pswd, this.fields.newpswd, this.fields.repswd], 'error');
                    }
                    
                    for (var field in this.fields) {
                        var o = this.fields[field];
                        var val = o.val ? o.val() : o.obj.value;
                        
                        if (!val) {
                            if (o.error) {
                                o.error(o.obj.getAttribute('data-error-empty'));
                            }
                            return false;
                        } else if (!this.check(field, true)) {
                            return false;
                        }
                    }
                    return true;
                }
            };
            
            UI.popup({
                html: getPasswordModalHTML(),
                afterRender: function() {
                    var popup = this;
                    
                    Ppform.form = document.getElementById('change_pswd_form');
                    if (!Ppform.form) return;
                    
                    Ppform.btn = typeof UI.button !== 'undefined' ? 
                        UI.button('change_pswd_submit', {changeAtOnce: false}) : 
                        {obj: document.getElementById('change_pswd_submit')};
                    
                    // Setup fields
                    if (typeof UI.textbox !== 'undefined') {
                        Ppform.fields.pswd = UI.textbox(Ppform.form.pswd, {
                            addLabel: Ppform.form.pswd.getAttribute('data-label'),
                            btnPswd: true,
                            addError: true
                        }).input(function(input) {
                            if (typeof UI.func !== 'undefined') {
                                UI.func.remClass(input, 'error');
                            }
                        }).blur(function(input) {
                            if (input.value) Ppform.check('pswd');
                        });
                        
                        Ppform.fields.newpswd = UI.textbox(Ppform.form.newpswd, {
                            addLabel: Ppform.form.newpswd.getAttribute('data-label'),
                            btnPswd: true,
                            addError: true
                        }).input(function(input) {
                            if (typeof UI.func !== 'undefined') {
                                UI.func.remClass(input, 'error');
                            }
                        }).blur(function(input) {
                            if (input.value) Ppform.check('newpswd');
                        });
                        
                        Ppform.fields.repswd = UI.textbox(Ppform.form.repswd, {
                            addLabel: Ppform.form.repswd.getAttribute('data-label'),
                            btnPswd: true,
                            addError: true
                        }).input(function(input) {
                            if (typeof UI.func !== 'undefined') {
                                UI.func.remClass(input, 'error');
                            }
                        }).blur(function(input) {
                            if (input.value) Ppform.check('repswd');
                        });
                    } else {
                        // Fallback if UI.textbox not available
                        Ppform.fields.pswd = {obj: Ppform.form.pswd, val: function() { return this.obj.value; }};
                        Ppform.fields.newpswd = {obj: Ppform.form.newpswd, val: function() { return this.obj.value; }};
                        Ppform.fields.repswd = {obj: Ppform.form.repswd, val: function() { return this.obj.value; }};
                    }
                    
                    // Button click handler
                    var btnClickHandler = function(btn, e) {
                        if (e) e.preventDefault();
                        
                        if (Ppform.validate()) {
                            if (btn.loading) btn.loading();
                            
                            var currentPassword = Ppform.form.pswd.value;
                            var newPassword = Ppform.form.newpswd.value;
                            
                            // Firebase: Reauthenticate then update password
                            var user = auth.currentUser;
                            var credential = firebase.auth.EmailAuthProvider.credential(
                                user.email,
                                currentPassword
                            );
                            
                            user.reauthenticateWithCredential(credential)
                                .then(function() {
                                    return user.updatePassword(newPassword);
                                })
                                .then(function() {
                                    if (btn.success) btn.success();
                                    
                                    if (typeof UI.alert !== 'undefined') {
                                        UI.alert('Password has been changed<br>Please sign in with your new password', function() {
                                            auth.signOut().then(function() {
                                                window.location.href = '/';
                                            });
                                        });
                                    } else {
                                        alert('Password changed successfully');
                                        auth.signOut().then(function() {
                                            window.location.href = '/';
                                        });
                                    }
                                    
                                    if (popup.close) popup.close();
                                })
                                .catch(function(error) {
                                    if (btn.error) btn.error();
                                    
                                    console.error('Password change error:', error);
                                    
                                    if (error.code === 'auth/wrong-password' && Ppform.fields.pswd.error) {
                                        Ppform.fields.pswd.error(Ppform.fields.pswd.obj.getAttribute('data-error-invalid'));
                                    } else if (error.code === 'auth/weak-password' && Ppform.fields.newpswd.error) {
                                        Ppform.fields.newpswd.error(Ppform.fields.newpswd.obj.getAttribute('data-error-invalid'));
                                    } else {
                                        if (typeof UI.alert !== 'undefined') {
                                            UI.alert('Error changing password: ' + error.message);
                                        } else {
                                            alert('Error: ' + error.message);
                                        }
                                    }
                                });
                        }
                    };
                    
                    if (Ppform.btn.click) {
                        Ppform.btn.click(btnClickHandler);
                    } else {
                        Ppform.btn.obj.addEventListener('click', function(e) {
                            btnClickHandler(Ppform.btn, e);
                        });
                    }
                },
                onSubmit: function(popup, e) {
                    var submitBtn = document.getElementById('change_pswd_submit');
                    if (submitBtn) submitBtn.click();
                    return false;
                }
            }).show();
        });
    }
    
    // ============================================
    // EMAIL CHANGE HANDLER (Firebase)
    // ============================================
    function setupEmailChange() {
        var changeEmailBtn = document.getElementById('change_email');
        if (!changeEmailBtn) return;
        
        // Remove existing click handlers
        var newBtn = changeEmailBtn.cloneNode(true);
        changeEmailBtn.parentNode.replaceChild(newBtn, changeEmailBtn);
        
        newBtn.addEventListener('click', function() {
            if (typeof UI === 'undefined' || !UI.popup) {
                console.error('UI.popup not available');
                return;
            }
            
            var Ppform = {
                form: undefined,
                fields: {
                    pswd: undefined,
                    email: undefined
                },
                btn: undefined,
                check: function(field) {
                    var o = this.fields[field];
                    var val = o.val ? o.val() : o.obj.value;
                    
                    if (!Validator[field](val)) {
                        if (o.error) {
                            o.error(o.obj.getAttribute('data-error-invalid'));
                        }
                        return false;
                    }
                    return true;
                },
                validate: function() {
                    if (typeof UI.func !== 'undefined') {
                        UI.func.remClass([this.fields.email, this.fields.pswd], 'error');
                    }
                    
                    for (var field in this.fields) {
                        var o = this.fields[field];
                        var val = o.val ? o.val() : o.obj.value;
                        
                        if (!val) {
                            if (o.error) {
                                o.error(o.obj.getAttribute('data-error-empty'));
                            }
                            return false;
                        } else if (!this.check(field)) {
                            return false;
                        }
                    }
                    return true;
                }
            };
            
            UI.popup({
                html: getEmailModalHTML(),
                afterRender: function() {
                    var popup = this;
                    
                    Ppform.form = document.getElementById('change_email_form');
                    if (!Ppform.form) return;
                    
                    Ppform.btn = typeof UI.button !== 'undefined' ? 
                        UI.button('change_email_submit', {changeAtOnce: false}) : 
                        {obj: document.getElementById('change_email_submit')};
                    
                    // Setup fields
                    if (typeof UI.textbox !== 'undefined') {
                        Ppform.fields.pswd = UI.textbox(Ppform.form.pswd, {
                            addLabel: Ppform.form.pswd.getAttribute('data-label'),
                            btnPswd: true,
                            addError: true
                        }).input(function(input) {
                            if (typeof UI.func !== 'undefined') {
                                UI.func.remClass(input, 'error');
                            }
                        }).blur(function(input) {
                            if (input.value) Ppform.check('pswd');
                        });
                        
                        Ppform.fields.email = UI.textbox(Ppform.form.email, {
                            addLabel: Ppform.form.email.getAttribute('data-label'),
                            btnclear: true,
                            addError: true
                        }).input(function(input) {
                            if (typeof UI.func !== 'undefined') {
                                UI.func.remClass(input, 'error');
                            }
                        }).blur(function(input) {
                            if (input.value) Ppform.check('email');
                        });
                    } else {
                        // Fallback if UI.textbox not available
                        Ppform.fields.pswd = {obj: Ppform.form.pswd, val: function() { return this.obj.value; }};
                        Ppform.fields.email = {obj: Ppform.form.email, val: function() { return this.obj.value; }};
                    }
                    
                    // Button click handler
                    var btnClickHandler = function(btn) {
                        if (Ppform.validate()) {
                            if (btn.loading) btn.loading();
                            
                            var currentPassword = Ppform.form.pswd.value;
                            var newEmail = Ppform.form.email.value;
                            
                            // Firebase: Reauthenticate then update email
                            var user = auth.currentUser;
                            var credential = firebase.auth.EmailAuthProvider.credential(
                                user.email,
                                currentPassword
                            );
                            
                            user.reauthenticateWithCredential(credential)
                                .then(function() {
                                    return user.updateEmail(newEmail);
                                })
                                .then(function() {
                                    if (btn.success) btn.success();
                                    
                                    if (typeof UI.alert !== 'undefined') {
                                        UI.alert('Email has been changed to ' + newEmail, function() {
                                            window.location.reload();
                                        });
                                    } else {
                                        alert('Email changed to ' + newEmail);
                                        window.location.reload();
                                    }
                                    
                                    if (popup.close) popup.close();
                                })
                                .catch(function(error) {
                                    if (btn.error) btn.error();
                                    
                                    console.error('Email change error:', error);
                                    
                                    if (error.code === 'auth/wrong-password' && Ppform.fields.pswd.error) {
                                        Ppform.fields.pswd.error(Ppform.fields.pswd.obj.getAttribute('data-error-invalid'));
                                    } else if (error.code === 'auth/email-already-in-use' && Ppform.fields.email.error) {
                                        Ppform.fields.email.error(Ppform.fields.email.obj.getAttribute('data-error-exists'));
                                    } else if (error.code === 'auth/invalid-email' && Ppform.fields.email.error) {
                                        Ppform.fields.email.error(Ppform.fields.email.obj.getAttribute('data-error-invalid'));
                                    } else {
                                        if (typeof UI.alert !== 'undefined') {
                                            UI.alert('Error changing email: ' + error.message);
                                        } else {
                                            alert('Error: ' + error.message);
                                        }
                                    }
                                });
                        }
                    };
                    
                    if (Ppform.btn.click) {
                        Ppform.btn.click(btnClickHandler);
                    } else {
                        Ppform.btn.obj.addEventListener('click', function() {
                            btnClickHandler(Ppform.btn);
                        });
                    }
                },
                onSubmit: function(popup, e) {
                    var submitBtn = document.getElementById('change_email_submit');
                    if (submitBtn) submitBtn.click();
                    return false;
                }
            }).show();
        });
    }
    
    // ============================================
    // INITIALIZE ON AUTH STATE CHANGE
    // ============================================
    auth.onAuthStateChanged(function(user) {
        if (user) {
            console.log('User authenticated:', user.email);
            
            // Populate user info
            populateUserInfo(user);
            
            // Wait for DOM and UI to be ready
            var initInterval = setInterval(function() {
                if (typeof UI !== 'undefined' && UI.popup) {
                    clearInterval(initInterval);
                    
                    // Setup password change
                    setupPasswordChange();
                    
                    // Setup email change
                    setupEmailChange();
                    
                    console.log('Firebase profile integration initialized');
                }
            }, 100);
            
            // Timeout after 5 seconds
            setTimeout(function() {
                clearInterval(initInterval);
            }, 5000);
            
        } else {
            console.log('No user authenticated, redirecting to signin');
            window.location.href = '/user/signin';
        }
    });
    
})();