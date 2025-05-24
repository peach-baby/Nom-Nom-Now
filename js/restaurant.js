function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

let cart = [];

document.addEventListener('DOMContentLoaded', async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const isCustomer = user && user.role === 'customer';

    const restaurantId = getQueryParam('id');
    if (!restaurantId) {
        document.getElementById('restaurantContainer').innerHTML = '<p>Restaurant not found.</p>';
        return;
    }
    try {
        const res = await fetch(`http://localhost:5000/api/restaurants/${restaurantId}`);
        if (!res.ok) {
            showNotification('Error fetching restaurant details', 'error');
            return;
        }
        const restaurant = await res.json();

        console.log('Fetched restaurant:', restaurant);

        // Render restaurant info and meals
        const container = document.getElementById('restaurantContainer');
        container.innerHTML = `
            <button class="btn btn-outline-danger mb-3" id="backBtn">
                &larr; Back to Browse Restaurants
            </button>
            <h1 class="text-danger mb-4">${restaurant.name}</h1>
            <p><strong>Cuisine:</strong> ${restaurant.cuisine}</p>
            <p>${restaurant.description}</p>
            <h3 class="mt-4">Menu</h3>
            <div id="mealList" class="row g-4"></div>
        `;

        const mealList = document.getElementById('mealList');
        if (!Array.isArray(restaurant.menu) || restaurant.menu.length === 0) {
            mealList.innerHTML = '<div class="alert alert-warning">No menu available for this restaurant.</div>';
        } else {
            mealList.innerHTML = restaurant.menu.map(item => `
                <div class="col-md-6 col-lg-4">
                    <div class="card shadow-sm h-100">
                        <div class="card-body">
                            <h5 class="card-title">${item.name}</h5>
                            <p class="card-text">${item.description || ''}</p>
                            <p class="card-text"><strong>Price:</strong> $${item.price}</p>
                            ${isCustomer ? `
                            <div class="input-group mb-2">
                                <input type="number" min="1" value="1" class="form-control quantity-input" id="qty-${item.id}">
                                <button class="btn btn-outline-danger add-to-cart-btn" data-id="${item.id}" data-name="${item.name}" data-price="${item.price}">Add to Cart</button>
                            </div>
                            ` : `<div class="text-muted">Login as a customer to order</div>`}
                        </div>
                    </div>
                </div>
            `).join('');
        }

        // Add to cart functionality only for customers
        if (isCustomer) {
            document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-id');
                    const name = btn.getAttribute('data-name');
                    const price = parseFloat(btn.getAttribute('data-price'));
                    const qty = parseInt(document.getElementById(`qty-${id}`).value) || 1;
                    addToCart({ id, name, price, quantity: qty });
                });
            });
        }

        renderCart(isCustomer);

        const backBtn = document.getElementById('backBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                window.location.href = '/customer-dashboard.html';
            });
        }
    } catch (error) {
        showNotification('Error fetching restaurant details', 'error');
    }
});

function addToCart(item) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const restaurantId = getQueryParam('id');
    item.restaurantId = restaurantId;

    const existing = cart.find(i => i.id === item.id && i.restaurantId === restaurantId);
    if (existing) {
        existing.quantity += item.quantity;
    } else {
        cart.push(item);
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart(true);
    if (typeof showNotification === 'function') {
        showNotification(`${item.name} added to cart`, 'success');
    }
}

function renderCart(isCustomer) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartDiv = document.getElementById('cart');
    if (!isCustomer) {
        cartDiv.innerHTML = '<em>Login as a customer to use the cart and checkout.</em>';
        document.getElementById('checkoutForm').style.display = 'none';
        return;
    }
    document.getElementById('checkoutForm').style.display = '';
    if (!cart.length) {
        cartDiv.innerHTML = '<em>Your cart is empty.</em>';
        return;
    }
    let total = 0;
    cartDiv.innerHTML = cart.map(item => {
        total += item.price * item.quantity;
        return `<div>
            <strong>${item.name}</strong> x ${item.quantity} = $${(item.price * item.quantity).toFixed(2)}
            <button class="btn btn-sm btn-outline-danger ms-2 remove-item" data-id="${item.id}">Remove</button>
        </div>`;
    }).join('') + `<hr><strong>Total: $${total.toFixed(2)}</strong>`;

    // Remove item functionality
    document.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            cart = cart.filter(i => i.id !== id);
            localStorage.setItem('cart', JSON.stringify(cart));
            renderCart(true);
        });
    });
}

// Handle checkout
document.addEventListener('submit', async (e) => {
    if (e.target.id === 'checkoutForm') {
        e.preventDefault();
        // Always read cart from localStorage
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        if (!cart.length) {
            alert('Your cart is empty!');
            return;
        }
        // Collect form data
        const name = document.getElementById('customerName').value;
        const address = document.getElementById('customerAddress').value;
        const phone = document.getElementById('customerPhone').value;
        const card = document.getElementById('cardNumber').value;
        // Here you would send the order to your backend
        alert(`Order placed!\nName: ${name}\nAddress: ${address}\nPhone: ${phone}\nTotal: $${cart.reduce((t, i) => t + i.price * i.quantity, 0).toFixed(2)}`);
        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCart(true);
        e.target.reset();
    }
});
