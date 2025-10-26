// Check if user is logged in
function isLoggedIn() {
    return !!getToken();
}

// Get current user from token
function getCurrentUser() {
    const token = getToken();
    if (!token) return null;
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload;
    } catch (e) {
        return null;
    }
}

// Update navigation based on auth status
function updateNavigation() {
    const authLinks = document.getElementById('authLinks');
    if (!authLinks) return;
    
    if (isLoggedIn()) {
        const user = getCurrentUser();
        authLinks.innerHTML = `
            <a href="pages/orders.html">Orders</a>
            <span style="color:#667eea;">Hello, ${user.name || 'User'}</span>
            <button class="btn btn-secondary" onclick="logout()">Logout</button>
        `;
    } else {
        authLinks.innerHTML = `
            <a href="pages/login.html">Login</a>
            <a href="pages/register.html" class="btn btn-primary">Sign Up</a>
        `;
    }
}

// Logout function
function logout() {
    removeToken();
    window.location.href = '/index.html';
}

// Protect page (redirect if not logged in)
function protectPage() {
    if (!isLoggedIn()) {
        window.location.href = '/pages/login.html';
    }
}

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', updateNavigation);
