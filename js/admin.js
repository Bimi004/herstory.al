// Funksioni për të shtuar një produkt të ri në Supabase
async function handleAddProduct(event) {
    event.preventDefault();

    const name = document.getElementById('prod-name').value;
    const price = parseFloat(document.getElementById('prod-price').value);
    const category = document.getElementById('prod-category').value;
    const description = document.getElementById('prod-desc').value;
    const imageUrl = document.getElementById('prod-img-url').value;

    try {
        const { data, error } = await supabase
            .from('products')
            .insert([
                { 
                    name: name, 
                    price: price, 
                    category: category, 
                    description: description, 
                    image_url: imageUrl 
                }
            ]);

        if (error) throw error;

        alert('Produkti u shtua me sukses!');
        document.getElementById('add-product-form').reset();
    } catch (error) {
        alert('Gabim: ' + error.message);
    }
}