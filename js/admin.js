// Këtu vendoset linku yt i SAK TË projektit nga fotoja!
const SUPABASE_URL = 'https://zbxpfsgbsqewxcdxxxxn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpieHBmc2dic3Fld3hjZHh4eHhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg1MzUzODUsImV4cCI6MjA1NDExMTM4NX0.4C26CvhS4P84g60L3yT6u_YJIs4yJb2s2k9_Wk6YJpE';

let supabaseClient;

window.addEventListener('DOMContentLoaded', () => {
    if (window.supabase) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        loadProducts();
        loadOrders();
    } else {
        alert('Libraria e Supabase nuk u ngarkua te faqja.');
    }

    const form = document.getElementById('add-product-form');
    if (form) {
        form.addEventListener('submit', handleAddProduct);
    }
});

async function loadProducts() {
    const list = document.getElementById('product-list');
    if (!list) return;

    const { data: products, error } = await supabaseClient
        .from('products')
        .select('*')
        .order('id', { ascending: false });

    if (error) {
        list.innerHTML = '<tr><td colspan="6" style="color:red; text-align:center;">Gabim: ' + error.message + '</td></tr>';
        return;
    }

    list.innerHTML = '';
    if (!products || products.length === 0) {
        list.innerHTML = '<tr><td colspan="6" style="text-align:center;">Nuk ka produkte.</td></tr>';
        return;
    }

    products.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = \
            <td><img src="\" style="width:40px; height:40px; object-fit:cover;"></td>
            <td><strong>\</strong></td>
            <td>\</td>
            <td>\ €</td>
            <td>\</td>
            <td><button class="btn-delete" onclick="deleteProduct(\)">Fshi</button></td>
        \;
        list.appendChild(tr);
    });
}

async function handleAddProduct(e) {
    e.preventDefault();

    const name = document.getElementById('prod-name').value;
    const price = parseFloat(document.getElementById('prod-price').value);
    const category = document.getElementById('prod-category').value;
    const description = document.getElementById('prod-desc').value;
    const imageUrl = document.getElementById('prod-img-url').value;

    const { data, error } = await supabaseClient
        .from('products')
        .insert([{ name, price, category, description, image_url: imageUrl }]);

    if (error) {
        alert('GABIM: ' + error.message);
    } else {
        alert('Produkti u shtua me sukses!');
        document.getElementById('add-product-form').reset();
        loadProducts();
    }
}

async function deleteProduct(id) {
    if (!confirm('Ta fshijmë këtë produkt?')) return;

    const { error } = await supabaseClient
        .from('products')
        .delete()
        .eq('id', id);

    if (error) {
        alert('Gabim gjatë fshirjes: ' + error.message);
    } else {
        alert('Produkti u fshi!');
        loadProducts();
    }
}

async function loadOrders() {
    const list = document.getElementById('order-list');
    if (!list) return;

    const { data: orders, error } = await supabaseClient
        .from('orders')
        .select('*')
        .order('id', { ascending: false });

    if (error) return;

    list.innerHTML = '';
    if (!orders || orders.length === 0) {
        list.innerHTML = '<tr><td colspan="6" style="text-align:center;">Nuk ka porosi.</td></tr>';
        return;
    }

    orders.forEach(o => {
        const tr = document.createElement('tr');
        tr.innerHTML = \
            <td>#\</td>
            <td>\<br><small>\</small></td>
            <td>\</td>
            <td>\ €</td>
            <td>\</td>
            <td><button class="btn-delete" onclick="deleteOrder(\)">Fshi</button></td>
        \;
        list.appendChild(tr);
    });
}

async function deleteOrder(id) {
    if (!confirm('Ta fshijmë këtë porosi?')) return;
    const { error } = await supabaseClient.from('orders').delete().eq('id', id);
    if (!error) loadOrders();
}