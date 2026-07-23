// SKEDARI KRYESOR I KLIENTIT (JAVASCRIPT PURO PA SIMBOLE HTML)

var produktetKlinet = [
    { id: 1, emri: "Krem Hidratues Fytyre", cmimi: 18.50, kategoria: "Kremra", foto: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500" },
    { id: 2, emri: "Parfum Rose Elegance", cmimi: 45.00, kategoria: "Parfume", foto: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=500" },
    { id: 3, emri: "Vaj Trupi Ushqyes", cmimi: 22.00, kategoria: "Kujdesi per Trupin", foto: "https://images.unsplash.com/photo-1608248597260-9f50e70b793d?w=500" }
];

var shporta = [];

// 1. FILTRIMI I KATEGORIVE
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
        var teFiltrura = [];
        for (var j = 0; j < produktetKlinet.length; j++) {
            if (produktetKlinet[j].kategoria.toLowerCase().indexOf(kategoria.toLowerCase()) !== -1) {
                teFiltrura.push(produktetKlinet[j]);
            }
        }
        renditProduktetKlient(teFiltrura);
    }
};

// 2. RENDITJA E PRODUKTEVE
function renditProduktetKlient(lista) {
    var kontejneri = document.getElementById('products-container') || document.getElementById('lista-produkteve-klient');
    if (!kontejneri) return;

    kontejneri.innerHTML = '';

    if (lista.length === 0) {
        var pEmpty = document.createElement('p');
        pEmpty.className = 'text-center col-span-full py-8 text-gray-500';
        pEmpty.innerText = 'Nuk u gjet asnjë produkt në këtë kategori.';
        kontejneri.appendChild(pEmpty);
        return;
    }

    for (var i = 0; i < lista.length; i++) {
        var p = lista[i];

        var divCard = document.createElement('div');
        divCard.className = 'bg-white rounded-xl shadow-sm border border-amber-100 overflow-hidden flex flex-col justify-between p-4';

        var divTop = document.createElement('div');

        var img = document.createElement('img');
        img.src = p.foto;
        img.alt = p.emri;
        img.className = 'w-full h-48 object-cover rounded-lg mb-3';

        var spanKat = document.createElement('span');
        spanKat.className = 'text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-full';
        spanKat.innerText = p.kategoria;

        var h3 = document.createElement('h3');
        h3.className = 'font-bold text-gray-800 text-lg mt-2';
        h3.innerText = p.emri;

        divTop.appendChild(img);
        divTop.appendChild(spanKat);
        divTop.appendChild(h3);

        var divBottom = document.createElement('div');
        divBottom.className = 'mt-4 flex items-center justify-between';

        var spanCmimi = document.createElement('span');
        spanCmimi.className = 'font-bold text-amber-900 text-xl';
        spanCmimi.innerText = '€' + p.cmimi.toFixed(2);

        var btnShto = document.createElement('button');
        btnShto.className = 'bg-amber-800 hover:bg-amber-900 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors';
        btnShto.innerText = 'Shto në Shportë';
        btnShto.setAttribute('data-id', p.id);
        btnShto.onclick = function() {
            var prodId = parseInt(this.getAttribute('data-id'));
            window.shtoNeShporte(prodId);
        };

        divBottom.appendChild(spanCmimi);
        divBottom.appendChild(btnShto);

        divCard.appendChild(divTop);
        divCard.appendChild(divBottom);

        kontejneri.appendChild(divCard);
    }
}

// 3. SHPORTA
window.shtoNeShporte = function(id) {
    var produkti = null;
    for (var i = 0; i < produktetKlinet.length; i++) {
        if (produktetKlinet[i].id === id) {
            produkti = produktetKlinet[i];
            break;
        }
    }
    if (produkti) {
        shporta.push(produkti);
        var numriShportes = document.getElementById('cart-count');
        if (numriShportes) {
            numriShportes.innerText = shporta.length;
        }
        alert('"' + produkti.emri + '" u shtua në shportë!');
    }
};

document.addEventListener('DOMContentLoaded', function() {
    renditProduktetKlient(produktetKlinet);
});