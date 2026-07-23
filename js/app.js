let cart = [];

document.addEventListener('DOMContentLoaded', () => {
    fetchClientProducts();
});

// 1. Merr produktet nga Supabase dhe i shfaq te Klienti
async function fetchClientProducts() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px;">Duke ngarkuar produktet...</div>';

    try {
        const { data: products, error } = await db
            .from('products')
            .select('*')
            .order('id', { ascending: false });

        if (error) throw error;

        grid.innerHTML = '';

        if (!products || products.length === 0) {
            grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px;">Nuk ka produkte për të shfaqur.</div>';
            return;
        }

        window.allProducts = products; // I ruajmë në memorie

        products.forEach(product => {
            const card = document.createElement('div');
            card.className = "bg-white rounded-2xl overflow-hidden border border-herstory-border group hover:shadow-xl transition-all duration-300 flex flex-col h-full";
            card.innerHTML = \
                <div class="relative overflow-hidden aspect-square bg-gray-50">
                    <img src="\" alt="\" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onerror="this.src='https://via.placeholder.com/300'">
                    <span class="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-[10px] font-bold uppercase tracking-widest text-herstory-dark px-2.5 py-1 rounded-full border border-herstory-border">\</span>
                </div>
                <div class="p-5 flex flex-col flex-grow justify-between">
                    <div>
                        <h3 class="font-serif font-bold text-lg text-herstory-dark mb-1">\</h3>
                        <p class="text-xs text-gray-500 line-clamp-2 mb-4">\</p>
                    </div>
                    <div class="flex items-center justify-between mt-auto pt-2 border-t border-herstory-light">
                        <span class="font-bold text-lg text-herstory-dark">\ €</span>
                        <button onclick="addToCart(\)" class="bg-herstory-dark hover:bg-herstory-rose text-white p-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center">
                            Shto në Shportë
                        </button>
                    </div>
                </div>
            \;
            grid.appendChild(card);
        });
    } catch (err) {
        console.error('Gabim gjatë ngarkimit të produkteve:', err);
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: red;">Gabim gjatë ngarkimit të produkteve.</div>';
    }
}

// 2. Menaxhimi i Shportës
function addToCart(productId) {
    const product = window.allProducts ? window.allProducts.find(p => p.id === productId) : null;
    if (!product) return;

    const existing = cart.find(item => item.id === productId);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ id: product.id, name: product.name, price: product.price, quantity: 1 });
    }

    updateCartBadge();
    alert('Produkti u shtua në shportë!');
}

function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    if (badge) {
        const total = cart.reduce((sum, item) => sum + item.quantity, 0);
        badge.innerText = total;
    }
}

// 3. Dërgimi i Porosisë (Checkout)
async function submitOrder(clientName, clientPhone, clientAddress) {
    if (cart.length === 0) {
        alert('Shporta është bosh!');
        return;
    }

    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    try {
        const { data, error } = await db
            .from('orders')
            .insert([{
                client_name: clientName,
                client_phone: clientPhone,
                client_address: clientAddress,
                items: cart,
                total_price: totalPrice,
                status: 'E re'
            }]);

        if (error) throw error;

        alert('🎉 Porosia juaj u krye me sukses!');
        cart = [];
        updateCartBadge();
    } catch (err) {
        alert('❌ Gabim gjatë dërgimit të porosisë: ' + err.message);
    }
}