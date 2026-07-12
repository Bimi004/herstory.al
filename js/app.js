// Ruajtja e gjendjes së shportës dhe produkteve
let products = [];
let cart = [];

// 1. Shkarkimi i produkteve nga Supabase
async function fetchProducts() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*');

        if (error) throw error;
        
        products = data;
        renderProducts(products);
    } catch (error) {
        console.error("Gabim gjatë marrjes së produkteve:", error.message);
    }
}

// 2. Shfaqja e produkteve në HTML
function renderProducts(productsToDisplay) {
    const grid = document.getElementById('client-products-grid');
    if (!grid) return;
    
    grid.innerHTML = '';

    if (productsToDisplay.length === 0) {
        grid.innerHTML = `<p class="col-span-full text-center text-gray-500 py-8">Nuk u gjet asnjë produkt.</p>`;
        return;
    }

    productsToDisplay.forEach(product => {
        grid.innerHTML += `
            <div class="bg-white rounded-2xl overflow-hidden border border-herstory-border group hover:shadow-xl transition-all duration-300 flex flex-col h-full">
                <div class="relative aspect-square bg-herstory-light overflow-hidden">
                    <img src="${product.image_url || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400'}" 
                         alt="${product.name}" 
                         class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                    <span class="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-[10px] font-bold uppercase tracking-widest text-herstory-dark px-2.5 py-1 rounded-full border border-herstory-border">
                        ${product.category}
                    </span>
                </div>
                <div class="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-4">
                    <div class="flex flex-col gap-1">
                        <h3 class="font-serif font-bold text-base sm:text-lg tracking-tight text-herstory-dark group-hover:text-herstory-rose transition-colors line-clamp-1">${product.name}</h3>
                        <p class="text-xs text-herstory-dark/60 line-clamp-2">${product.description || ''}</p>
                    </div>
                    <div class="flex items-center justify-between mt-auto pt-2 border-t border-herstory-light">
                        <span class="text-base font-bold text-herstory-dark">€${product.price}</span>
                        <button onclick="addToCart(${product.id})" class="bg-herstory-dark hover:bg-herstory-rose text-white hover:text-white p-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center">
                            <i class="fa-solid fa-plus text-xs"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
}

// 3. Filtrimi i produkteve sipas kategorive
function filterCategory(category) {
    document.querySelectorAll('.category-nav-btn').forEach(btn => {
        btn.classList.remove('text-herstory-rose', 'border-b-2', 'border-herstory-rose', 'font-semibold');
    });
    
    if (category === 'all') {
        renderProducts(products);
    } else {
        const filtered = products.filter(p => p.category === category);
        renderProducts(filtered);
    }
}

// 4. Logjika e Shportës
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const cartItem = cart.find(item => item.id === productId);
    if (cartItem) {
        cartItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    updateCartBadge();
}

function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    if (totalItems > 0) {
        badge.innerText = totalItems;
        badge.classList.remove('scale-0');
        badge.classList.add('scale-100');
    } else {
        badge.classList.remove('scale-100');
        badge.classList.add('scale-0');
    }
}

document.addEventListener('DOMContentLoaded', fetchProducts);