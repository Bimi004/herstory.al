// SKEDARI KRYESOR I KLIENTIT (HERSTORY)

var produktetKlinet = [
    { id: 1, emri: "Krem Hidratues Fytyre", cmimi: 18.50, kategoria: "Kremra", foto: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500" },
    { id: 2, emri: "Parfum Rose Elegance", cmimi: 45.00, kategoria: "Parfume", foto: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=500" },
    { id: 3, emri: "Vaj Trupi Ushqyes", cmimi: 22.00, kategoria: "Kujdesi per Trupin", foto: "https://images.unsplash.com/photo-1608248597260-9f50e70b793d?w=500" }
];

var shporta = [];

// 1. FUNKSIONI PER FILTRIMIN E KATEGORIVE (Rregullon ReferenceError)
window.filterCategory = function(kategoria, butoni) {
    var btns = document.querySelectorAll('.cat-btn');
    for (var i = 0; i < btns.length; i++) {
        btns[i].classList.remove('active');
    }
    if (butoni) {
        butoni.classList.add('active');
    }

    if (kategoria === 'all' || !kategoria) {
        renditProduktetKlient(produktetKlinet);
    } else {
        var teFiltrura = produktetKlinet.filter(function(p) {
            return p.kategoria.toLowerCase().includes(kategoria.toLowerCase());
        });
        renditProduktetKlient(teFiltrura);
    }
};

// 2. RENDITJA E PRODUKTEVE NE FAQE
function renditProduktetKlient(lista) {
    var kontejneri = document.getElementById('products-container') || document.getElementById('lista-produkteve-klient');
    if (!kontejneri) return;

    kontejneri.innerHTML = '';

    if (lista.length === 0) {
        kontejneri.innerHTML = '<p class="text-center col-span-full py-8 text-gray-500">Nuk u gjet asnjë produkt në këtë kategori.</p>';
        return;
    }

    for (var i = 0; i < lista.length; i++) {
        var p = lista[i];
        var div = document.createElement('div');
        div.className = 'bg-white rounded-xl shadow-sm border border-amber-100 overflow-hidden flex flex-col justify-between p-4';
        
        div.innerHTML = 
            <div>
                <img src="" alt="" class="w-full h-48 object-cover rounded-lg mb-3">
                <span class="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-full"></span>
                <h3 class="font-bold text-gray-800 text-lg mt-2"></h3>
            </div>
            <div class="mt-4 flex items-center justify-between">
                <span class="font-bold text-amber-900 text-xl">€</span>
                <button onclick="shtoNeShporte()" class="bg-amber-800 hover:bg-amber-900 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors">
                    Shto në Shportë
                </button>
            </div>
        ;
        kontejneri.appendChild(div);
    }
}

// 3. SHTIMI NE SHPORTE
window.shtoNeShporte = function(id) {
    var produkti = produktetKlinet.find(function(p) { return p.id === id; });
    if (produkti) {
        shporta.push(produkti);
        asazhoShportenUI();
        alert('"' + produkti.emri + '" u shtua në shportë!');
    }
};

function asazhoShportenUI() {
    var numriShportes = document.getElementById('cart-count');
    if (numriShportes) {
        numriShportes.innerText = shporta.length;
    }
}

// 4. NGARKIMI NE FILLIM
document.addEventListener('DOMContentLoaded', function() {
    renditProduktetKlient(produktetKlinet);
});