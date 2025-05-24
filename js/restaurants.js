// DOM Elements
const restaurantGrid = document.getElementById('restaurantGrid');
const restaurantModal = document.getElementById('restaurantModal');
const restaurantDetails = document.getElementById('restaurantDetails');

// Fetch and display restaurants
async function fetchRestaurants() {
    try {
        const response = await fetch('http://localhost:5000/api/restaurants');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const restaurants = await response.json();
        
        displayRestaurants(restaurants);
    } catch (error) {
        console.error('Error fetching restaurants:', error);
        showNotification('Error fetching restaurants: ' + error.message, 'error');
    }
}

// Display restaurants in grid
function displayRestaurants(restaurants) {
    restaurantGrid.innerHTML = '';
    
    restaurants.forEach(restaurant => {
        const card = document.createElement('div');
        card.className = 'restaurant-card';
        card.innerHTML = `
            <img src="${restaurant.image || 'https://via.placeholder.com/300x200'}" 
                 alt="${restaurant.name}" 
                 class="restaurant-image">
            <div class="restaurant-info">
                <h3>${restaurant.name}</h3>
                <div class="restaurant-rating">
                    ${generateStarRating(restaurant.rating || 0)}
                    <span>(${restaurant.review_count || 0} reviews)</span>
                </div>
                <p>${restaurant.cuisine || 'Cuisine not specified'}</p>
                <button class="btn btn-primary view-menu" data-id="${restaurant.id}">
                    View Menu
                </button>
            </div>
        `;
        
        restaurantGrid.appendChild(card);
    });

    // Add event listeners to view menu buttons
    document.querySelectorAll('.view-menu').forEach(button => {
        button.addEventListener('click', () => {
            const restaurantId = button.dataset.id;
            showRestaurantDetails(restaurantId);
        });
    });
}

// Generate star rating HTML
function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    return `
        ${'<i class="fas fa-star"></i>'.repeat(fullStars)}
        ${halfStar ? '<i class="fas fa-star-half-alt"></i>' : ''}
        ${'<i class="far fa-star"></i>'.repeat(emptyStars)}
    `;
}

// Show restaurant details and menu
async function showRestaurantDetails(restaurantId) {
    try {
        const response = await fetch(`http://localhost:5000/api/restaurants/${restaurantId}`);
        const restaurant = await response.json();
        
        restaurantDetails.innerHTML = `
            <h2>${restaurant.name}</h2>
            <div class="restaurant-rating">
                ${generateStarRating(restaurant.rating)}
                <span>(${restaurant.reviews?.length || 0} reviews)</span>
            </div>
            <p>${restaurant.description}</p>
            <div class="menu-section">
                <h3>Menu</h3>
                <div class="menu-grid">
                    ${restaurant.menu.map(item => `
                        <div class="menu-item">
                            <img src="${item.image || 'https://via.placeholder.com/150'}" 
                                 alt="${item.name}">
                            <h4>${item.name}</h4>
                            <p>${item.description}</p>
                            <p class="price">$${item.price.toFixed(2)}</p>
                            ${item.available ? `
                                <button class="btn btn-primary add-to-cart" 
                                        data-id="${item._id}"
                                        data-name="${item.name}"
                                        data-price="${item.price}">
                                    Add to Cart
                                </button>
                            ` : '<span class="unavailable">Currently Unavailable</span>'}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        restaurantModal.style.display = 'block';
        
        // Add event listeners to add to cart buttons
        document.querySelectorAll('.add-to-cart').forEach(button => {
            button.addEventListener('click', () => {
                const item = {
                    id: button.dataset.id,
                    name: button.dataset.name,
                    price: parseFloat(button.dataset.price),
                    quantity: 1
                };
                addToCart(item);
            });
        });
    } catch (error) {
        showNotification('Error fetching restaurant details', 'error');
    }
}

// Add to cart functionality
function addToCart(item) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push(item);
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
    showNotification(`${item.name} added to cart`, 'success');
}

// Update cart UI
function updateCartUI() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div>
                <h4>${item.name}</h4>
                <p>$${item.price.toFixed(2)} x ${item.quantity}</p>
            </div>
            <div>
                <button class="btn btn-small remove-item" data-id="${item.id}">Remove</button>
            </div>
        </div>
    `).join('');
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = total.toFixed(2);
    
    // Add event listeners to remove buttons
    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', () => {
            const itemId = button.dataset.id;
            removeFromCart(itemId);
        });
    });
}

// Remove from cart
function removeFromCart(itemId) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart = cart.filter(item => item.id !== itemId);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchRestaurants();
    updateCartUI();
}); 