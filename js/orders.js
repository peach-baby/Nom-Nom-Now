// DOM Elements
const checkoutBtn = document.getElementById('checkoutBtn');

// Handle checkout
checkoutBtn.addEventListener('click', async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        showNotification('Please login to place an order', 'error');
        return;
    }

    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) {
        showNotification('Your cart is empty', 'error');
        return;
    }

    // Get delivery address
    const address = prompt('Please enter your delivery address:');
    if (!address) return;

    try {
        const response = await fetch('http://localhost:5000/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                restaurantId: cart[0].restaurantId, // Assuming all items are from the same restaurant
                items: cart.map(item => ({
                    menuItemId: item.id,
                    quantity: item.quantity
                })),
                deliveryAddress: address,
                paymentMethod: 'online' // Default payment method
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Clear cart
            localStorage.removeItem('cart');
            updateCartUI();
            
            showNotification('Order placed successfully!', 'success');
            // Redirect to order tracking page
            window.location.href = `#orders/${data._id}`;
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        showNotification('Error placing order', 'error');
    }
});

// Fetch and display orders
async function fetchOrders() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    try {
        const response = await fetch('http://localhost:5000/api/orders/customer', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const orders = await response.json();
        displayOrders(orders);
    } catch (error) {
        showNotification('Error fetching orders', 'error');
    }
}

// Display orders
function displayOrders(orders) {
    const ordersSection = document.createElement('section');
    ordersSection.id = 'orders';
    ordersSection.className = 'orders';
    
    ordersSection.innerHTML = `
        <h2>My Orders</h2>
        <div class="orders-grid">
            ${orders.map(order => `
                <div class="order-card">
                    <div class="order-header">
                        <h3>Order #${order._id.slice(-6)}</h3>
                        <span class="order-status ${order.status}">${order.status}</span>
                    </div>
                    <div class="order-details">
                        <p>Restaurant: ${order.restaurant.name}</p>
                        <p>Total: $${order.totalAmount.toFixed(2)}</p>
                        <p>Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div class="order-items">
                        ${order.items.map(item => `
                            <div class="order-item">
                                <span>${item.menuItem.name}</span>
                                <span>x${item.quantity}</span>
                                <span>$${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        `).join('')}
                    </div>
                    ${order.status === 'pending' ? `
                        <button class="btn btn-danger cancel-order" data-id="${order._id}">
                            Cancel Order
                        </button>
                    ` : ''}
                </div>
            `).join('')}
        </div>
    `;
    
    document.body.appendChild(ordersSection);

    // Add event listeners to cancel buttons
    document.querySelectorAll('.cancel-order').forEach(button => {
        button.addEventListener('click', () => {
            const orderId = button.dataset.id;
            cancelOrder(orderId);
        });
    });
}

// Cancel order
async function cancelOrder(orderId) {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    try {
        const response = await fetch(`http://localhost:5000/api/orders/${orderId}/cancel`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('Order cancelled successfully', 'success');
            fetchOrders(); // Refresh orders
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        showNotification('Error cancelling order', 'error');
    }
}

// Initialize orders section when orders link is clicked
document.querySelector('a[href="#orders"]').addEventListener('click', (e) => {
    e.preventDefault();
    fetchOrders();
}); 