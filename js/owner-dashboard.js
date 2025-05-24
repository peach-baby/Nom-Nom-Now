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
