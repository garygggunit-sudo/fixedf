// Firebase Orders Integration
// This script populates order history from Firebase Firestore

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
    var db = firebase.firestore();
    
    // ============================================
    // ORDER DATA STRUCTURE
    // ============================================
    /*
    Expected Firestore structure:
    
    users/{userId}/orders/{orderId}
    {
        id: "ABCD1234",
        reg: timestamp,
        fromCurrency: "BTC",
        fromCoin: "BTC",
        fromNetwork: "BTC",
        fromQty: "0.05",
        toCurrency: "ETH",
        toCoin: "ETH",
        toNetwork: "ETH",
        toQty: "1.234",
        toAddress: "0x1234567890abcdef...",
        status: 4, // 0=New, 1=Pending, 2=Exchange, 3=Withdraw, 4=Completed, 7=Emergency
        type: "float" // or "fixed"
    }
    */
    
    // ============================================
    // POPULATE ACTIVE ORDERS
    // ============================================
    function populateActiveOrders(userId) {
        console.log('Loading active orders for user:', userId);
        
        // Query active orders (status 0,1,2,3,7)
        db.collection('users').doc(userId).collection('orders')
            .where('status', 'in', [0, 1, 2, 3, 7])
            .orderBy('reg', 'desc')
            .get()
            .then(function(querySnapshot) {
                var orders = [];
                querySnapshot.forEach(function(doc) {
                    orders.push(doc.data());
                });
                
                console.log('Active orders loaded:', orders.length);
                renderActiveOrders(orders);
            })
            .catch(function(error) {
                console.error('Error loading active orders:', error);
            });
    }
    
    // ============================================
    // POPULATE COMPLETED ORDERS
    // ============================================
    function populateCompletedOrders(userId) {
        console.log('Loading completed orders for user:', userId);
        
        // Query completed orders (status 4)
        db.collection('users').doc(userId).collection('orders')
            .where('status', '==', 4)
            .orderBy('reg', 'desc')
            .get()
            .then(function(querySnapshot) {
                var orders = [];
                querySnapshot.forEach(function(doc) {
                    orders.push(doc.data());
                });
                
                console.log('Completed orders loaded:', orders.length);
                renderCompletedOrders(orders);
            })
            .catch(function(error) {
                console.error('Error loading completed orders:', error);
            });
    }
    
    // ============================================
    // RENDER ACTIVE ORDERS
    // ============================================
    function renderActiveOrders(orders) {
        var tbody = document.querySelector('#orders_active tbody');
        if (!tbody) {
            console.warn('Active orders table body not found');
            return;
        }
        
        // Clear existing rows
        tbody.innerHTML = '';
        
        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2em;">No active orders</td></tr>';
            return;
        }
        
        // Status mapping
        var statusMap = {
            0: 'New',
            1: 'Pending',
            2: 'Exchange',
            3: 'Withdraw',
            7: 'Emergency'
        };
        
        orders.forEach(function(order) {
            var row = document.createElement('tr');
            
            // Format registration time
            var regTime = '';
            if (order.reg) {
                var regDate = order.reg.toDate ? order.reg.toDate() : new Date(order.reg);
                if (typeof moment !== 'undefined') {
                    regTime = moment(regDate).format('HH:mm');
                } else {
                    regTime = regDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                }
            }
            
            // Format quantities
            var fromQty = formatNumber(order.fromQty);
            var toQty = formatNumber(order.toQty);
            
            row.innerHTML = `
                <td><div class="ztp-c mh" data-type="id">${escapeHtml(order.id)}</div></td>
                <td><div class="ztp-c mh" data-type="reg">${regTime}</div></td>
                <td><div class="ztp-c mh" data-type="fromQty">
                    <span class="ib-middle coin-img svgcoin ${order.fromCurrency.toLowerCase()}"></span> 
                    <span class="ib-middle">${fromQty} ${escapeHtml(order.fromCurrency)}</span>
                </div></td>
                <td><div class="ztp-c mh" data-type="toQty">
                    <span class="ib-middle coin-img svgcoin ${order.toCurrency.toLowerCase()}"></span> 
                    <span class="ib-middle">${toQty} ${escapeHtml(order.toCurrency)}</span>
                </div></td>
                <td><div class="ztp-c mh" data-type="status" data-value="${order.status}">${statusMap[order.status] || 'Unknown'}</div></td>
            `;
            
            tbody.appendChild(row);
        });
        
        // Update pagination info if available
        updatePaginationInfo('orders_active', orders.length);
    }
    
    // ============================================
    // RENDER COMPLETED ORDERS
    // ============================================
    function renderCompletedOrders(orders) {
        var tbody = document.querySelector('#orders tbody');
        if (!tbody) {
            console.warn('Completed orders table body not found');
            return;
        }
        
        // Clear existing rows
        tbody.innerHTML = '';
        
        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2em;">No completed orders</td></tr>';
            return;
        }
        
        orders.forEach(function(order) {
            var row = document.createElement('tr');
            
            // Format registration date
            var regDate = '';
            if (order.reg) {
                var regDateTime = order.reg.toDate ? order.reg.toDate() : new Date(order.reg);
                if (typeof moment !== 'undefined') {
                    regDate = moment(regDateTime).format('L');
                } else {
                    regDate = regDateTime.toLocaleDateString();
                }
            }
            
            // Format quantities
            var fromQty = formatNumber(order.fromQty);
            var toQty = formatNumber(order.toQty);
            
            // Check if network should be shown
            var fromShowNetwork = order.fromCoin !== order.fromNetwork;
            var toShowNetwork = order.toCoin !== order.toNetwork;
            
            var fromNetworkHtml = fromShowNetwork ? `<sup>${escapeHtml(order.fromNetwork)}</sup>` : '';
            var toNetworkHtml = toShowNetwork ? `<sup>${escapeHtml(order.toNetwork)}</sup>` : '';
            
            row.innerHTML = `
                <td><div class="ztp-c mh" data-type="reg">
                    ${regDate}<br>
                    <a href="/order/${escapeHtml(order.id)}" target="_blank">${escapeHtml(order.id)}</a>
                </div></td>
                <td><div class="ztp-c mh" data-type="fromQty">
                    <span class="ib-middle coin-img svgcoin ${order.fromCurrency.toLowerCase()}"></span> 
                    <span class="ib-middle">${fromQty} ${escapeHtml(order.fromCoin)}${fromNetworkHtml}</span>
                </div></td>
                <td><div class="ztp-c mh" data-type="toQty">
                    <span class="ib-middle coin-img svgcoin ${order.toCurrency.toLowerCase()}"></span> 
                    <span class="ib-middle">${toQty} ${escapeHtml(order.toCoin)}${toNetworkHtml}</span>
                </div></td>
                <td><div class="ztp-c mh breakall" data-type="toAddress">${escapeHtml(order.toAddress)}</div></td>
            `;
            
            tbody.appendChild(row);
        });
        
        // Update pagination info if available
        updatePaginationInfo('orders', orders.length);
    }
    
    // ============================================
    // HELPER FUNCTIONS
    // ============================================
    
    function formatNumber(num) {
        if (!num) return '0';
        var number = parseFloat(num);
        if (isNaN(number)) return '0';
        
        // Remove trailing zeros
        return number.toString().replace(/\.?0+$/, '');
    }
    
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
        // Listen for active orders changes
        db.collection('users').doc(userId).collection('orders')
            .where('status', 'in', [0, 1, 2, 3, 7])
            .orderBy('reg', 'desc')
            .onSnapshot(function(querySnapshot) {
                var orders = [];
                querySnapshot.forEach(function(doc) {
                    orders.push(doc.data());
                });
                console.log('Active orders updated:', orders.length);
                renderActiveOrders(orders);
            }, function(error) {
                console.error('Error in active orders listener:', error);
            });
        
        // Listen for completed orders changes
        db.collection('users').doc(userId).collection('orders')
            .where('status', '==', 4)
            .orderBy('reg', 'desc')
            .onSnapshot(function(querySnapshot) {
                var orders = [];
                querySnapshot.forEach(function(doc) {
                    orders.push(doc.data());
                });
                console.log('Completed orders updated:', orders.length);
                renderCompletedOrders(orders);
            }, function(error) {
                console.error('Error in completed orders listener:', error);
            });
    }
    
    // ============================================
    // INITIALIZE ON AUTH STATE CHANGE
    // ============================================
    auth.onAuthStateChanged(function(user) {
        if (user) {
            console.log('User authenticated, loading orders for:', user.email);
            
            // Wait for DOM to be ready
            var initInterval = setInterval(function() {
                var activeTable = document.querySelector('#orders_active');
                var completedTable = document.querySelector('#orders');
                
                if (activeTable && completedTable) {
                    clearInterval(initInterval);
                    
                    // Load orders
                    populateActiveOrders(user.uid);
                    populateCompletedOrders(user.uid);
                    
                    // Optional: Setup realtime updates
                    // Uncomment the line below to enable realtime updates
                    // setupRealtimeUpdates(user.uid);
                    
                    console.log('Firebase orders integration initialized');
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
