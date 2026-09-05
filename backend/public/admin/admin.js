const API =
    window.HERSTORY_CONFIG?.API_BASE || '';

let token =
    sessionStorage.getItem(
        'herstory_admin_token'
    );

let currentUser = null;
let products = [];
let categories = [];
let orders = [];


const TEXT = {

    orders:
        'Porosit\u00EB',

    categories:
        'Kategorit\u00EB',

    price:
        '\u00C7mimi',

    saved:
        'U ruajt',

    saving:
        'Duke ruajtur...',

    addedCategory:
        'Kategoria u shtua.',

    noCategories:
        'Nuk ka kategori.',

    noProducts:
        'Nuk ka produkte.',

    noOrders:
        'Nuk ka porosi.',

    deactivate:
        '\u00C7aktivizo',

    activate:
        'Aktivizo',

    edit:
        'Ndrysho',

    remove:
        'Hiq',

    primary:
        'Kryesore',

    makePrimary:
        'B\u00EBj kryesore'
};


function money(value) {

    return new Intl.NumberFormat(
        'sq-AL',
        {
            style:
                'currency',

            currency:
                'EUR',

            minimumFractionDigits:
                2,

            maximumFractionDigits:
                2
        }
    ).format(
        Number(value || 0)
    );
}


function escapeHtml(
    value = ''
) {

    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll(
            "'",
            '&#039;'
        );
}


function slugify(value) {

    return String(value || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(
            /[\u0300-\u036f]/g,
            ''
        )
        .replace(
            /[^a-z0-9]+/g,
            '-'
        )
        .replace(
            /^-+|-+$/g,
            ''
        );
}


async function request(
    path,
    options = {}
) {

    const headers =
        new Headers(
            options.headers || {}
        );

    if (token) {

        headers.set(
            'Authorization',
            `Bearer ${token}`
        );
    }


    const response =
        await fetch(
            API + path,
            {
                ...options,
                headers
            }
        );


    const data =
        await response
            .json()
            .catch(() => ({}));


    if (
        response.status === 401
    ) {

        logout();

        throw new Error(
            'Sesioni ka skaduar.'
        );
    }


    if (!response.ok) {

        throw new Error(
            data.message ||
            'Ndodhi nj\u00EB gabim.'
        );
    }


    return data;
}


async function login(
    email,
    password
) {

    const response =
        await fetch(
            API +
            '/api/auth/login',
            {
                method:
                    'POST',

                headers: {
                    'Content-Type':
                        'application/json'
                },

                body:
                    JSON.stringify({
                        email,
                        password
                    })
            }
        );


    const data =
        await response.json();


    if (!response.ok) {

        throw new Error(
            data.message ||
            'Hyrja d\u00EBshtoi.'
        );
    }


    token =
        data.access_token;

    currentUser =
        data.user;


    sessionStorage.setItem(
        'herstory_admin_token',
        token
    );


    showAdmin();

    await loadEverything();
}


function logout() {

    token = null;
    currentUser = null;

    sessionStorage.removeItem(
        'herstory_admin_token'
    );

    document
        .getElementById(
            'adminApp'
        )
        .classList
        .add('hidden');

    document
        .getElementById(
            'loginScreen'
        )
        .classList
        .remove('hidden');
}


async function restoreSession() {

    if (!token)
        return;


    try {

        const result =
            await request(
                '/api/admin/me'
            );

        currentUser =
            result.user;

        showAdmin();

        await loadEverything();

    } catch {

        logout();
    }
}


function showAdmin() {

    document
        .getElementById(
            'loginScreen'
        )
        .classList
        .add('hidden');

    document
        .getElementById(
            'adminApp'
        )
        .classList
        .remove('hidden');

    document
        .getElementById(
            'adminUserText'
        )
        .textContent =
        currentUser?.email || '';
}


document
    .getElementById(
        'loginForm'
    )
    .addEventListener(
        'submit',
        async event => {

            event.preventDefault();

            const form =
                new FormData(
                    event.target
                );

            const message =
                document.getElementById(
                    'loginMessage'
                );

            message.textContent =
                'Duke hyr\u00EB...';


            try {

                await login(
                    form.get('email'),
                    form.get('password')
                );

                message.textContent =
                    '';

            } catch (error) {

                message.textContent =
                    error.message;
            }
        }
    );


document
    .getElementById(
        'logoutButton'
    )
    .addEventListener(
        'click',
        logout
    );


async function loadEverything() {

    await Promise.all([
        loadSummary(),
        loadCategories(),
        loadProducts(),
        loadOrders()
    ]);

    renderRecentOrders();
}


let dashboardPeriod = 'today';

async function loadSummary(period = dashboardPeriod) {

    dashboardPeriod = period;

    const result =
        await request(
            '/api/admin/catalog/summary?period=' +
            encodeURIComponent(period)
        );

    const s =
        result.summary;

    const periodNames = {
        today: 'Sot',
        '7d': '7 dit\u00EB',
        '30d': '30 dit\u00EB',
        all: 'Gjithsej'
    };

    const cards = [

        [
            'Produkte aktive',
            s.active_products
        ],

        [
            'Porosi - ' + periodNames[period],
            s.orders
        ],

        [
            'Stok i ul\u00EBt',
            s.low_stock
        ],

        [
            'Xhiro - ' + periodNames[period],
            money(
                s.revenue
            )
        ]
    ];


    const statsGrid = document.getElementById('statsGrid');

    let periodBar = document.getElementById('dashboardPeriodBar');

    if (!periodBar) {
        periodBar = document.createElement('div');
        periodBar.id = 'dashboardPeriodBar';
        periodBar.style.cssText =
            'display:flex;gap:8px;flex-wrap:wrap;margin:0 0 16px 0;';

        statsGrid.parentNode.insertBefore(periodBar, statsGrid);
    }

    periodBar.innerHTML = [
        ['today', 'Sot'],
        ['7d', '7 dit\u00EB'],
        ['30d', '30 dit\u00EB'],
        ['all', 'Gjithsej']
    ].map(([value, label]) => `
        <button
            type="button"
            data-dashboard-period="${value}"
            style="
                padding:8px 14px;
                border-radius:8px;
                border:1px solid #ccc;
                cursor:pointer;
                font-weight:600;
                ${value === dashboardPeriod
                    ? 'background:#111;color:#fff;'
                    : 'background:#fff;color:#111;'}
            "
        >${label}</button>
    `).join('');

    periodBar
        .querySelectorAll('[data-dashboard-period]')
        .forEach(button => {
            button.addEventListener('click', () => {
                loadSummary(
                    button.dataset.dashboardPeriod
                );
            });
        });

    document
        .getElementById(
            'statsGrid'
        )
        .innerHTML =
        cards.map(card => `

            <div class="stat-card">

                <span>
                    ${card[0]}
                </span>

                <strong>
                    ${card[1]}
                </strong>

            </div>

        `).join('');
}


async function loadCategories() {

    const result =
        await request(
            '/api/admin/catalog/categories'
        );

    categories =
        result.categories || [];

    renderCategories();

    updateProductCategoryOptions();

    if (products.length) {
        renderProducts();
    }
}


function renderCategories() {

    const target =
        document.getElementById(
            'categoriesAdminList'
        );


    if (!categories.length) {

        target.innerHTML =
            `<div class="empty">${TEXT.noCategories}</div>`;

        return;
    }


    target.innerHTML =
        categories.map(category => `

            <div class="category-admin-row">

                <div>

                    <strong>
                        ${escapeHtml(
                            category.name
                        )}
                    </strong>

                    <div class="category-subtext">
                        /${escapeHtml(
                            category.slug
                        )}
                    </div>

                </div>


                <div class="category-admin-actions">

                    <span class="badge">

                        ${
                            category.is_active
                            ? 'Aktive'
                            : 'Jo aktive'
                        }

                    </span>


                    <button
                        class="small-button ${
                            category.is_active
                            ? 'danger'
                            : ''
                        }"
                        onclick="
                            setCategoryActive(
                                '${category.id}',
                                ${!category.is_active}
                            )
                        "
                    >

                        ${
                            category.is_active
                            ? TEXT.deactivate
                            : TEXT.activate
                        }

                    </button>

                </div>

            </div>

        `).join('');
}


const categoryForm =
    document.getElementById(
        'quickCategoryForm'
    );


categoryForm
    .addEventListener(
        'submit',
        async event => {

            event.preventDefault();

            const form =
                new FormData(
                    event.target
                );

            const message =
                document.getElementById(
                    'quickCategoryMessage'
                );


            try {

                message.textContent =
                    'Duke shtuar...';


                await request(
                    '/api/categories',
                    {
                        method:
                            'POST',

                        headers: {
                            'Content-Type':
                                'application/json'
                        },

                        body:
                            JSON.stringify({
                                name:
                                    form.get(
                                        'name'
                                    ).trim(),

                                slug:
                                    form.get(
                                        'slug'
                                    ).trim(),

                                description:
                                    null,

                                sort_order:
                                    Number(
                                        form.get(
                                            'sort_order'
                                        ) || 0
                                    ),

                                is_active:
                                    true
                            })
                    }
                );


                event.target.reset();

                event.target
                    .elements
                    .sort_order
                    .value =
                    '0';


                message.textContent =
                    TEXT.addedCategory;


                await Promise.all([
                    loadCategories(),
                    loadSummary()
                ]);


            } catch (error) {

                message.textContent =
                    error.message;
            }
        }
    );


const categoryNameInput =
    categoryForm
        .querySelector(
            'input[name="name"]'
        );

const categorySlugInput =
    categoryForm
        .querySelector(
            'input[name="slug"]'
        );


categoryNameInput
    .addEventListener(
        'input',
        () => {

            if (
                !categorySlugInput
                    .dataset
                    .manuallyEdited
            ) {

                categorySlugInput.value =
                    slugify(
                        categoryNameInput.value
                    );
            }
        }
    );


categorySlugInput
    .addEventListener(
        'input',
        () => {

            categorySlugInput
                .dataset
                .manuallyEdited =
                categorySlugInput.value
                ? '1'
                : '';
        }
    );


window.setCategoryActive =
async function(
    id,
    active
) {

    try {

        await request(
            `/api/admin/categories/${id}/active`,
            {
                method:
                    'PATCH',

                headers: {
                    'Content-Type':
                        'application/json'
                },

                body:
                    JSON.stringify({
                        is_active:
                            active
                    })
            }
        );


        await Promise.all([
            loadCategories(),
            loadSummary()
        ]);


    } catch (error) {

        alert(
            error.message
        );
    }
};


async function loadProducts() {

    const result =
        await request(
            '/api/admin/catalog/products'
        );

    products =
        result.products || [];

    renderProducts();

    updateProductCategoryOptions();
}


function renderProducts() {

    const target =
        document.getElementById(
            'productsAdminList'
        );


    if (!products.length) {

        target.innerHTML =
            `<div class="empty">${TEXT.noProducts}</div>`;

        return;
    }


    target.innerHTML = `

        <table>

            <thead>

                <tr>
                    <th>Produkti</th>
                    <th>Kategoria</th>
                    <th>SKU</th>
                    <th>${TEXT.price}</th>
                    <th>Stoku</th>
                    <th>Statusi</th>
                    <th>Veprime</th>
                </tr>

            </thead>


            <tbody>

                ${products.map(product => {

                    const category =
                        categories.find(
                            item =>
                                item.id ===
                                product.category_id
                        );

                    return `

                        <tr>

                            <td>
                                <strong>
                                    ${escapeHtml(
                                        product.name
                                    )}
                                </strong>
                            </td>

                            <td>
                                ${
                                    category
                                    ? escapeHtml(
                                        category.name
                                    )
                                    : '-'
                                }
                            </td>

                            <td>
                                ${escapeHtml(
                                    product.sku
                                )}
                            </td>

                            <td>
                                ${money(
                                    product.price
                                )}
                            </td>

                            <td>
                                ${product.stock_quantity}
                            </td>

                            <td>

                                <span class="badge">

                                    ${
                                        product.is_active
                                        ? 'Aktiv'
                                        : 'Jo aktiv'
                                    }

                                </span>

                            </td>

                            <td>

                                <div class="table-actions">

                                    <button
                                        class="small-button"
                                        onclick="
                                            editProduct(
                                                '${product.id}'
                                            )
                                        "
                                    >
                                        ${TEXT.edit}
                                    </button>


                                    <button
                                        class="small-button ${
                                            product.is_active
                                            ? 'danger'
                                            : ''
                                        }"
                                        onclick="
                                            setProductActive(
                                                '${product.id}',
                                                ${!product.is_active}
                                            )
                                        "
                                    >

                                        ${
                                            product.is_active
                                            ? TEXT.deactivate
                                            : TEXT.activate
                                        }

                                    </button>

                                </div>

                            </td>

                        </tr>
                    `;

                }).join('')}

            </tbody>

        </table>
    `;
}


function updateProductCategoryOptions() {

    const select =
        document.getElementById(
            'productCategory'
        );

    if (!select)
        return;


    const oldValue =
        select.value;


    select.innerHTML =
        `
        <option value="">
            Pa kategori
        </option>
        ` +
        categories
            .filter(
                category =>
                    category.is_active
            )
            .map(category => `

                <option value="${category.id}">

                    ${escapeHtml(
                        category.name
                    )}

                </option>

            `)
            .join('');


    const exists =
        [...select.options]
            .some(
                option =>
                    option.value ===
                    oldValue
            );


    if (exists) {
        select.value =
            oldValue;
    }
}


function openProductModal(
    product = null
) {

    updateProductCategoryOptions();


    const modal =
        document.getElementById(
            'productModal'
        );

    const form =
        document.getElementById(
            'productForm'
        );


    form.reset();


    form.elements.id.value =
        product?.id || '';

    form.elements.name.value =
        product?.name || '';

    form.elements.sku.value =
        product?.sku || '';

    form.elements.slug.value =
        product?.slug || '';

    form.elements.category_id.value =
        product?.category_id || '';

    form.elements.price.value =
        product?.price ?? '';

    form.elements.compare_at_price.value =
        product?.compare_at_price ?? '';

    form.elements.stock_quantity.value =
        product?.stock_quantity ?? 0;

    form.elements.low_stock_threshold.value =
        product?.low_stock_threshold ?? 5;

    form.elements.short_description.value =
        product?.short_description || '';

    form.elements.description.value =
        product?.description || '';

    form.elements.is_active.checked =
        product
        ? Boolean(
            product.is_active
        )
        : true;

    form.elements.is_featured.checked =
        Boolean(
            product?.is_featured
        );

    form.elements.track_inventory.checked =
        product
        ? Boolean(
            product.track_inventory
        )
        : true;


    document
        .getElementById(
            'productModalTitle'
        )
        .textContent =
        product
        ? 'Ndrysho produktin'
        : 'Produkt i ri';


    document
        .getElementById(
            'productMessage'
        )
        .textContent =
        '';


    const mediaArea =
        document.getElementById(
            'mediaArea'
        );


    if (product?.id) {

        mediaArea
            .classList
            .remove('hidden');

        loadProductMedia(
            product.id
        );

    } else {

        mediaArea
            .classList
            .add('hidden');
    }


    modal.classList
        .add('open');
}


document
    .getElementById(
        'newProductButton'
    )
    .addEventListener(
        'click',
        () => {

            openProductModal();
        }
    );


window.editProduct = function(id) {

    const product = products.find(
        item => item.id === id
    );

    if (!product) {
        alert('Produkti nuk u gjet.');
        return;
    }

    /*
        Perdoret funksioni ekzistues i adminit.
        Ai mbush formen dhe hap modalin ne menyren e sakte.
    */
    openProductModal(product);
};

window.setProductActive =
async function(id, active) {

    try {

        await request(
            `/api/admin/products/${id}/active`,
            {
                method: 'PATCH',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify({
                    is_active: active
                })
            }
        );

        await Promise.all([
            loadProducts(),
            loadSummary()
        ]);

    } catch (error) {
        alert(error.message);
    }
};



// HERSTORY_PRODUCT_FORM_SAVE_V1
document
    .getElementById('productForm')
    .addEventListener(
        'submit',
        async event => {

            event.preventDefault();

            const form = event.target;
            const message =
                document.getElementById(
                    'productMessage'
                );

            const getValue = name => {
                const element = form.elements[name];
                if (!element) return '';
                return String(
                    element.value ?? ''
                ).trim();
            };

            const optionalNumber = name => {
                const value = getValue(name);
                return value === ''
                    ? null
                    : Number(value);
            };

            const checkboxValue = (
                name,
                fallback
            ) => {
                const element =
                    form.elements[name];

                return element
                    ? Boolean(element.checked)
                    : fallback;
            };

            const id = getValue('id');

            const payload = {
                name: getValue('name'),
                slug: getValue('slug'),
                sku: getValue('sku'),

                short_description:
                    getValue('short_description') || null,

                description:
                    getValue('description') || null,

                price:
                    Number(getValue('price') || 0),

                compare_at_price:
                    optionalNumber('compare_at_price'),

                cost_price:
                    optionalNumber('cost_price'),

                stock_quantity:
                    Number(
                        getValue('stock_quantity') || 0
                    ),

                low_stock_threshold:
                    Number(
                        getValue('low_stock_threshold') || 5
                    ),

                track_inventory:
                    checkboxValue(
                        'track_inventory',
                        true
                    ),

                is_active:
                    checkboxValue(
                        'is_active',
                        true
                    ),

                is_featured:
                    checkboxValue(
                        'is_featured',
                        false
                    ),

                category_id:
                    getValue('category_id') || null,

                weight_grams:
                    optionalNumber('weight_grams'),

                meta_title:
                    getValue('meta_title') || null,

                meta_description:
                    getValue('meta_description') || null
            };

            try {

                message.textContent =
                    'Duke ruajtur...';

                const result =
                    await request(
                        id
                            ? `/api/products/${id}`
                            : '/api/products',
                        {
                            method:
                                id
                                    ? 'PATCH'
                                    : 'POST',

                            headers: {
                                'Content-Type':
                                    'application/json'
                            },

                            body:
                                JSON.stringify(payload)
                        }
                    );

                const savedProduct =
                    result.product;

                if (
                    savedProduct &&
                    savedProduct.id
                ) {

                    form.elements.id.value =
                        savedProduct.id;

                    const mediaArea =
                        document.getElementById(
                            'mediaArea'
                        );

                    if (mediaArea) {
                        mediaArea
                            .classList
                            .remove('hidden');
                    }

                    await loadProductMedia(
                        savedProduct.id
                    );
                }

                await Promise.all([
                    loadProducts(),
                    loadSummary()
                ]);

                message.textContent =
                    id
                        ? 'Produkti u përditësua me sukses.'
                        : 'Produkti u shtua me sukses. Tani mund të shtosh foto ose video.';

            } catch (error) {

                console.error(
                    'Product save error:',
                    error
                );

                message.textContent =
                    error.message ||
                    'Produkti nuk mund të ruhej.';
            }
        }
    );
async function loadProductMedia(
    productId
) {

    const target =
        document.getElementById(
            'productMediaList'
        );


    try {

        const result =
            await request(
                `/api/media/product/${productId}`
            );

        const media =
            result.media || [];


        if (!media.length) {

            target.innerHTML =
                '<div class="empty">Nuk ka foto ose video.</div>';

            return;
        }


        target.innerHTML =
            media.map(item => `

                <div class="media-card">

                    ${
                        item.media_type ===
                            'video'

                        ? `
                        <video
                            src="${item.public_url}"
                            muted
                            playsinline
                        ></video>
                        `

                        : `
                        <img
                            src="${item.public_url}"
                            alt=""
                        >
                        `
                    }


                    <div class="media-card-actions">

                        <button
                            type="button"
                            onclick="
                                setPrimaryMedia(
                                    '${item.id}',
                                    '${productId}'
                                )
                            "
                        >

                            ${
                                item.is_primary
                                ? TEXT.primary
                                : TEXT.makePrimary
                            }

                        </button>


                        <button
                            type="button"
                            onclick="
                                deleteMedia(
                                    '${item.id}',
                                    '${productId}'
                                )
                            "
                        >
                            ${TEXT.remove}
                        </button>

                    </div>

                </div>

            `).join('');


    } catch (error) {

        target.innerHTML =
            `
            <div class="empty">
                ${escapeHtml(
                    error.message
                )}
            </div>
            `;
    }
}


document
    .getElementById(
        'mediaFileInput'
    )
    .addEventListener(
        'change',
        async event => {

            const file =
                event.target.files[0];

            if (!file)
                return;


            const productId =
                document
                    .getElementById(
                        'productForm'
                    )
                    .elements
                    .id
                    .value;


            if (!productId) {

                alert(
                    'Ruaj produktin fillimisht.'
                );

                return;
            }


            const data =
                new FormData();

            data.append(
                'file',
                file
            );


            try {

                await request(
                    `/api/media/product/${productId}`,
                    {
                        method:
                            'POST',

                        body:
                            data
                    }
                );


                event.target.value =
                    '';


                await loadProductMedia(
                    productId
                );


            } catch (error) {

                alert(
                    error.message
                );
            }
        }
    );


window.setPrimaryMedia =
async function(
    mediaId,
    productId
) {

    try {

        await request(
            `/api/media/${mediaId}/primary`,
            {
                method:
                    'PATCH'
            }
        );


        await loadProductMedia(
            productId
        );


    } catch (error) {

        alert(
            error.message
        );
    }
};


window.deleteMedia =
async function(
    mediaId,
    productId
) {

    const confirmed =
        confirm(
            'Ta fshijm\u00EB k\u00EBt\u00EB foto/video?'
        );

    if (!confirmed)
        return;


    try {

        await request(
            `/api/media/${mediaId}`,
            {
                method:
                    'DELETE'
            }
        );


        await loadProductMedia(
            productId
        );


    } catch (error) {

        alert(
            error.message
        );
    }
};


const statusLabels = {

    new:
        'E re',

    confirmed:
        'Konfirmuar',

    processing:
        'N\u00EB p\u00EBrgatitje',

    ready_to_ship:
        'Gati p\u00EBr d\u00EBrges\u00EB',

    shipped:
        'D\u00EBrguar',

    delivered:
        'Dor\u00EBzuar',

    cancelled:
        'Anuluar',

    returned:
        'Kthyer'
};


async function loadOrders() {

    const result =
        await request(
            '/api/orders'
        );

    orders =
        result.orders || [];

    renderOrders();
}


function renderOrders() {

    const target =
        document.getElementById(
            'ordersList'
        );


    if (!orders.length) {

        target.innerHTML =
            `<div class="empty">${TEXT.noOrders}</div>`;

        return;
    }


    target.innerHTML = `

        <table>

            <thead>

                <tr>
                    <th>#</th>
                    <th>Klienti</th>
                    <th>Telefoni</th>
                    <th>Qyteti</th>
                    <th>Totali</th>
                    <th>Statusi</th>
                </tr>

            </thead>


            <tbody>

                ${orders.map(order => `

                    <tr>

                        <td>
                            #${order.order_number}
                        </td>

                        <td>
                            ${escapeHtml(
                                order.customer_name
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                order.customer_phone
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                order.shipping_city
                            )}
                        </td>

                        <td>
                            ${money(
                                order.total_amount
                            )}
                        </td>

                        <td>

                            <select
                                class="status-select"
                                data-order-id="${order.id}"
                                data-old-status="${order.order_status}"
                            >

                                ${Object
                                    .keys(statusLabels)
                                    .map(status => `

                                        <option
                                            value="${status}"
                                            ${
                                                order.order_status === status
                                                ? 'selected'
                                                : ''
                                            }
                                        >
                                            ${statusLabels[status]}
                                        </option>

                                    `)
                                    .join('')}

                            </select>


                            <div
                                id="status-message-${order.id}"
                                class="status-save-message"
                            ></div>

                        </td>

                    </tr>

                `).join('')}

            </tbody>

        </table>
    `;


    target
        .querySelectorAll(
            '.status-select'
        )
        .forEach(select => {

            select.addEventListener(
                'change',
                async () => {

                    const orderId =
                        select.dataset.orderId;

                    const oldStatus =
                        select.dataset.oldStatus;

                    const newStatus =
                        select.value;

                    const message =
                        document.getElementById(
                            `status-message-${orderId}`
                        );


                    select.disabled =
                        true;

                    message.textContent =
                        TEXT.saving;


                    try {

                        const result =
                            await request(
                                `/api/orders/${orderId}/status`,
                                {
                                    method:
                                        'PATCH',

                                    headers: {
                                        'Content-Type':
                                            'application/json'
                                    },

                                    body:
                                        JSON.stringify({
                                            status:
                                                newStatus
                                        })
                                }
                            );


                        const savedStatus =
                            result.order
                                .order_status;


                        select.value =
                            savedStatus;

                        select.dataset
                            .oldStatus =
                            savedStatus;


                        const localOrder =
                            orders.find(
                                item =>
                                    item.id ===
                                    orderId
                            );

                        if (localOrder) {
                            localOrder.order_status =
                                savedStatus;
                        }


                        message.textContent =
                            TEXT.saved;


                        await Promise.all([
                            loadSummary(),
                            loadProducts()
                        ]);


                        renderRecentOrders();


                        setTimeout(
                            () => {

                                message.textContent =
                                    '';

                            },
                            1300
                        );


                    } catch (error) {

                        select.value =
                            oldStatus;

                        message.textContent =
                            error.message;

                    } finally {

                        select.disabled =
                            false;
                    }
                }
            );
        });
}


function renderRecentOrders() {

    const target =
        document.getElementById(
            'recentOrders'
        );

    const recent =
        orders.slice(0,5);


    if (!recent.length) {

        target.innerHTML =
            `<div class="empty">${TEXT.noOrders}</div>`;

        return;
    }


    target.innerHTML =
        recent.map(order => `

            <div class="recent-order-row">

                <div>

                    <strong>
                        #${order.order_number}
                        -
                        ${escapeHtml(
                            order.customer_name
                        )}
                    </strong>

                    <div class="category-subtext">
                        ${escapeHtml(
                            order.shipping_city
                        )}
                    </div>

                </div>


                <div>

                    <strong>
                        ${money(
                            order.total_amount
                        )}
                    </strong>

                    <div class="category-subtext">
                        ${
                            statusLabels[
                                order.order_status
                            ] ||
                            order.order_status
                        }
                    </div>

                </div>

            </div>

        `).join('');
}


async function refreshDashboard() {

    await Promise.all([
        loadOrders(),
        loadSummary()
    ]);

    renderRecentOrders();
}


document
    .getElementById(
        'refreshOrdersButton'
    )
    .addEventListener(
        'click',
        refreshDashboard
    );


document
    .getElementById(
        'dashboardRefreshButton'
    )
    .addEventListener(
        'click',
        refreshDashboard
    );


document
    .getElementById(
        'refreshCategoriesButton'
    )
    .addEventListener(
        'click',
        loadCategories
    );


document
    .querySelectorAll(
        '[data-close]'
    )
    .forEach(button => {

        button.addEventListener(
            'click',
            () => {

                document
                    .getElementById(
                        button.dataset.close
                    )
                    .classList
                    .remove('open');
            }
        );
    });


const sectionTitles = {

    dashboard:
        'Kryefaqja',

    orders:
        TEXT.orders,

    products:
        'Produktet',

    categories:
        TEXT.categories
};


document
    .querySelectorAll(
        '.nav-item'
    )
    .forEach(button => {

        button.addEventListener(
            'click',
            () => {

                document
                    .querySelectorAll(
                        '.nav-item'
                    )
                    .forEach(item => {

                        item.classList
                            .remove('active');
                    });


                button.classList
                    .add('active');


                document
                    .querySelectorAll(
                        '.admin-section'
                    )
                    .forEach(section => {

                        section.classList
                            .remove('active');
                    });


                document
                    .getElementById(
                        `section-${button.dataset.section}`
                    )
                    .classList
                    .add('active');


                document
                    .getElementById(
                        'sectionTitle'
                    )
                    .textContent =
                    sectionTitles[
                        button.dataset.section
                    ];


                document
                    .querySelector(
                        '.sidebar'
                    )
                    .classList
                    .remove('open');
            }
        );
    });


document
    .getElementById(
        'mobileMenuButton'
    )
    .addEventListener(
        'click',
        () => {

            document
                .querySelector(
                    '.sidebar'
                )
                .classList
                .toggle('open');
        }
    );


restoreSession();

/* ============================================================
   HERSTORY_CSP_BUTTON_FIX_V2

   Nuk perdor eval.
   Nuk lejon JavaScript arbitrar.
   Lexon vetem thirrje te funksioneve admin qe kemi whitelist.
   ============================================================ */

document.addEventListener(
    'click',
    async function(event) {

        const element =
            event.target.closest('[onclick]');

        if (!element) {
            return;
        }

        const rawAction =
            element.getAttribute('onclick');

        if (!rawAction) {
            return;
        }

        /*
         * Kthen:
         *
         * setProductActive(
         *   'abc',
         *   false
         * )
         *
         * ne:
         *
         * setProductActive( 'abc', false )
         */

        const action =
            rawAction
                .replace(/\s+/g, ' ')
                .trim()
                .replace(/;$/, '')
                .trim();


        const match =
            action.match(
                /^([A-Za-z_$][A-Za-z0-9_$]*)\s*\((.*)\)$/
            );

        if (!match) {

            console.warn(
                'Formati i butonit nuk u kuptua:',
                action
            );

            return;
        }


        const functionName =
            match[1];

        const rawArguments =
            match[2].trim();


        /*
         * Lejojme vetem funksionet qe perdor admini yne.
         */

        const allowedFunctions =
            new Set([
                'editProduct',
                'setProductActive',
                'setCategoryActive',
                'setPrimaryMedia',
                'deleteMedia',

                'loadSummary',
                'loadOrders',
                'loadProducts',
                'loadCategories',

                'showSection',
                'openProductModal',
                'closeProductModal',
                'logout'
            ]);


        if (
            !allowedFunctions.has(
                functionName
            )
        ) {

            console.warn(
                'Funksion inline i palejuar:',
                functionName,
                action
            );

            return;
        }


        const fn =
            window[functionName];


        if (
            typeof fn !==
            'function'
        ) {

            console.warn(
                'Funksioni nuk ekziston ne window:',
                functionName
            );

            return;
        }


        /*
         * Parser i vogel dhe i sigurt per argumente:
         *
         * 'uuid'
         * "uuid"
         * true
         * false
         * null
         * numra
         *
         * Nuk perdor eval.
         */

        function parseArguments(text) {

            if (!text) {
                return [];
            }

            const args = [];

            let current = '';
            let quote = null;
            let escaped = false;


            for (
                let i = 0;
                i < text.length;
                i++
            ) {

                const char =
                    text[i];


                if (escaped) {

                    current += char;
                    escaped = false;
                    continue;
                }


                if (
                    char === '\\' &&
                    quote
                ) {

                    escaped = true;
                    current += char;
                    continue;
                }


                if (
                    char === "'" ||
                    char === '"'
                ) {

                    if (!quote) {
                        quote = char;
                    }
                    else if (
                        quote === char
                    ) {
                        quote = null;
                    }

                    current += char;
                    continue;
                }


                if (
                    char === ',' &&
                    !quote
                ) {

                    args.push(
                        current.trim()
                    );

                    current = '';
                    continue;
                }


                current += char;
            }


            if (
                current.trim() !== ''
            ) {

                args.push(
                    current.trim()
                );
            }


            return args.map(
                value => {

                    if (
                        value === 'true'
                    ) {
                        return true;
                    }

                    if (
                        value === 'false'
                    ) {
                        return false;
                    }

                    if (
                        value === 'null'
                    ) {
                        return null;
                    }

                    if (
                        /^-?\d+(\.\d+)?$/.test(
                            value
                        )
                    ) {

                        return Number(
                            value
                        );
                    }


                    const singleQuoted =
                        value.match(
                            /^'(.*)'$/
                        );

                    if (
                        singleQuoted
                    ) {

                        return singleQuoted[1]
                            .replace(
                                /\\'/g,
                                "'"
                            );
                    }


                    const doubleQuoted =
                        value.match(
                            /^"(.*)"$/
                        );

                    if (
                        doubleQuoted
                    ) {

                        return doubleQuoted[1]
                            .replace(
                                /\\"/g,
                                '"'
                            );
                    }


                    /*
                     * Nuk ekzekutojme argumente te panjohura.
                     */

                    throw new Error(
                        'Argument i palejuar: ' +
                        value
                    );
                }
            );
        }


        try {

            const args =
                parseArguments(
                    rawArguments
                );


            /*
             * E ndalojme onclick inline qe Helmet e bllokon.
             * Pastaj e therrasim funksionin normalisht.
             */

            event.preventDefault();
            event.stopPropagation();


            await fn(
                ...args
            );


        } catch (error) {

            console.error(
                'Gabim gjate klikimit:',
                functionName,
                error
            );

            alert(
                error.message ||
                'Ndodhi nje gabim.'
            );
        }
    },
    true
);
