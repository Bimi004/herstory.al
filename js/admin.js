// Kur ngarkohet faqja, shfaq produktet ekzistuese dhe porositë
document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    fetchOrders();
    const form = document.getElementById('add-product-form');
    if (form) {
        form.addEventListener('submit', handleAddProduct);
    }
});

// 1. Shfaq produktet
async function fetchProducts() {
    const productList = document.getElementById('product-list');
    if (!productList) return;
    productList.innerHTML = '<tr><td colspan="6" style="text-align:center;">Duke ngarkuar...</td></tr>';
    try {
        const { data: products, error } = await supabase.from('products').select('*').order('id', { ascending: false });
        if (error) throw error;
        productList.innerHTML = '';
        if (products.length === 0) {
            productList.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#888;">Nuk ka produkte.</td></tr>';
            return;
        }
        products.forEach(product => {
            const tr = document.createElement('tr');
            tr.innerHTML = \
                <td><img src="\" alt="\" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;"></td>
                <td style="font-weight: 600;">\</td>
                <td>\</td>
                <td><strong>\ €</strong></td>
                <td><span style="font-size:13px; color:#666; display:block; max-width:150px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">\</span></td>
                <td><button class="btn-delete" onclick="deleteProduct(\)">Fshi</button></td>
            \;
            productList.appendChild(tr);
        });
    } catch (error) {
        productList.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red;">Gabim!</td></tr>';
    }
}

// 2. Shto produkt
async function handleAddProduct(event) {
    event.preventDefault();
    const name = document.getElementById('prod-name').value;
    const price = parseFloat(document.getElementById('prod-price').value);
    const category = document.getElementById('prod-category').value;
    const description = document.getElementById('prod-desc').value;
    const imageUrl = document.getElementById('prod-img-url').value;
    const btn = event.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
        const { error } = await supabase.from('products').insert([{ name, price, category, description, image_url: imageUrl }]);
        if (error) throw error;
        alert('Produkti u shtua me sukses!');
        document.getElementById('add-product-form').reset();
        fetchProducts();
    } catch (error) {
        alert('Gabim: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.innerText = 'Shto Produktin';
    }
}

// 3. Fshi produkt
async function deleteProduct(id) {
    if (!confirm('A jeni të sigurt?')) return;
    try {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
        alert('Produkti u fshi!');
        fetchProducts();
    } catch (error) {
        alert(error.message);
    }
}

// ================= POROSITË =================

// 4. Shfaq porositë live nga Supabase
async function fetchOrders() {
    const orderList = document.getElementById('order-list');
    if (!orderList) return;
    orderList.innerHTML = '<tr><td colspan="6" style="text-align:center;">Duke ngarkuar porositë...</td></tr>';
    try {
        const { data: orders, error } = await supabase.from('orders').select('*').order('id', { ascending: false });
        if (error) throw error;
        orderList.innerHTML = '';
        if (orders.length === 0) {
            orderList.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#888;">Nuk ka asnjë porosi ende.</td></tr>';
            return;
        }
        orders.forEach(order => {
            // Formato listën e produkteve të blera që të duket bukur
            let itemsHtml = '';
            order.items.forEach(item => {
                itemsHtml += \<div>• \ (\x - \ €)</div>\;
            });

            const tr = document.createElement('tr');
            tr.innerHTML = \
                <td>#\</td>
                <td>
                    <strong>\</strong><br>
                    <small style="color:#666;">Tel: \</small><br>
                    <small style="color:#666;">Adresa: \</small>
                </td>
                <td>\</td>
                <td><strong>\ €</strong></td>
                <td>
                    <select onchange="updateOrderStatus(\, this.value)" style="margin:0; padding:5px; font-size:12px;">
                        <option value="E re" \>E re</option>
                        <option value="Në proces" \>Në proces</option>
                        <option value="E dërguar" \>E dërguar</option>
                    </select>
                </td>
                <td>
                    <button class="btn-delete" style="padding: 5px 10px;" onclick="deleteOrder(\)">Fshi</button>
                </td>
            \;
            orderList.appendChild(tr);
        });
    } catch (error) {
        orderList.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red;">Gabim gjatë ngarkimit të porosive.</td></tr>';
    }
}

// 5. Përditëso Statusin e Porosisë
async function updateOrderStatus(id, newStatus) {
    try {
        const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', id);
        if (error) throw error;
        alert('Statusi i porosisë u përditësua!');
    } catch (error) {
        alert('Gabim: ' + error.message);
    }
}

// 6. Fshi Porosinë
async function deleteOrder(id) {
    if (!confirm('A jeni të sigurt që dëshironi ta fshini këtë porosi?')) return;
    try {
        const { error } = await supabase.from('orders').delete().eq('id', id);
        if (error) throw error;
        alert('Porosia u fshi me sukses!');
        fetchOrders();
    } catch (error) {
        alert(error.message);
    }
}