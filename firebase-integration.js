// Firebase Integration Script
// Enhanced version with form integration

var firebaseConfig = {
	apiKey: "AIzaSyAhu1CM7JL9S-c_7ek0fLayjOZ0xakIxgA",
	authDomain: "voicemail-37c23.firebaseapp.com",
	projectId: "voicemail-37c23",
	storageBucket: "voicemail-37c23.firebasestorage.app",
	messagingSenderId: "788357276498",
	appId: "1:788357276498:web:1266946350b5774acb508b",
	measurementId: "G-KW0BJWCK1K"
};

firebase.initializeApp(firebaseConfig);
var auth = firebase.auth();
var database = firebase.database();

var currentUser = null;

// ============================================
// AUTHENTICATION STATE MONITORING
// ============================================

auth.onAuthStateChanged(function(user) {
	if (user) {
		currentUser = user;
		updateUIForLoggedInUser(user);
		loadUserOrders(user.uid);
	} else {
		currentUser = null;
		updateUIForLoggedOutUser();
	}
});

// ============================================
// DATABASE FUNCTIONS
// ============================================

function createExchangeOrder(orderData, callback) {
	if (!currentUser) {
		callback({ success: false, error: 'User not authenticated' });
		return;
	}

	var ordersRef = database.ref('orders');
	var newOrderRef = ordersRef.push();
	
	var order = {
		userId: currentUser.uid,
		userEmail: currentUser.email,
		fromCurrency: orderData.fromCurrency,
		toCurrency: orderData.toCurrency,
		fromAmount: parseFloat(orderData.fromAmount),
		toAmount: parseFloat(orderData.toAmount),
		walletAddress: orderData.walletAddress,
		extraId: orderData.extraId || '',
		orderType: orderData.orderType || 'float',
		status: 'pending',
		createdAt: firebase.database.ServerValue.TIMESTAMP,
		updatedAt: firebase.database.ServerValue.TIMESTAMP
	};

	newOrderRef.set(order)
		.then(function() {
			console.log('Order created:', newOrderRef.key);
			callback({ success: true, orderId: newOrderRef.key });
		})
		.catch(function(error) {
			console.error('Error creating order:', error);
			callback({ success: false, error: error.message });
		});
}

function loadUserOrders(userId) {
	var ordersRef = database.ref('orders');
	var userOrdersQuery = ordersRef.orderByChild('userId').equalTo(userId);
	
	userOrdersQuery.on('value', function(snapshot) {
		var orders = [];
		snapshot.forEach(function(childSnapshot) {
			orders.push({
				id: childSnapshot.key,
				data: childSnapshot.val()
			});
		});
		
		displayUserOrders(orders);
	});
}

function saveRecentTransaction(transactionData, callback) {
	var recentRef = database.ref('recentTransactions');
	var newTransactionRef = recentRef.push();
	
	var transaction = {
		fromCurrency: transactionData.fromCurrency,
		toCurrency: transactionData.toCurrency,
		fromAmount: parseFloat(transactionData.fromAmount),
		toAmount: parseFloat(transactionData.toAmount),
		duration: transactionData.duration || 0,
		createdAt: firebase.database.ServerValue.TIMESTAMP
	};

	newTransactionRef.set(transaction)
		.then(function() {
			if (callback) callback({ success: true });
		})
		.catch(function(error) {
			console.error('Error saving recent transaction:', error);
			if (callback) callback({ success: false, error: error.message });
		});
}

function loadRecentTransactions() {
	var recentRef = database.ref('recentTransactions');
	var recentQuery = recentRef.orderByChild('createdAt').limitToLast(10);
	
	recentQuery.on('value', function(snapshot) {
		var transactions = [];
		snapshot.forEach(function(childSnapshot) {
			transactions.unshift({
				id: childSnapshot.key,
				data: childSnapshot.val()
			});
		});
		
		displayRecentTransactions(transactions);
	});
}

// ============================================
// UI UPDATE FUNCTIONS
// ============================================

function updateUIForLoggedInUser(user) {
    console.log('Updating UI for:', user.email);
    
    // Find the userbar container that has signin/signup buttons
    var userbarContainer = document.querySelector('.nav-right .nav.userbar');
    
    if (!userbarContainer) {
        console.error('Userbar container not found');
        return;
    }
    
    console.log('Found userbar container:', userbarContainer);
    
    // Check if it already has the account dropdown (has menu-focus-btn)
    if (userbarContainer.querySelector('.menu-focus-btn')) {
        console.log('Account dropdown already exists');
        return;
    }
    
    // Replace the entire userbar content with the account dropdown
    userbarContainer.innerHTML = 
        '<a class="menu-focus-btn" tabindex="0">Account</a>' +
        '<ul class="menu-focus-opened hoverhl">' +
            '<li><a href="personal_data.html"><i class="ico profile"></i><span>Personal data</span></a></li>' +
            '<li><a href="orders.html"><i class="ico history"></i><span>Orders history</span></a></li>' +
            '<li><a href="address.html"><i class="ico addressbook"></i><span>Address book</span></a></li>' +
            '<li><a href="affiliate.html"><i class="ico affiliate"></i><span>Affiliate program</span></a></li>' +
            '<li><a href="payouts.html"><i class="ico payout"></i><span>Payouts</span></a></li>' +
            '<li><a href="api_management.html"><i class="ico apikey"></i><span>API management</span></a></li>' +
            '<li><a href="#" class="signout" onclick="handleSignOut(); return false;"><i class="ico signout"></i><span>Sign out</span></a></li>' +
        '</ul>';
    
    console.log('UI updated successfully');
}


function createAffiliateProfile(user)
{
	var db = firebase.firestore();
	var affiliateRef = db.collection('affiliates').doc(user.uid);
	
	affiliateRef.get().then((doc) => {
		if (!doc.exists) {
			affiliateRef.set({
				email: user.email,
				createdAt: firebase.firestore.FieldValue.serverTimestamp(),
				availableBalance: 0,
				pendingWithdrawals: 0,
				minPayoutAmount: 0.001
			}).then(() => {
				console.log('Affiliate profile created for', user.email);
			}).catch((error) => {
				console.error('Error creating affiliate profile:', error);
			});
		} else {
			console.log('Affiliate profile already exists for', user.email);
		}
	}).catch((error) => {
		console.error('Error checking affiliate profile:', error);
	});
}
function handleSignOut() {
    if (!confirm('Are you sure?')) return;
    
    firebase.auth().signOut()
        .then(function() {
            console.log('User signed out');
            window.location.reload();
        })
        .catch(function(error) {
            console.error('Sign out error:', error);
        });
}


function updateUIForLoggedOutUser() {
	var userbarElement = document.querySelector('.nav.userbar');
	if (userbarElement) {
		// Check if there are existing sign in/sign up links
		var existingSignIn = document.getElementById('header_signin');
		if (!existingSignIn) {
			userbarElement.innerHTML = 
				'<a id="header_signin" class="btn-text" href="/user/signin">Sign in</a>' +
				'<a id="header_signup" class="btn" href="/user/signup">Sign up</a>';
		}
	}
	
	// Hide user's orders section
	var ordersSection = document.getElementById('user_orders_section');
	if (ordersSection) {
		ordersSection.style.display = 'none';
	}
}

function displayUserOrders(orders) {
	var ordersContainer = document.getElementById('user_orders_list');
	if (!ordersContainer) return;
	
	if (orders.length === 0) {
		ordersContainer.innerHTML = '<p style="text-align:center; padding:20px;">No orders yet</p>';
		return;
	}
	
	var html = '';
	for (var i = 0; i < orders.length; i++) {
		var order = orders[i].data;
		var orderDate = order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A';
		
		html += '<div class="order-item">' +
					'<div class="order-detail">' +
						'<strong>From:</strong> ' + order.fromAmount + ' ' + order.fromCurrency +
					'</div>' +
					'<div class="order-detail">' +
						'<strong>To:</strong> ' + order.toAmount + ' ' + order.toCurrency +
					'</div>' +
					'<div class="order-detail">' +
						'<strong>Wallet:</strong> ' + order.walletAddress.substring(0, 20) + '...' +
					'</div>' +
					'<div class="order-detail">' +
						'<strong>Type:</strong> ' + order.orderType +
					'</div>' +
					'<div class="order-detail">' +
						'<strong>Status:</strong> <span class="status-' + order.status + '">' + order.status + '</span>' +
					'</div>' +
					'<div class="order-detail">' +
						'<strong>Date:</strong> ' + orderDate +
					'</div>' +
				'</div>';
	}
	
	ordersContainer.innerHTML = html;
}

function displayRecentTransactions(transactions) {
	var recentList = document.getElementById('recent_list');
	if (!recentList) return;
	
	var html = '';
	for (var i = 0; i < transactions.length && i < 10; i++) {
		var tx = transactions[i].data;
		var txTime = tx.createdAt ? new Date(tx.createdAt).toLocaleTimeString() : 'Just now';
		
		html += '<li>' +
					'<div class="recent-time">' +
						'<time>' + txTime + '</time>' +
					'</div>' +
					'<div class="dir-from">' +
						'<div class="coin-value">' + tx.fromAmount + ' ' + tx.fromCurrency + '</div>' +
					'</div>' +
					'<div class="dir-arrow">' +
						'<span class="ico arrow"></span>' +
					'</div>' +
					'<div class="dir-to">' +
						'<div class="coin-value">' + tx.toCurrency + '</div>' +
					'</div>' +
					'<div class="recent-howlong">' +
						'<i class="ico timer"></i><span>' + (tx.duration || 0) + ' min</span>' +
					'</div>' +
				'</li>';
	}
	
	recentList.innerHTML = html;
}

// ============================================
// EVENT HANDLERS
// ============================================

function handleExchangeSubmit() {
	if (!currentUser) {
		alert('Please sign in to create an exchange');
		// Try to open the signin modal/page
		var signinLink = document.getElementById('header_signin');
		if (signinLink) {
			signinLink.click();
		}
		return;
	}
	
	var fromCurrency = document.getElementById('select_currency_from') ? document.getElementById('select_currency_from').value : '';
	var toCurrency = document.getElementById('select_currency_to') ? document.getElementById('select_currency_to').value : '';
	var fromAmount = document.getElementById('select_amount_from') ? document.getElementById('select_amount_from').value : '';
	var toAmount = document.getElementById('select_amount_to') ? document.getElementById('select_amount_to').value : '';
	var walletAddress = document.getElementById('receive_wallet') ? document.getElementById('receive_wallet').value : '';
	var extraId = document.getElementById('receive_extraid') ? document.getElementById('receive_extraid').value : '';
	var orderTypeElement = document.querySelector('input[name="select_type_from"]:checked');
	var orderType = orderTypeElement ? orderTypeElement.value : 'float';
	
	if (!fromAmount || !walletAddress) {
		alert('Please fill in all required fields');
		return;
	}
	
	var orderData = {
		fromCurrency: fromCurrency,
		toCurrency: toCurrency,
		fromAmount: fromAmount,
		toAmount: toAmount,
		walletAddress: walletAddress,
		extraId: extraId,
		orderType: orderType
	};
	
	createExchangeOrder(orderData, function(result) {
		if (result.success) {
			alert('Exchange order created successfully!');
			
			// Clear form
			if (document.getElementById('select_amount_from')) document.getElementById('select_amount_from').value = '';
			if (document.getElementById('select_amount_to')) document.getElementById('select_amount_to').value = '';
			if (document.getElementById('receive_wallet')) document.getElementById('receive_wallet').value = '';
			if (document.getElementById('receive_extraid')) document.getElementById('receive_extraid').value = '';
			
			// Save to recent transactions
			saveRecentTransaction({
				fromCurrency: fromCurrency,
				toCurrency: toCurrency,
				fromAmount: fromAmount,
				toAmount: toAmount,
				duration: Math.floor(Math.random() * 20) + 1
			});
		} else {
			alert('Error creating order: ' + result.error);
		}
	});
}


// ============================================
// INITIALIZE ON PAGE LOAD
// ============================================

document.addEventListener('DOMContentLoaded', function() {
	// Exchange submit is handled by exchange.min.js + APP.api intercept (no sign-in required)
	
	// Load recent transactions
	loadRecentTransactions();
	
	// Calculate exchange amounts
	var fromAmountInput = document.getElementById('select_amount_from');
	if (fromAmountInput) {
		fromAmountInput.addEventListener('input', function() {
			var amount = parseFloat(this.value) || 0;
			var rate = 0.98; // Mock exchange rate with 2% fee
			var toAmountInput = document.getElementById('select_amount_to');
			if (toAmountInput) {
				toAmountInput.value = (amount * rate).toFixed(8);
			}
		});
	}
});

// ============================================
// STYLES
// ============================================

var styles = document.createElement('style');
styles.textContent = 
	'#user_orders_section {' +
		'margin: 30px auto;' +
		'max-width: 1200px;' +
		'padding: 20px;' +
		'background: white;' +
		'border-radius: 10px;' +
		'display: none;' +
	'}' +
	'.order-item {' +
		'background: #f5f5f5;' +
		'padding: 15px;' +
		'margin: 10px 0;' +
		'border-radius: 5px;' +
		'display: grid;' +
		'grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));' +
		'gap: 15px;' +
	'}' +
	'.order-detail {' +
		'font-size: 14px;' +
	'}' +
	'.status-pending {' +
		'color: #ff9800;' +
		'font-weight: bold;' +
	'}' +
	'.status-completed {' +
		'color: #4caf50;' +
		'font-weight: bold;' +
	'}' +
	'.status-cancelled {' +
		'color: #f44336;' +
		'font-weight: bold;' +
	'}';
document.head.appendChild(styles);
