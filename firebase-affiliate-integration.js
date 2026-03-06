// Firebase Address Book Integration
// This script populates address book from Firebase Firestore and handles add/delete operations

(function() {
    'use strict';
    
    // Wait for Firebase to be ready
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
        var db = firebase.firestore();

    function initAffiliate(user) {
        
    
        /* Todo: Implement affiliate program logic here */
        // E.g., fetch affiliate data, display referral links, track clicks/conversions, etc.
        // let's fetch available balance, pending withdrawals and minimum payout amount (0.001 BTC)

        if (user) {
            let affiliateRef = db.collection('affiliates').doc(user.uid);
            affiliateRef.get().then((doc) => {
                if (doc.exists) {
                    let data = doc.data();
                    document.getElementById('available-balance').innerText = data.availableBalance || '0';
                    document.getElementById('pending-withdrawals').innerText = data.pendingWithdrawals || '0';
                    document.getElementById('min-payout-amount').innerText = data.minPayoutAmount || '0.001';
                } else {
                    console.log("No affiliate data found");
                }
            }).catch((error) => {
                console.error("Error fetching affiliate data: ", error);
            });

            // Fetch referral codes
            // if referralCodes collection does not exist, create it with a random code and link it to the user. we should query for the user's referral codes first

            let moment = window.moment; // Assuming moment.js is included in the page
            let refcodesContainer = document.getElementById('refcodes');
            let existingCodes = [];

            let userRefCodes = db.collection('affiliates').doc(user.uid).collection('referralCodes');

            userRefCodes.get().then((querySnapshot) => {
                if (querySnapshot.empty) {
                    let newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
                    userRefCodes.add({
                        code: newCode,
                        percentage: 40
                    }).then(() => {
                        console.log("Default referral code created for user:", newCode);
                    }).catch((error) => {
                        console.error("Error creating default referral code for user: ", error);
                    });
                } else {
                    querySnapshot.forEach((doc) => {
                    let data = doc.data();
                    let form = document.createElement('form');
                    form.className = 'user-refcode';
                    form.setAttribute('data-code', data.code);
                    form.innerHTML = `
<header>
<div class="user-refcode-code">
<label>Code:</label>
<span>${data.code}</span>
<button type="button" class="copy-btn ico copy"><i class="hint blue">Copied</i></button>
</div>
<div class="user-refcode-perc-info-link">
<div><span>${data.percentage || 40}% for exchange via link</span></div>
</div>
<div class="user-refcode-delete">
<button type="button" class="btn-text mini" name="delete">Delete</button>
</div>
</header>
<div class="user-refcode-body">
<table>
<tbody>
<tr>
<td>Simple link:</td>
<td><div class="input-texttype with-copybtn focus"><input class="user-refcode-reflink" name="simplelink" readonly="" type="text" value="http://localhost/?ref=${data.code}"><div class="ico input-texttype-copy"></div></div></td>
</tr>
<tr>
<td>Link with currencies:</td>
<td>
<div class="user-refcode-reflink-ccies-outer">
<div class="input-texttype wdirccies with-copybtn focus"><input class="user-refcode-reflink-ccies" name="ccieslink" readonly="" type="text" value="http://localhost/BTC/USDT/?ref=${data.code}"><div class="ico input-texttype-copy"></div><div class="specblock"><span class="coin-img svgcoin btc"></span><span class="ico selfarrow"></span><span class="coin-img svgcoin usdt"></span></div></div>
<div class="user-refcode-reflink-gen none">
<div class="ui-select-outer with-search" data-value="BTC"><label class="ui-select" data-value="BTC"><div class="ui-select-value"><div class="coin-wrap"><span class="coin-ico coin-img svgcoin btc"></span><span class="coin-name">BTC</span></div></div><div class="ui-select-arrow"></div><div class="ui-select-search"><span class="ui-select-search-ico ico"></span><div class="ui-select-search-inner"><input type="text" placeholder="Search"></div></div></label><div class="ui-select-list"><ul style="padding-right: 0px; width: calc(100% + 0px);"><li class="ui-select-option hover" data-value="BTC" data-num="0"><div class="coin-wrap"><span class="coin-ico coin-img svgcoin btc"></span><span class="coin-name">BTC</span></div></li></ul><div class="ui-select-scroll-wrap hidden" data-height="100"><div class="ui-select-scroll" style="top: 0px; height: 100%;"></div></div></div></div><select name="ccy_from" class="hidden"><option value="BTC" selected="">BTC</option></select>
<div class="ui-select-outer with-search" data-value="USDT"><label class="ui-select" data-value="USDT"><div class="ui-select-value"><div class="coin-wrap"><span class="coin-ico coin-img svgcoin usdt"></span><span class="coin-name">USDT</span></div></div><div class="ui-select-arrow"></div><div class="ui-select-search"><span class="ui-select-search-ico ico"></span><div class="ui-select-search-inner"><input type="text" placeholder="Search"></div></div></label><div class="ui-select-list"><ul style="padding-right: 0px; width: calc(100% + 0px);"><li class="ui-select-option hover" data-value="USDT" data-num="0"><div class="coin-wrap"><span class="coin-ico coin-img svgcoin usdt"></span><span class="coin-name">USDT</span></div></li></ul><div class="ui-select-scroll-wrap hidden" data-height="100"><div class="ui-select-scroll" style="top: 0px; height: 100%;"></div></div></div></div><select name="ccy_to" class="hidden"><option value="USDT" selected="">USDT</option></select>
<button class="btn mini generate" type="button" name="generate">Generate</button>
</div>
</div>
</td>
</tr>
</tbody>
</table>
</div>
                    `;
                    document.getElementById('refcodes').appendChild(form);
                    // Assuming formInit is available
                    if (typeof formInit === 'function') {
                        formInit(form);
                    }
                });
                }
            }).catch((error) => {
                console.error("Error fetching user referral codes: ", error);
            });
           
            

            // Fetch affiliate orders
            affiliateRef.collection('orders').get().then((querySnapshot) => {
                let tbody = document.querySelector('#table tbody');
                querySnapshot.forEach((doc) => {
                    let data = doc.data();
                    let reg = moment.unix(data.reg);
                    let row = document.createElement('tr');
                    row.className = data.confirmed ? '' : 'notconfirmed';
                    row.innerHTML = `
<td><div class="ztp-c mh" data-type="reg">${reg.format('L')} ${reg.format('HH:mm')}</div></td>
<td><div class="ztp-c mh" data-type="order">${data.order}</div></td>
<td><div class="ztp-c mh" data-type="amount"><span class="ib-middle coin-img svgcoin ${data.ccyCoin.toLowerCase()}"></span> <span class="ib-middle">${data.amount} ${data.ccyCoin}</span></div></td>
<td><div class="ztp-c mh" data-type="paid" data-value="${data.paid}">${data.confirmed ? (data.paid ? 'Paid' : 'Pending') : '<span class="user-aff-notconfirmed">The request to verify your API key has not yet been approved</span>'}</div></td>
                    `;
                    tbody.appendChild(row);
                });
            }).catch((error) => {
                console.error("Error fetching affiliate orders: ", error);
            });
        } else {
            console.log("No user is signed in");
        }

        
    
    
    } // End of initAffiliate function

    auth.onAuthStateChanged(function(user) {
        if (user) {
            console.log('User authenticated:', user.email);
            
            // Populate user info
            
            
            // Wait for DOM and UI to be ready
            var initInterval = setInterval(function() {
                if (typeof UI !== 'undefined' && UI.popup) {
                    clearInterval(initInterval);
                    
                    initAffiliate(user);
                    
                    console.log('Firebase profile integration initialized');
                }
            }, 100);
            
            // Timeout after 5 seconds
            setTimeout(function() {
                clearInterval(initInterval);
            }, 5000);
            
        } else {
            console.log('No user authenticated, redirecting to signin');
            window.location.href = 'index.html';
        }
    });
    
})();