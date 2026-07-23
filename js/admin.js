document.addEventListener('DOMContentLoaded', async () => {
    console.log('Paneli i Adminit u ngarkua...');
    await loadProducts();
    await loadOrders();

    const addForm = document.getElementById('add-product-form');
    if (addForm) {
        addForm.addEventListener('submit', handleAddProduct);
    }
});

// ==========================================
// 1. MENAXHIMI I PRODUKTEVE
// ==========================================

async function loadProducts() {
    const list = document.getElementById('product-list');
    if (!list) return;

    list.innerHTML = '<tr><td colspan="6" style="text-align:center;">Duke ngarkuar produktet...</td></tr>';

    try {
        const { data: products, error } = await db
            .from('products')
            .select('*')
            .order('id', { ascending: false });

        if (error) throw error;

        list.innerHTML = '';

        if (!products || products.length === 0) {
            list.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#888;">Nuk ka asnjë produkt në dyqan.</td></tr>';
            return;
        }

        products.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = \
                <td><img src="\" alt="\" style="width:45px; height:45px; object-fit:cover; border-radius:6px;" onerror="this.src='https://via.placeholder.com/45'"></td>
                <td style="font-weight:600;">\</td>
                <td>\</td>
                <td><strong>\ €</strong></td>
                <td><span style="font-size:12px; color:#666; display:block; max-width:180px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">\</span></td>
                <td>
                    <button class="btn-delete" onclick="deleteProduct(\)">Fshi</button>
                </td>
            \;
            list.appendChild(tr);
        });
    } catch (err) {
        console.error('Gabim te loadProducts:', err);
        list.innerHTML = \<tr><td colspan="6" style="text-align:center; color:red;">Gabim: \</td></tr>\;
    }
}

async function handleAddProduct(e) {
    e.preventDefault();

    const name = document.getElementById('prod-name').value.trim();
    const price = parseFloat(document.getElementById('prod-price').value);
    const category = document.getElementById('prod-category').value;
    const description = document.getElementById('prod-desc').value.trim();
    const imageUrl = document.getElementById('prod-img-url').value.trim();

    if (!name || isNaN(price) || !imageUrl) {
        alert('Ju lutem plotësoni emrin, çmimin dhe linkun e fotos saktë!');
        return;
    }

    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = 'Duke u dërguar...';

    try {
        const { data, error } = await db
            .from('products')
            .insert([{ name, price, category, description, image_url: imageUrl }]);

        if (error) throw error;

        alert('✅ Produkti u shtua me sukses!');
        e.target.reset();
        await loadProducts();
    } catch (err) {
        console.error('Gabim gjatë shtimit:', err);
        alert('❌ Gabim nga Supabase: ' + err.message);
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
}

async function deleteProduct(id) {
    if (!confirm('A jeni 100% të sigurt që dëshironi ta fshini këtë produkt?')) return;

    try {
        const { error } = await db
            .from('products')
            .delete()
            .eq('id', id);

        if (error) throw error;

        alert('Produkti u fshi!');
        await loadProducts();
    } catch (err) {
        alert('Gabim gjatë fshirjes: ' + err.message);
    }
}

// ==========================================
// 2. MENAXHIMI I POROSIVE
// ==========================================

async function loadOrders() {
    const list = document.getElementById('order-list');
    if (!list) return;

    list.innerHTML = '<tr><td colspan="6" style="text-align:center;">Duke ngarkuar porositë...</td></tr>';

    try {
        const { data: orders, error } = await db
            .from('orders')
            .select('*')
            .order('id', { ascending: false });

        if (error) throw error;

        list.innerHTML = '';

        if (!orders || orders.length === 0) {
            list.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#888;">Nuk ka asnjë porosi ende.</td></tr>';
            return;
        }

        orders.forEach(o => {
            let itemsText = '';
            if (Array.isArray(o.items)) {
                itemsText = o.items.map(i => \<div>• \ (\x)</div>\).join('');
            } else {
                itemsText = '<em>Detajet e produktit</em>';
            }

            const tr = document.createElement('tr');
            tr.innerHTML = \
                <td>#\</td>
                <td>
                    <strong>\</strong><br>
                    <small style="color:#555;">📱 \</small><br>
                    <small style="color:#555;">📍 \</small>
                </td>
                <td style="font-size:13px;">\</td>
                <td><strong>\ €</strong></td>
                <td>
                    <select onchange="updateOrderStatus(\, this.value)" style="padding:4px 8px; font-size:12px;">
                        <option value="E re" \>E re</option>
                        <option value="Në proces" \>Në proces</option>
                        <option value="E dërguar" \>E dërguar</option>
                    </select>
                </td>
                <td>
                    <button class="btn-delete" style="padding:5px 10px;" onclick="deleteOrder(\)">Fshi</button>
                </td>
            \;
            list.appendChild(tr);
        });
    } catch (err) {
        console.error('Gabim te loadOrders:', err);
        list.innerHTML = \<tr><td colspan="6" style="text-align:center; color:red;">Gabim: \</td></tr>\;
    }
}

async function updateOrderStatus(id, newStatus) {
    try {
        const { error } = await db
            .from('orders')
            .update({ status: newStatus })
            .eq('id', id);

        if (error) throw error;
        alert('Statusi u ndryshua!');
    } catch (err) {
        alert('Gabim: ' + err.message);
    }
}

async function deleteOrder(id) {
    if (!confirm('Dëshironi ta fshini këtë porosi?')) return;
    try {
        const { error } = await db.from('orders').delete().eq('id', id);
        if (error) throw error;
        alert('Porosia u fshi!');
        await loadOrders();
    } catch (err) {
        alert('Gabim: ' + err.message);
    }
}

// Ndihmës për mbrojtje nga XSS (siguri)
function escapeHtml(text) {
    if (!text) return '';
    return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}