// Kur ngarkohet faqja, shfaq produktet ekzistuese
document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    const form = document.getElementById('add-product-form');
    if (form) {
        form.addEventListener('submit', handleAddProduct);
    }
});

// 1. Shfaq të gjitha produktet nga Supabase në tabelë
async function fetchProducts() {
    const productList = document.getElementById('product-list');
    if (!productList) return;

    productList.innerHTML = '<tr><td colspan="6" style="text-align:center;">Duke ngarkuar produktet...</td></tr>';

    try {
        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .order('id', { ascending: false });

        if (error) throw error;

        productList.innerHTML = '';

        if (products.length === 0) {
            productList.innerHTML = '<tr><td colspan="6" style="text-align:center; color: #888;">Nuk ka asnjë produkt të regjistruar.</td></tr>';
            return;
        }

        products.forEach(product => {
            const tr = document.createElement('tr');
            tr.innerHTML = \
                <td><img src="\" alt="\" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;"></td>
                <td style="font-weight: 600;">\</td>
                <td>\</td>
                <td><strong>\ €</strong></td>
                <td><span style="font-size: 13px; color: #666; display: block; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">\</span></td>
                <td>
                    <button class="btn-delete" onclick="deleteProduct(\)">Fshi</button>
                </td>
            \;
            productList.appendChild(tr);
        });
    } catch (error) {
        console.error('Gabim gjatë marrjes së produkteve:', error);
        productList.innerHTML = '<tr><td colspan="6" style="text-align:center; color: red;">Gabim gjatë ngarkimit të të dhënave.</td></tr>';
    }
}

// 2. Shto produkt të ri
async function handleAddProduct(event) {
    event.preventDefault();

    const name = document.getElementById('prod-name').value;
    const price = parseFloat(document.getElementById('prod-price').value);
    const category = document.getElementById('prod-category').value;
    const description = document.getElementById('prod-desc').value;
    const imageUrl = document.getElementById('prod-img-url').value;

    const btn = event.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerText = 'Duke u shtuar...';

    try {
        const { data, error } = await supabase
            .from('products')
            .insert([{ name, price, category, description, image_url: imageUrl }]);

        if (error) throw error;

        alert('Produkti u shtua me sukses!');
        document.getElementById('add-product-form').reset();
        fetchProducts(); // Rifresko listën e produkteve në tabelë
    } catch (error) {
        alert('Gabim: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.innerText = 'Shto Produktin';
    }
}

// 3. Fshi produktin sipas ID-së
async function deleteProduct(id) {
    if (!confirm('A jeni të sigurt që dëshironi ta fshini këtë produkt?')) return;

    try {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) throw error;

        alert('Produkti u fshi me sukses!');
        fetchProducts(); // Rifresko tabelën
    } catch (error) {
        alert('Gabim gjatë fshirjes: ' + error.message);
    }
}