// DOM Elements
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const closeButtons = document.querySelectorAll('.close');

// Show/Hide Modals
loginBtn.addEventListener('click', () => {
    loginModal.style.display = 'block';
});

registerBtn.addEventListener('click', () => {
    registerModal.style.display = 'block';
});

closeButtons.forEach(button => {
    button.addEventListener('click', () => {
        loginModal.style.display = 'none';
        registerModal.style.display = 'none';
    });
});

window.addEventListener('click', (e) => {
    if (e.target === loginModal) {
        loginModal.style.display = 'none';
    }
    if (e.target === registerModal) {
        registerModal.style.display = 'none';
    }
});

// Handle Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Store token and user info
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Update UI
            updateAuthUI(data.user);
            loginModal.style.display = 'none';
            showNotification('Login successful!', 'success');
            // Redirect based on role
            if (data.user.role === 'restaurant_owner') {
                window.location.href = '/owner-dashboard.html';
            } else if (data.user.role === 'customer') {
                window.location.href = '/customer-dashboard.html';
            }
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        showNotification('Error logging in', 'error');
    }
});

// Handle Registration
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const role = document.getElementById('userRole').value;

    try {
        const response = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password, role })
        });

        const data = await response.json();

        if (response.ok) {
            // Store token and user info
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Update UI
            updateAuthUI(data.user);
            registerModal.style.display = 'none';
            showNotification('Registration successful!', 'success');
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        showNotification('Error registering', 'error');
    }
});

// Google Login
document.querySelector('.btn-google').addEventListener('click', () => {
    window.location.href = 'http://localhost:5000/api/auth/google';
});

// Update UI based on authentication status
function updateAuthUI(user) {
    const authButtons = document.querySelector('.auth-buttons');
    const navLinks = document.querySelector('.nav-links');

    if (user) {
        authButtons.innerHTML = `
            <span>Welcome, ${user.name}</span>
            <button id="logoutBtn" class="btn">Logout</button>
        `;
        
        // Add role-specific links
        if (user.role === 'restaurant_owner') {
            navLinks.innerHTML += `
                <a href="#manage-restaurant">Manage Restaurant</a>
            `;
        }
        
        document.getElementById('logoutBtn').addEventListener('click', logout);
    } else {
        authButtons.innerHTML = `
            <button id="loginBtn" class="btn">Login</button>
            <button id="registerBtn" class="btn btn-primary">Register</button>
        `;
        // Re-attach event listeners for login/register buttons
        document.getElementById('loginBtn').addEventListener('click', () => {
            loginModal.style.display = 'block';
        });
        document.getElementById('registerBtn').addEventListener('click', () => {
            registerModal.style.display = 'block';
        });
    }
}

// Logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    updateAuthUI(null);
    showNotification('Logged out successfully', 'success');
}

// Show notification
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Check authentication status on page load
document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        updateAuthUI(user);
    }
}); 