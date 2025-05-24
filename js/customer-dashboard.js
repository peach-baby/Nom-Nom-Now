document.addEventListener('DOMContentLoaded', async () => {
    // Sidebar logic
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const openSidebarBtn = document.getElementById('openSidebar');
    const closeSidebarBtn = document.getElementById('closeSidebar');
    const logoutSidebar = document.getElementById('logoutSidebar');

    function openSidebar() {
        sidebar.classList.add('active');
        sidebarOverlay.classList.add('active');
    }
    function closeSidebar() {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
    }
    if (openSidebarBtn) openSidebarBtn.addEventListener('click', openSidebar);
    if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', closeSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

    if (logoutSidebar) {
        logoutSidebar.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
        });
    }

    // Section navigation logic
    const restaurantList = document.getElementById('restaurantList');
    const cartSection = document.getElementById('cartSection');
    const ordersSection = document.getElementById('ordersSection');
    const dashboardTitle = document.getElementById('dashboardTitle');
    const browseRestaurantsLink = document.getElementById('browseRestaurantsLink');
    const cartLink = document.getElementById('cartLink');
    const myOrdersLink = document.getElementById('myOrdersLink');

    function showSection(section) {
        restaurantList.style.display = section === 'restaurants' ? '' : 'none';
        cartSection.style.display = section === 'cart' ? '' : 'none';
        ordersSection.style.display = section === 'orders' ? '' : 'none';
        if (section === 'restaurants') dashboardTitle.textContent = 'Browse Restaurants';
        if (section === 'cart') dashboardTitle.textContent = 'Your Cart';
        if (section === 'orders') dashboardTitle.textContent = 'My Orders';
    }

    if (browseRestaurantsLink) browseRestaurantsLink.addEventListener('click', (e) => {
        e.preventDefault();
        showSection('restaurants');
        closeSidebar();
    });
    if (cartLink) cartLink.addEventListener('click', (e) => {
        e.preventDefault();
        renderCart();
        showSection('cart');
        closeSidebar();
    });
    if (myOrdersLink) myOrdersLink.addEventListener('click', (e) => {
        e.preventDefault();
        renderOrders();
        showSection('orders');
        closeSidebar();
    });

    // Render cart from localStorage
    function renderCart() {
        const cartItemsList = document.getElementById('cartItemsList');
        const cartTotalSection = document.getElementById('cartTotalSection');
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        if (!cart.length) {
            cartItemsList.innerHTML = '<em>Your cart is empty.</em>';
            cartTotalSection.innerHTML = '';
            return;
        }
        let total = 0;
        cartItemsList.innerHTML = cart.map(item => {
            total += item.price * item.quantity;
            return `<div class="mb-2"><strong>${item.name}</strong> x ${item.quantity} = $${(item.price * item.quantity).toFixed(2)}</div>`;
        }).join('');
        cartTotalSection.innerHTML = `<strong>Total: $${total.toFixed(2)}</strong>`;
    }

    // Render orders from backend
    function renderOrders() {
        const ordersList = document.getElementById('ordersList');
        ordersList.innerHTML = '<em>Loading your orders...</em>';
        const token = localStorage.getItem('token');
        fetch('http://localhost:5000/api/orders/customer', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(orders => {
            if (!orders || !orders.length) {
                ordersList.innerHTML = '<em>No orders placed yet.</em>';
                return;
            }
            // Order status icon and color
            function statusInfo(status) {
                switch ((status || '').toLowerCase()) {
                    case 'delivered': return { icon: 'fa-check-circle', color: 'success', label: 'Delivered' };
                    case 'preparing': return { icon: 'fa-utensils', color: 'info', label: 'Preparing' };
                    case 'delivering': return { icon: 'fa-truck', color: 'primary', label: 'Delivering' };
                    case 'cancelled': return { icon: 'fa-times-circle', color: 'danger', label: 'Cancelled' };
                    default: return { icon: 'fa-hourglass-half', color: 'warning', label: status || 'Pending' };
                }
            }
            // Summary
            let summary = `<div class='mb-4'><strong>You have ${orders.length} order${orders.length > 1 ? 's' : ''}.</strong></div>`;
            ordersList.innerHTML = summary + orders.map(order => {
                const status = statusInfo(order.status);
                return `
                    <div class="order-card mb-4 p-3 bg-white rounded shadow-sm border">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span><strong>Order #${order.id || order._id}</strong></span>
                            <span class="badge bg-${status.color} d-flex align-items-center" style="font-size:1rem;"><i class="fa ${status.icon} me-1"></i> ${status.label}</span>
                        </div>
                        <div><strong>Date:</strong> ${order.created_at ? new Date(order.created_at).toLocaleString() : ''}</div>
                        <div><strong>Delivery Address:</strong> ${order.deliveryAddress || order.delivery_address || ''}</div>
                        <div><strong>Payment:</strong> ${order.paymentMethod || order.payment_method || ''}</div>
                        <div class="mt-2"><strong>Items:</strong>
                            <ul style="margin-bottom:0;">
                                ${(order.items || order.orderItems || []).map(item => `
                                    <li>${item.name || item.menuItemName || 'Item'} x ${item.quantity} - $${item.price ? item.price.toFixed(2) : ''}</li>
                                `).join('')}
                            </ul>
                        </div>
                        <div class="mt-2"><strong>Total:</strong> $${order.totalAmount || order.total_amount || ''}</div>
                    </div>
                `;
            }).join('');
        })
        .catch(() => {
            ordersList.innerHTML = '<em>Error loading orders.</em>';
        });
    }

    // Add checkout button logic for cart section
    const checkoutBtn = document.getElementById('checkoutBtn');
    const dashboardCheckoutForm = document.getElementById('dashboardCheckoutForm');
    const cancelCheckoutBtn = document.getElementById('cancelCheckoutBtn');

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            let cart = JSON.parse(localStorage.getItem('cart')) || [];
            if (!cart.length) {
                alert('Your cart is empty!');
                return;
            }
            dashboardCheckoutForm.style.display = '';
            checkoutBtn.style.display = 'none';
        });
    }
    if (cancelCheckoutBtn) {
        cancelCheckoutBtn.addEventListener('click', () => {
            dashboardCheckoutForm.reset();
            dashboardCheckoutForm.style.display = 'none';
            checkoutBtn.style.display = '';
        });
    }
    if (dashboardCheckoutForm) {
        dashboardCheckoutForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            let cart = JSON.parse(localStorage.getItem('cart')) || [];
            if (!cart.length) {
                alert('Your cart is empty!');
                return;
            }
            const name = document.getElementById('checkoutName').value;
            const address = document.getElementById('checkoutAddress').value;
            const phone = document.getElementById('checkoutPhone').value;
            const card = document.getElementById('checkoutCard').value;
            const restaurantId = cart[0].restaurantId || cart[0].restaurant_id || cart[0].restaurant || null;
            if (!restaurantId) {
                alert('Restaurant ID missing from cart items.');
                return;
            }
            const items = cart.map(item => ({
                menuItemId: item.id,
                quantity: item.quantity
            }));
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:5000/api/orders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        restaurantId,
                        items,
                        deliveryAddress: address,
                        paymentMethod: 'online',
                        customerName: name,
                        customerPhone: phone,
                        cardNumber: card
                    })
                });
                const data = await response.json();
                if (response.ok) {
                    alert('Order placed successfully!');
                    localStorage.setItem('cart', JSON.stringify([]));
                    renderCart();
                    dashboardCheckoutForm.reset();
                    dashboardCheckoutForm.style.display = 'none';
                    checkoutBtn.style.display = '';
                } else {
                    alert(data.message || 'Error placing order');
                }
            } catch (err) {
                alert('Error placing order');
            }
        });
    }

    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'customer') {
        window.location.href = '/';
        return;
    }
    // By default, show restaurants
    showSection('restaurants');
    const res = await fetch('http://localhost:5000/api/restaurants');
    const restaurants = await res.json();
    const container = restaurantList;
    const placeholderImg = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80";

    container.innerHTML = restaurants.map(r => `
        <div class="col-md-6 col-lg-4">
            <div class="card shadow-sm h-100 restaurant-card" data-id="${r.id}" style="cursor:pointer;">
                <img src="${r.image || placeholderImg}" class="card-img-top" alt="Restaurant Image" style="height:200px;object-fit:cover;">
                <div class="card-body">
                    <h5 class="card-title">${r.name}</h5>
                    <span class="badge bg-danger mb-2">${r.cuisine || 'Cuisine'}</span>
                    <p class="card-text">${r.description}</p>
                </div>
            </div>
        </div>
    `).join('');

    // Add click event to each restaurant card
    document.querySelectorAll('.restaurant-card').forEach(card => {
        card.addEventListener('click', () => {
            const restaurantId = card.getAttribute('data-id');
            window.location.href = `/restaurant.html?id=${restaurantId}`;
        });
    });
});

// Show meals in a Bootstrap modal
function showMealsModal(restaurant) {
    const modalLabel = document.getElementById('mealsModalLabel');
    const modalBody = document.getElementById('mealsModalBody');
    modalLabel.textContent = `${restaurant.name} Menu`;

    if (restaurant.menu && restaurant.menu.length > 0) {
        modalBody.innerHTML = restaurant.menu.map(item => `
            <div class="mb-3">
                <strong>${item.name}</strong> - $${item.price} <br>
                <small>${item.description || ''}</small>
            </div>
        `).join('');
    }

    // Show the modal (Bootstrap 5)
    const modal = new bootstrap.Modal(document.getElementById('mealsModal'));
    modal.show();
}