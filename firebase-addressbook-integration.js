// Firebase Address Book Integration
// This script populates address book from Firebase Firestore and handles add/delete operations

(function() {
    'use strict';
    
    // Wait for Firebase to be ready
    function waitForFirebase(callback) {
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            callback();
        } else {
            setTimeout(function() {
                waitForFirebase(callback);
            }, 100);
        }
    }
    
    waitForFirebase(function() {
        initAddressBook();
    });
    
    function initAddressBook() {
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
    
    // ============================================
    // NETWORKS AND CURRENCIES DATA
    // ============================================
    var Networks = {
        'ARBITRUM': { value: 'ARBITRUM', label: 'Arbitrum', icon: 'arbitrum', tag: '' },
        'AVAXC': { value: 'AVAXC', label: 'AVAX C-Chain', icon: 'avaxc', tag: '' },
        'BASE': { value: 'BASE', label: 'Base', icon: 'base', tag: '' },
        'BNB': { value: 'BNB', label: 'BNB Beacon Chain (BEP2)', icon: 'bnb', tag: 'MEMO' },
        'BSC': { value: 'BSC', label: 'BNB Smart Chain (BEP20)', icon: 'bsc', tag: '' },
        'DOT': { value: 'DOT', label: 'Polkadot', icon: 'dot', tag: '' },
        'DOTAH': { value: 'DOTAH', label: 'Asset Hub (Polkadot)', icon: 'dotah', tag: '' },
        'ETH': { value: 'ETH', label: 'Ethereum (ERC20)', icon: 'eth', tag: '' },
        'KCC': { value: 'KCC', label: 'Kucoin Community Chain', icon: 'kcc', tag: '' },
        'MATIC': { value: 'MATIC', label: 'Polygon', icon: 'matic', tag: '' },
        'OP': { value: 'OP', label: 'Optimism', icon: 'op', tag: '' },
        'OPBNB': { value: 'OPBNB', label: 'opBNB', icon: 'opbnb', tag: '' },
        'S': { value: 'S', label: 'Sonic', icon: 's', tag: '' },
        'SOL': { value: 'SOL', label: 'Solana', icon: 'sol', tag: '' },
        'SUI': { value: 'SUI', label: 'Sui', icon: 'sui', tag: '' },
        'TRX': { value: 'TRX', label: 'Tron (TRC20)', icon: 'trx', tag: '' },
        'ZKSYNC': { value: 'ZKSYNC', label: 'ZkSync', icon: 'zksync', tag: '' }
    };
    
    // Store Ccies globally for use in other functions
    window.AddressBookCcies = {
        'BTC': {
            coin: 'BTC', name: 'Bitcoin', img: 'btc',
            networks: {
                'BTC': { value: 'BTC', label: 'Bitcoin', icon: 'btc', tag: '' },
                'BSC': { value: 'BSC', label: 'BNB Smart Chain (BEP20)', icon: 'bsc', tag: '' }
            }
        },
        'ETH': {
            coin: 'ETH', name: 'Ethereum', img: 'eth',
            networks: {
                'ETH': { value: 'ETH', label: 'Ethereum (ERC20)', icon: 'eth', tag: '' },
                'ARBITRUM': { value: 'ARBITRUM', label: 'Arbitrum', icon: 'arbitrum', tag: '' },
                'BASE': { value: 'BASE', label: 'Base', icon: 'base', tag: '' },
                'BSC': { value: 'BSC', label: 'BNB Smart Chain (BEP20)', icon: 'bsc', tag: '' },
                'OP': { value: 'OP', label: 'Optimism', icon: 'op', tag: '' },
                'ZKSYNC': { value: 'ZKSYNC', label: 'ZkSync', icon: 'zksync', tag: '' }
            }
        },
        'USDT': {
            coin: 'USDT', name: 'Tether', img: 'usdt',
            networks: {
                'ETH': { value: 'ETH', label: 'Ethereum (ERC20)', icon: 'eth', tag: '' },
                'ARBITRUM': { value: 'ARBITRUM', label: 'Arbitrum', icon: 'arbitrum', tag: '' },
                'AVAXC': { value: 'AVAXC', label: 'AVAX C-Chain', icon: 'avaxc', tag: '' },
                'BSC': { value: 'BSC', label: 'BNB Smart Chain (BEP20)', icon: 'bsc', tag: '' },
                'MATIC': { value: 'MATIC', label: 'Polygon', icon: 'matic', tag: '' },
                'SOL': { value: 'SOL', label: 'Solana', icon: 'sol', tag: '' },
                'TRX': { value: 'TRX', label: 'Tron (TRC20)', icon: 'trx', tag: '' }
            }
        }
        // Add more currencies as needed
    };
    
    var Ccies = window.AddressBookCcies;
    
    // ============================================
    // ADDRESS DATA STRUCTURE
    // ============================================
    /*
    Expected Firestore structure:
    
    users/{userId}/addresses/{addressId}
    {
        coin: "BTC" or null (if universal),
        network: "BTC",
        address: "bc1q...",
        tag: "" or "memo value",
        universal: false,
        date_reg: timestamp
    }
    */
    
    // ============================================
    // POPULATE ADDRESS BOOK
    // ============================================
    function populateAddressBook(userId) {
        console.log('Loading address book for user:', userId);
        
        db.collection('users').doc(userId).collection('addresses')
            .orderBy('date_reg', 'desc')
            .get()
            .then(function(querySnapshot) {
                var addresses = [];
                querySnapshot.forEach(function(doc) {
                    var data = doc.data();
                    data.id = doc.id;
                    addresses.push(data);
                });
                
                console.log('Addresses loaded:', addresses.length);
                renderAddresses(addresses);
            })
            .catch(function(error) {
                console.error('Error loading addresses:', error);
            });
    }
    
    // ============================================
    // RENDER ADDRESSES
    // ============================================
    function renderAddresses(addresses) {
        var tbody = document.querySelector('#addressbook tbody');
        if (!tbody) {
            console.warn('Address book table body not found');
            return;
        }
        
        // Clear existing rows
        tbody.innerHTML = '';
        
        if (addresses.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2em;">No saved addresses</td></tr>';
            return;
        }
        
        addresses.forEach(function(addr) {
            var row = document.createElement('tr');
            row.className = 'ztp-row';
            row.setAttribute('data-id', addr.id);
            
            // Format registration date
            var regDate = '';
            if (addr.date_reg) {
                var regDateTime = addr.date_reg.toDate ? addr.date_reg.toDate() : new Date(addr.date_reg);
                if (typeof moment !== 'undefined') {
                    regDate = moment(regDateTime).format('L');
                } else {
                    regDate = regDateTime.toLocaleDateString();
                }
            }
            
            // Get network info
            var networkAlias = Networks[addr.network] ? Networks[addr.network].label : addr.network;
            var networkMin = addr.network.toLowerCase();
            
            // Get coin info or universal
            var coinHtml = '';
            if (addr.universal) {
                coinHtml = '<span class="universal" title="Universal">Universal</span>';
            } else if (addr.coin) {
                var coinMin = addr.coin.toLowerCase();
                coinHtml = '<span class="ib-middle coin-img svgcoin ' + coinMin + '"></span> <span class="ib-middle">' + escapeHtml(addr.coin) + '</span>';
            }
            
            // Get tag name
            var tagHtml = '';
            if (addr.tag) {
                var tagName = addr.universal ? 
                    (Networks[addr.network] ? Networks[addr.network].tag : 'Tag') : 
                    (Ccies[addr.coin] && Ccies[addr.coin].networks[addr.network] ? Ccies[addr.coin].networks[addr.network].tag : 'Tag');
                tagHtml = '<br><span class="tag">' + tagName + ': <b>' + escapeHtml(addr.tag) + '</b></span>';
            }
            
            row.innerHTML = `
                <td><div class="ztp-c mh" data-type="date_fav">${regDate}</div></td>
                <td><div class="ztp-c mh" data-type="network">
                    <span class="ib-middle coin-img svgcoin ${networkMin}"></span> 
                    <span class="ib-middle">${escapeHtml(networkAlias)}</span>
                </div></td>
                <td><div class="ztp-c mh" data-type="coin">${coinHtml}</div></td>
                <td><div class="ztp-c mh breakall" style="width: 29em;" data-type="address">
                    <span class="address">${escapeHtml(addr.address)}</span>${tagHtml}
                </div></td>
                <td><div class="ztp-c mh npt" data-type="del">
                    <button class="btn-icon ico delete" data-address-id="${addr.id}"></button>
                </div></td>
            `;
            
            tbody.appendChild(row);
        });
        
        // Update pagination info
        updatePaginationInfo('addressbook', addresses.length);
    }
    
    // ============================================
    // DELETE ADDRESS
    // ============================================
    function setupDeleteHandlers(userId) {
        var tbody = document.querySelector('#addressbook tbody');
        if (!tbody) return;
        
        tbody.addEventListener('click', function(e) {
            if (e.target.classList.contains('delete')) {
                var addressId = e.target.getAttribute('data-address-id');
                
                if (typeof UI !== 'undefined' && UI.confirm) {
                    UI.confirm('Are you sure?', function() {
                        deleteAddress(userId, addressId);
                    });
                } else {
                    if (confirm('Are you sure you want to delete this address?')) {
                        deleteAddress(userId, addressId);
                    }
                }
            }
        });
    }
    
    function deleteAddress(userId, addressId) {
        db.collection('users').doc(userId).collection('addresses').doc(addressId)
            .delete()
            .then(function() {
                console.log('Address deleted successfully');
                populateAddressBook(userId);
            })
            .catch(function(error) {
                console.error('Error deleting address:', error);
                if (typeof UI !== 'undefined' && UI.alert) {
                    UI.alert('Error deleting address: ' + error.message);
                } else {
                    alert('Error deleting address');
                }
            });
    }
    
    // ============================================
    // ADD ADDRESS MODAL
    // ============================================
    function setupAddAddressModal(userId) {
        var addBtn = document.getElementById('user_addressbook_add');
        if (!addBtn) return;
        
        // Remove existing click handlers
        var newBtn = addBtn.cloneNode(true);
        addBtn.parentNode.replaceChild(newBtn, addBtn);
        
        newBtn.addEventListener('click', function() {
            showAddAddressModal(userId);
        });
    }
    
    function showAddAddressModal(userId) {
        if (typeof UI === 'undefined' || !UI.popup) {
            console.error('UI.popup not available');
            return;
        }
        
        var modalHtml = getAddAddressModalHtml();
        
        UI.popup({
            bgclose: false,
            class: 'popup-addressbook-outer',
            html: modalHtml,
            afterRender: function() {
                var popup = this;
                initializeAddAddressForm(popup, userId);
            }
        }).show();
    }
    
    function getAddAddressModalHtml() {
        // Build coin options
        var coinsSelect = '';
        for (var coin in Ccies) {
            var c = Ccies[coin];
            coinsSelect += '<option value="' + coin + '" data-icon="' + c.img + '">' + c.name + '</option>';
        }
        
        return `
            <div class="popup-content popup-full-mobile popup-addressbook-wrap">
                <form class="popup-addressbook-add" id="popup_addressbook_form">
                    <h3 class="center">Add receiving address</h3>
                    <div class="ln-field">
                        <label>Coin:</label>
                        <div>
                            <div class="ui-select-outer with-search" data-value="">
                                <select name="coin" id="address_coin_select">
                                    <option value="">Select coin</option>
                                    ${coinsSelect}
                                </select>
                            </div>
                            <div>
                                <label class="checkbox-tick">
                                    <input type="checkbox" name="universal" id="address_universal_checkbox"> 
                                    <span>Set as a universal address, without specific coins</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    <div class="ln-field">
                        <label>Network:</label>
                        <div>
                            <div class="ui-select-outer with-search" data-value="">
                                <select name="network" id="address_network_select" disabled="">
                                    <option value="">Select network</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="ln-field">
                        <label>Address:</label>
                        <div>
                            <div class="input-texttype with-pastebtn empty">
                                <input type="text" name="address" id="address_input" autocomplete="off" placeholder="Enter address here" disabled="">
                                <div class="ico input-texttype-paste"></div>
                                <div class="input-texttype-error"><i class="ico"></i></div>
                                <div class="input-texttype-errortxt"></div>
                            </div>
                        </div>
                    </div>
                    <div class="ln-field none" id="popup_addressbook_form_tag">
                        <label>MEMO/Destination tag:</label>
                        <div>
                            <div class="input-texttype with-pastebtn empty">
                                <input type="text" name="tag" id="tag_input" autocomplete="off" placeholder="Optional">
                                <div class="ico input-texttype-paste"></div>
                                <div class="input-texttype-error"><i class="ico"></i></div>
                                <div class="input-texttype-errortxt"></div>
                            </div>
                        </div>
                    </div>
                    <div class="ln-field ctrl center">
                        <div>
                            <button type="button" class="btn mini cancel popup-close-btn">Cancel</button>
                            <button type="button" class="btn mini" id="popup_addressbook_form_submit">Save</button>
                        </div>
                    </div>
                </form>
            </div>
        `;
    }
    
    function initializeAddAddressForm(popup, userId) {
        var form = document.getElementById('popup_addressbook_form');
        if (!form) return;
        
        var coinSelect = document.getElementById('address_coin_select');
        var networkSelect = document.getElementById('address_network_select');
        var addressInput = document.getElementById('address_input');
        var tagInput = document.getElementById('tag_input');
        var universalCheckbox = document.getElementById('address_universal_checkbox');
        var tagField = document.getElementById('popup_addressbook_form_tag');
        
        // Setup UI elements
        var tbAddress, tbTag, selectorCoin, selectorNetwork;
        
        // Initialize UI.textbox if available
        if (typeof UI !== 'undefined' && UI.textbox) {
            tbAddress = UI.textbox(addressInput, {btnPaste: true, addError: true})
                .input(function(input) {
                    if (typeof UI.func !== 'undefined') {
                        UI.func.remClass(input, 'error');
                    }
                });
            tbTag = UI.textbox(tagInput, {btnPaste: true, addError: true})
                .input(function(input) {
                    if (typeof UI.func !== 'undefined') {
                        UI.func.remClass(input, 'error');
                    }
                });
        }
        
        // Initialize UI.selector if available
        if (typeof UI !== 'undefined' && UI.selector) {
            // Get selector template if it exists
            var tmpl = '';
            var tmplElement = document.getElementById('selector_tmpl');
            if (tmplElement) {
                tmpl = tmplElement.innerHTML;
            }
            
            selectorCoin = UI.selector(coinSelect, {
                tmpl: tmpl,
                search: {placeholder: 'Search', label: 'Found'},
                emptyOption: 'Select coin'
            });
            
            selectorCoin.onChange(function(selected, from, param) {
                if (!selected.value) return;
                var nets = Ccies[selected.value].networks;
                selectorNetwork.rebuild(nets);
                selectorNetwork.disable(false);
                var arrnets = Object.values(nets);
                selectorNetwork.val(arrnets.length == 1 ? arrnets[0].value : '');
            });
            
            selectorNetwork = UI.selector(networkSelect, {
                tmpl: tmpl,
                search: {placeholder: 'Search', label: 'Found'},
                emptyOption: 'Select network'
            });
            
            selectorNetwork.onChange(function(selected, from, param) {
                if (!selected.value) {
                    if (typeof UI.func !== 'undefined') {
                        UI.func.addClass(tagField, 'none');
                    } else {
                        tagField.classList.add('none');
                    }
                    addressInput.disabled = true;
                    tagInput.value = '';
                    return;
                } else {
                    addressInput.disabled = false;
                }
                var coin = selectorCoin.val();
                var tag = coin ? Ccies[coin].networks[selected.value].tag : Networks[selected.value].tag;
                tagInput.value = '';
                if (typeof UI.func !== 'undefined') {
                    UI.func.togClass(tagField, 'none', !tag);
                } else {
                    if (tag) {
                        tagField.classList.remove('none');
                    } else {
                        tagField.classList.add('none');
                    }
                }
            });
        } else {
            // Fallback: Use native select change handlers
            coinSelect.addEventListener('change', function() {
                var selectedCoin = this.value;
                networkSelect.innerHTML = '<option value="">Select network</option>';
                
                if (selectedCoin && Ccies[selectedCoin]) {
                    var networks = Ccies[selectedCoin].networks;
                    for (var netKey in networks) {
                        var net = networks[netKey];
                        var option = document.createElement('option');
                        option.value = net.value;
                        option.textContent = net.label;
                        networkSelect.appendChild(option);
                    }
                    networkSelect.disabled = false;
                    
                    // Auto-select if only one network
                    var networkKeys = Object.keys(networks);
                    if (networkKeys.length === 1) {
                        networkSelect.value = networks[networkKeys[0]].value;
                        networkSelect.dispatchEvent(new Event('change'));
                    }
                } else {
                    networkSelect.disabled = true;
                    addressInput.disabled = true;
                }
            });
            
            networkSelect.addEventListener('change', function() {
                var selectedNetwork = this.value;
                
                if (!selectedNetwork) {
                    tagField.classList.add('none');
                    addressInput.disabled = true;
                    tagInput.value = '';
                    return;
                }
                
                addressInput.disabled = false;
                
                var coin = coinSelect.value;
                var tag = coin && Ccies[coin] ? 
                    (Ccies[coin].networks[selectedNetwork] ? Ccies[coin].networks[selectedNetwork].tag : '') : 
                    (Networks[selectedNetwork] ? Networks[selectedNetwork].tag : '');
                
                tagInput.value = '';
                if (tag) {
                    tagField.classList.remove('none');
                } else {
                    tagField.classList.add('none');
                }
            });
        }
        
        // Universal checkbox handler
        if (typeof UI !== 'undefined' && UI.func) {
            UI.func.bind(universalCheckbox, 'change', function() {
                if (this.checked) {
                    selectorCoin.disable(true);
                    selectorCoin.val('');
                    var currNetwork = selectorNetwork.val();
                    selectorNetwork.rebuild(Networks);
                    selectorNetwork.disable(false);
                    if (Networks[currNetwork]) {
                        selectorNetwork.val(currNetwork);
                    } else {
                        selectorNetwork.val('');
                    }
                } else {
                    selectorCoin.disable(false);
                    if (!selectorCoin.val()) {
                        selectorNetwork.disable(true);
                        selectorNetwork.val('');
                    } else {
                        selectorNetwork.disable(!selectorCoin.val());
                    }
                }
            });
        } else {
            universalCheckbox.addEventListener('change', function() {
                if (this.checked) {
                    coinSelect.disabled = true;
                    coinSelect.value = '';
                    
                    // Populate network select with all networks
                    networkSelect.innerHTML = '<option value="">Select network</option>';
                    for (var netKey in Networks) {
                        var net = Networks[netKey];
                        var option = document.createElement('option');
                        option.value = net.value;
                        option.textContent = net.label;
                        networkSelect.appendChild(option);
                    }
                    networkSelect.disabled = false;
                } else {
                    coinSelect.disabled = false;
                    if (!coinSelect.value) {
                        networkSelect.disabled = true;
                        networkSelect.value = '';
                        networkSelect.innerHTML = '<option value="">Select network</option>';
                    }
                }
            });
        }
        
        // Submit button handler
        var submitBtn = document.getElementById('popup_addressbook_form_submit');
        
        if (typeof UI !== 'undefined' && UI.button) {
            UI.button('popup_addressbook_form_submit').click(function(btn) {
                handleFormSubmit(btn);
            });
        } else {
            submitBtn.addEventListener('click', function() {
                handleFormSubmit({});
            });
        }
        
        function handleFormSubmit(btn) {
            var data = {
                coin: universalCheckbox.checked ? null : (selectorCoin ? selectorCoin.val() : coinSelect.value),
                network: selectorNetwork ? selectorNetwork.val() : networkSelect.value,
                address: addressInput.value.trim(),
                tag: tagInput.value.trim(),
                universal: universalCheckbox.checked,
                date_reg: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Validation
            if (!data.network) {
                if (tbAddress && tbAddress.error) {
                    tbAddress.error('Please select a network');
                } else {
                    alert('Please select a network');
                }
                if (btn.error) btn.error();
                return;
            }
            
            if (!data.address) {
                if (tbAddress && tbAddress.error) {
                    tbAddress.error('Please enter an address');
                } else {
                    alert('Please enter an address');
                }
                if (btn.error) btn.error();
                return;
            }
            
            if (!data.universal && !data.coin) {
                if (tbAddress && tbAddress.error) {
                    tbAddress.error('Please select a coin');
                } else {
                    alert('Please select a coin');
                }
                if (btn.error) btn.error();
                return;
            }
            
            if (btn.loading) btn.loading();
            
            // Save to Firestore
            db.collection('users').doc(userId).collection('addresses')
                .add(data)
                .then(function() {
                    console.log('Address saved successfully');
                    if (btn.success) btn.success();
                    populateAddressBook(userId);
                    popup.close();
                })
                .catch(function(error) {
                    console.error('Error saving address:', error);
                    if (btn.error) btn.error();
                    if (tbAddress && tbAddress.error) {
                        tbAddress.error('Error saving address: ' + error.message);
                    } else {
                        alert('Error saving address');
                    }
                });
        }
    }
    
    // ============================================
    // HELPER FUNCTIONS
    // ============================================
    function escapeHtml(text) {
        if (!text) return '';
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    function updatePaginationInfo(tableId, count) {
        // Update "showing X entries" text if it exists
        var lengthDiv = document.querySelector('#' + tableId + '_pages');
        if (lengthDiv && count > 0) {
            var countText = count === 1 ? '1 entry' : count + ' entries';
            // This could be enhanced to show "Showing X to Y of Z entries"
        }
    }
    
    // ============================================
    // REALTIME UPDATES (Optional)
    // ============================================
    function setupRealtimeUpdates(userId) {
        db.collection('users').doc(userId).collection('addresses')
            .orderBy('date_reg', 'desc')
            .onSnapshot(function(querySnapshot) {
                var addresses = [];
                querySnapshot.forEach(function(doc) {
                    var data = doc.data();
                    data.id = doc.id;
                    addresses.push(data);
                });
                console.log('Addresses updated:', addresses.length);
                renderAddresses(addresses);
            }, function(error) {
                console.error('Error in addresses listener:', error);
            });
    }
    
    // ============================================
    // INITIALIZE ON AUTH STATE CHANGE
    // ============================================
    auth.onAuthStateChanged(function(user) {
        if (user) {
            console.log('User authenticated, loading address book for:', user.email);
            
            // Wait for DOM to be ready
            var initInterval = setInterval(function() {
                var addressTable = document.querySelector('#addressbook');
                var addBtn = document.getElementById('user_addressbook_add');
                
                if (addressTable && addBtn) {
                    clearInterval(initInterval);
                    
                    // Load addresses
                    populateAddressBook(user.uid);
                    
                    // Setup delete handlers
                    setupDeleteHandlers(user.uid);
                    
                    // Setup add address modal
                    setupAddAddressModal(user.uid);
                    
                    // Optional: Setup realtime updates
                    // Uncomment the line below to enable realtime updates
                    // setupRealtimeUpdates(user.uid);
                    
                    console.log('Firebase address book integration initialized');
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
    
    } // End of initAddressBook function
    
})();