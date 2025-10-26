// Update cart count
async function updateCartCount() {
    if (!isLoggedIn()) {
        const cartCountEl = document.getElementById('cartCount');
        if (cartCountEl) cartCountEl.textContent = '0';
        return;
    }
    
    try {
        const data = await apiCall('/cart');
        const count = data.data.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
        const cartCountEl = document.getElementById('cartCount');
        if (cartCountEl) cartCountEl.textContent = count;
    } catch (error) {
        console.error('Error updating cart count:', error);
    }
}

// Load featured products on home page
async function loadFeaturedProducts() {
    const container = document.getElementById('featuredProducts');
    if (!container) return;
    
    try {
        const data = await apiCall('/products?limit=8');
        
        if (data.data.length === 0) {
            container.innerHTML = '<p class="empty-state">No products available</p>';
            return;
        }
        
        container.innerHTML = data.data.map(product => `
            <a href="pages/product-detail.html?id=${product._id}" class="product-card">
                <div class="product-image">📦</div>
                <h3>${product.name}</h3>
                <p class="product-price">$${product.price.toFixed(2)}</p>
                <p class="${product.stock > 0 ? 'product-stock' : 'out-of-stock'}">
                    ${product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                </p>
            </a>
        `).join('');
    } catch (error) {
        container.innerHTML = `<p class="message-error">Error loading products: ${error.message}</p>`;
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    loadFeaturedProducts();
});
