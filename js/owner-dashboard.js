document.addEventListener('DOMContentLoaded', () => {
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

    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'restaurant_owner') {
        window.location.href = '/';
        return;
    }
    fetchOwnerRestaurants();

    document.getElementById('addRestaurantForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('restaurantName').value;
        const cuisine = document.getElementById('restaurantCuisine').value;
        const description = document.getElementById('restaurantDescription').value;
        const token = localStorage.getItem('token');
        try {
            const response = await fetch('http://localhost:5000/api/restaurants', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name, cuisine, description })
            });
            if (response.ok) {
                fetchOwnerRestaurants();
                e.target.reset();
                alert('Restaurant added!');
            } else {
                const data = await response.json();
                alert(data.message || 'Error adding restaurant');
            }
        } catch (err) {
            alert('Error adding restaurant');
        }
    });

    // Profile section logic
    const profileSection = document.getElementById('profileSection');
    const profileLink = document.querySelector('.sidebar-link[href="#profile"], #profileLink');

    function showSection(section) {
        const ownerRestaurants = document.getElementById('ownerRestaurants');
        if (ownerRestaurants) ownerRestaurants.style.display = section === 'dashboard' ? '' : 'none';
        if (profileSection) profileSection.style.display = section === 'profile' ? '' : 'none';
        if (ordersSection) ordersSection.style.display = section === 'orders' ? '' : 'none';
    }

    if (profileLink) {
        profileLink.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('profile');
            // Pre-fill form
            const user = JSON.parse(localStorage.getItem('user'));
            document.getElementById('profileName').value = user.name;
            document.getElementById('profileEmail').value = user.email;
            document.getElementById('profilePassword').value = '';
            if (typeof closeSidebar === 'function') closeSidebar();
        });
    }

    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('profileName').value;
            const email = document.getElementById('profileEmail').value;
            const password = document.getElementById('profilePassword').value;
            const token = localStorage.getItem('token');
            try {
                const response = await fetch('http://localhost:5000/api/auth/profile', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ name, email, password })
                });
                const data = await response.json();
                if (response.ok) {
                    alert('Profile updated!');
                    localStorage.setItem('user', JSON.stringify(data.user));
                } else {
                    alert(data.message || 'Error updating profile');
                }
            } catch (err) {
                alert('Error updating profile');
            }
        });
    }

    const ordersSection = document.getElementById('ordersSection');
    const ordersList = document.getElementById('ordersList');
    const ordersLink = document.querySelector('.sidebar-link[href="#orders"], #ordersLink');

    // Sidebar click for Orders
    if (ordersLink) {
        ordersLink.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('orders');
            renderOwnerOrders();
            if (typeof closeSidebar === 'function') closeSidebar();
        });
    }
});

async function fetchOwnerRestaurants() {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:5000/api/restaurants', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const restaurants = await res.json();
    const placeholderImg = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80";

    const ownerRestaurants = restaurants.filter(r => r.owner_id === user.id);
    const container = document.getElementById('ownerRestaurants');
    container.innerHTML = ownerRestaurants.map(r => `
        <div class="col-md-6 col-lg-4">
            <div class="card shadow-sm h-100">
                <img src="${r.image || placeholderImg}" class="card-img-top" alt="Restaurant Image" style="height:200px;object-fit:cover;">
                <div class="card-body">
                    <h5 class="card-title">${r.name}</h5>
                    <p class="card-text"><strong>Cuisine:</strong> ${r.cuisine}</p>
                    <p class="card-text">${r.description}</p>
                    <form class="addMealForm mt-3" data-id="${r.id}">
                        <div class="input-group mb-2">
                            <input type="text" placeholder="Meal Name" name="mealName" class="form-control" required>
                            <input type="text" placeholder="Description" name="mealDescription" class="form-control">
                            <input type="number" placeholder="Price" name="mealPrice" class="form-control" required>
                            <button type="submit" class="btn btn-outline-danger">Add Meal</button>
                        </div>
                    </form>
                    <div class="mealList" id="meals-${r.id}"></div>
                </div>
            </div>
        </div>
    `).join('');

    // Attach event listeners for each meal form
    document.querySelectorAll('.addMealForm').forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const restaurantId = form.getAttribute('data-id');
            const mealName = form.mealName.value;
            const mealDescription = form.mealDescription.value;
            const mealPrice = form.mealPrice.value;
            try {
                const response = await fetch(`http://localhost:5000/api/restaurants/${restaurantId}/menu`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        name: mealName,
                        description: mealDescription,
                        price: mealPrice
                    })
                });
                if (response.ok) {
                    alert('Meal added!');
                    form.reset();
                    fetchMeals(restaurantId);
                } else {
                    const data = await response.json();
                    alert(data.message || 'Error adding meal');
                }
            } catch (err) {
                alert('Error adding meal');
            }
        });
    });

    // Fetch meals for each restaurant
    ownerRestaurants.forEach(r => fetchMeals(r.id));
}

async function fetchMeals(restaurantId) {
    const res = await fetch(`http://localhost:5000/api/restaurants/${restaurantId}`);
    const restaurant = await res.json();
    const mealList = document.getElementById(`meals-${restaurantId}`);
    if (restaurant.menu && restaurant.menu.length > 0) {
        mealList.innerHTML = '<h4>Meals:</h4>' + restaurant.menu.map(item => `
            <div>
                <strong>${item.name}</strong> - $${item.price} <br>
                <small>${item.description}</small>
            </div>
        `).join('');
    } else {
        mealList.innerHTML = '<em>No meals yet.</em>';
    }
}

// Fetch and render orders for the owner
async function renderOwnerOrders() {
    ordersList.innerHTML = '<em>Loading orders...</em>';
    const token = localStorage.getItem('token');
    try {
        const res = await fetch('http://localhost:5000/api/orders/restaurant', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const orders = await res.json();
        if (!orders.length) {
            ordersList.innerHTML = '<em>No upcoming orders.</em>';
            return;
        }

        // Group items by order ID
        const grouped = {};
        orders.forEach(order => {
            if (!grouped[order.id]) {
                grouped[order.id] = {
                    ...order,
                    items: []
                };
            }
            grouped[order.id].items.push({
                name: order.item_name,
                quantity: order.quantity,
                price: order.price
            });
        });

        ordersList.innerHTML = Object.values(grouped).map(order => `
            <div class="order-card mb-4 p-3 bg-white rounded shadow-sm border">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <span><strong>Order #${order.id}</strong></span>
                    <span class="badge bg-info">${order.status}</span>
                </div>
                <div><strong>Customer:</strong> ${order.customer_name} (${order.customer_email})</div>
                <div><strong>Address:</strong> ${order.delivery_address}</div>
                <div><strong>Date:</strong> ${order.created_at ? new Date(order.created_at).toLocaleString() : ''}</div>
                <div class="mt-2"><strong>Items:</strong>
                    <ul style="margin-bottom:0;">
                        ${order.items.map(item => `
                            <li>${item.name} x ${item.quantity} - $${Number(item.price).toFixed(2)}</li>
                        `).join('')}
                    </ul>
                </div>
                <div class="mt-2"><strong>Total:</strong> $${Number(order.total_amount).toFixed(2)}</div>
            </div>
        `).join('');
    } catch (err) {
        ordersList.innerHTML = '<em>Error loading orders.</em>';
    }
}
