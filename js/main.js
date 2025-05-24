// Toggle cart visibility
document.addEventListener('DOMContentLoaded', () => {
    const cart = document.getElementById('cart');
    const cartToggle = document.createElement('button');
    cartToggle.className = 'btn cart-toggle';
    cartToggle.innerHTML = '<i class="fas fa-shopping-cart"></i>';
    document.body.appendChild(cartToggle);

    cartToggle.addEventListener('click', () => {
        cart.classList.toggle('active');
    });

    // Close cart when clicking outside
    document.addEventListener('click', (e) => {
        if (!cart.contains(e.target) && !cartToggle.contains(e.target)) {
            cart.classList.remove('active');
        }
    });
});

// Handle navigation
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', (e) => {
        // Remove active class from all links
        document.querySelectorAll('.nav-links a').forEach(l => l.classList.remove('active'));
        // Add active class to clicked link
        e.target.classList.add('active');
    });
});

// Handle "Order Now" button in hero section
const orderNowBtn = document.querySelector('.hero .btn-large');
if (orderNowBtn) {
    orderNowBtn.addEventListener('click', () => {
        // Open the login modal
        const loginModal = document.getElementById('loginModal');
        if (loginModal) {
            loginModal.style.display = 'block';
        }
    });
} 