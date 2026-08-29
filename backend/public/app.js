const API =
    window.HERSTORY_CONFIG?.API_BASE || '';

let products = [];
let categories = [];

let selectedCategory =
    'all';

let cart =
    JSON.parse(
        localStorage.getItem(
            'herstory_cart'
        ) || '[]'
    );


const productsGrid =
    document.getElementById(
        'productsGrid'
    );

const productsLoading =
    document.getElementById(
        'productsLoading'
    );

const categoryFilters =
    document.getElementById(
        'categoryFilters'
    );

const searchInput =
    document.getElementById(
        'searchInput'
    );

const cartDrawer =
    document.getElementById(
        'cartDrawer'
    );

const cartOverlay =
    document.getElementById(
        'cartOverlay'
    );

const cartItems =
    document.getElementById(
        'cartItems'
    );

const cartCount =
    document.getElementById(
        'cartCount'
    );

const cartTotal =
    document.getElementById(
        'cartTotal'
    );

const checkoutModal =
    document.getElementById(
        'checkoutModal'
    );


const TEXT = {

    all:
        'T\u00EB gjitha',

    noProducts:
        'Nuk u gjet asnj\u00EB produkt.',

    noStock:
        'Produkti nuk ka stok.',

    cartEmpty:
        'Shporta \u00EBsht\u00EB bosh.',

    imageUnavailable:
        'Foto nuk mund t\u00EB shfaqet.',

    orderSending:
        'Duke regjistruar porosin\u00EB...',

    orderSuccess:
        'Porosia u regjistrua me sukses.'
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


async function apiFetch(
    path,
    options = {}
) {

    const response =
        await fetch(
            API + path,
            options
        );

    const data =
        await response
            .json()
            .catch(() => ({}));

    if (!response.ok) {

        throw new Error(
            data.message ||
            'Ndodhi nj\u00EB gabim.'
        );
    }

    return data;
}


async function loadStore() {

    try {

        const [
            productResult,
            categoryResult
        ] =
            await Promise.all([
                apiFetch(
                    '/api/products'
                ),

                apiFetch(
                    '/api/categories'
                )
            ]);


        products =
            productResult.products || [];

        categories =
            categoryResult.categories || [];


        await Promise.all(

            products.map(
                async product => {

                    try {

                        const result =
                            await apiFetch(
                                '/api/media/product/' +
                                product.id
                            );

                        product.media =
                            result.media || [];

                    } catch (error) {

                        product.media = [];

                        console.error(
                            'Media error:',
                            product.id,
                            error
                        );
                    }
                }
            )
        );


        renderCategories();

        renderProducts();

        productsLoading.style.display =
            'none';

    } catch (error) {

        productsLoading.textContent =
            'Produktet nuk mund t\u00EB ngarkohen.';

        console.error(error);
    }
}


function renderCategories() {

    categoryFilters.innerHTML =
        `
        <button
            class="filter-button active"
            data-category="all"
        >
            ${TEXT.all}
        </button>
        ` +
        categories
            .map(category => `
                <button
                    class="filter-button"
                    data-category="${category.id}"
                >
                    ${escapeHtml(
                        category.name
                    )}
                </button>
            `)
            .join('');


    categoryFilters
        .querySelectorAll(
            '.filter-button'
        )
        .forEach(button => {

            button.addEventListener(
                'click',
                () => {

                    selectedCategory =
                        button.dataset.category;

                    categoryFilters
                        .querySelectorAll(
                            '.filter-button'
                        )
                        .forEach(item => {

                            item.classList
                                .remove(
                                    'active'
                                );
                        });

                    button.classList
                        .add('active');

                    renderProducts();
                }
            );
        });
}


function getProductMedia(
    product
) {

    const primary =
        product.media?.find(
            item =>
                item.is_primary
        );

    return (
        primary ||
        product.media?.[0] ||
        null
    );
}


function productMediaHtml(
    product
) {

    const media =
        getProductMedia(product);

    if (
        !media ||
        !media.public_url
    ) {

        return `
            <div class="no-image">

                <strong>
                    herstory.al
                </strong>

                <span>
                    Pa foto
                </span>

            </div>
        `;
    }


    if (
        media.media_type ===
        'video'
    ) {

        return `
            <video
                src="${media.public_url}"
                muted
                playsinline
                preload="metadata"
            ></video>
        `;
    }


    return `
        <img
            src="${media.public_url}"
            alt="${escapeHtml(
                product.name
            )}"
            loading="lazy"
            onerror="handleImageError(this)"
        >
    `;
}


function renderProducts() {

    const query =
        searchInput.value
            .trim()
            .toLowerCase();


    const filtered =
        products.filter(
            product => {

                const categoryMatch =
                    selectedCategory ===
                        'all' ||
                    product.category_id ===
                        selectedCategory;

                const searchable =
                    (
                        product.name +
                        ' ' +
                        (
                            product.short_description ||
                            ''
                        ) +
                        ' ' +
                        (
                            product.description ||
                            ''
                        )
                    )
                        .toLowerCase();

                const searchMatch =
                    !query ||
                    searchable.includes(
                        query
                    );

                return (
                    categoryMatch &&
                    searchMatch
                );
            }
        );


    if (!filtered.length) {

        productsGrid.innerHTML =
            `
            <div class="state-box">
                ${TEXT.noProducts}
            </div>
            `;

        return;
    }


    productsGrid.innerHTML =
        filtered
            .map(product => `

                <article
                    class="product-card"
                >

                    <div class="product-image">

                        ${productMediaHtml(
                            product
                        )}

                    </div>


                    <div class="product-info">

                        <h3>
                            ${escapeHtml(
                                product.name
                            )}
                        </h3>


                        <div class="product-bottom">

                            <div class="price-wrap">

                                <span class="price">

                                    ${money(
                                        product.price
                                    )}

                                </span>


                                ${
                                    product.compare_at_price

                                    ? `
                                    <span class="old-price">

                                        ${money(
                                            product.compare_at_price
                                        )}

                                    </span>
                                    `

                                    : ''
                                }

                            </div>


                            <button
                                class="add-button"
                                data-product-id="${product.id}"
                                aria-label="Shto n\u00EB shport\u00EB"
                            >
                                +
                            </button>

                        </div>

                    </div>

                </article>

            `)
            .join('');


    productsGrid
        .querySelectorAll(
            '.add-button'
        )
        .forEach(button => {

            button.addEventListener(
                'click',
                () => {

                    addToCart(
                        button.dataset
                            .productId
                    );
                }
            );
        });
}


window.handleImageError =
function(img) {

    const wrapper =
        img.closest(
            '.product-image'
        );

    if (!wrapper)
        return;

    wrapper.innerHTML =
        `
        <div class="no-image">

            <strong>
                herstory.al
            </strong>

            <span>
                ${TEXT.imageUnavailable}
            </span>

        </div>
        `;
};


function addToCart(
    productId
) {

    const product =
        products.find(
            item =>
                item.id ===
                productId
        );

    if (!product)
        return;


    if (
        product.track_inventory &&
        Number(
            product.stock_quantity
        ) <= 0
    ) {

        alert(
            TEXT.noStock
        );

        return;
    }


    const existing =
        cart.find(
            item =>
                item.product_id ===
                productId
        );


    if (existing) {

        if (
            product.track_inventory &&
            existing.quantity >=
                Number(
                    product.stock_quantity
                )
        ) {

            alert(
                TEXT.noStock
            );

            return;
        }

        existing.quantity += 1;

    } else {

        const media =
            getProductMedia(
                product
            );

        cart.push({
            product_id:
                product.id,

            name:
                product.name,

            price:
                Number(
                    product.price
                ),

            quantity:
                1,

            image:
                media?.media_type ===
                    'image'
                ? media.public_url
                : ''
        });
    }


    saveCart();

    openCart();
}


function saveCart() {

    localStorage.setItem(
        'herstory_cart',
        JSON.stringify(cart)
    );

    renderCart();
}


function renderCart() {

    const itemCount =
        cart.reduce(
            (
                total,
                item
            ) =>
                total +
                item.quantity,
            0
        );

    cartCount.textContent =
        itemCount;


    if (!cart.length) {

        cartItems.innerHTML =
            `
            <div class="cart-empty">
                ${TEXT.cartEmpty}
            </div>
            `;

        cartTotal.textContent =
            money(0);

        return;
    }


    cartItems.innerHTML =
        cart.map(item => `

            <div class="cart-item">

                ${
                    item.image

                    ? `
                    <img
                        class="cart-thumb"
                        src="${item.image}"
                        alt=""
                        onerror="this.style.visibility='hidden'"
                    >
                    `

                    : `
                    <div class="cart-thumb">
                    </div>
                    `
                }


                <div>

                    <h4>
                        ${escapeHtml(
                            item.name
                        )}
                    </h4>

                    <div class="cart-item-price">
                        ${money(
                            item.price
                        )}
                    </div>


                    <div class="qty-controls">

                        <button
                            data-action="minus"
                            data-id="${item.product_id}"
                        >
                            -
                        </button>

                        <span>
                            ${item.quantity}
                        </span>

                        <button
                            data-action="plus"
                            data-id="${item.product_id}"
                        >
                            +
                        </button>

                    </div>

                </div>


                <button
                    class="remove-button"
                    data-action="remove"
                    data-id="${item.product_id}"
                >
                    Hiq
                </button>

            </div>

        `).join('');


    cartItems
        .querySelectorAll(
            'button[data-action]'
        )
        .forEach(button => {

            button.addEventListener(
                'click',
                () => {

                    updateCartItem(
                        button.dataset.id,
                        button.dataset.action
                    );
                }
            );
        });


    const total =
        cart.reduce(
            (
                sum,
                item
            ) =>
                sum +
                item.price *
                item.quantity,
            0
        );

    cartTotal.textContent =
        money(total);
}


function updateCartItem(
    productId,
    action
) {

    const item =
        cart.find(
            cartItem =>
                cartItem.product_id ===
                productId
        );

    if (!item)
        return;


    if (
        action ===
        'remove'
    ) {

        cart =
            cart.filter(
                cartItem =>
                    cartItem.product_id !==
                    productId
            );

        saveCart();

        return;
    }


    if (
        action ===
        'minus'
    ) {

        item.quantity -= 1;

        if (
            item.quantity <= 0
        ) {

            cart =
                cart.filter(
                    cartItem =>
                        cartItem.product_id !==
                        productId
                );
        }

        saveCart();

        return;
    }


    if (
        action ===
        'plus'
    ) {

        const product =
            products.find(
                product =>
                    product.id ===
                    productId
            );

        if (
            product?.track_inventory &&
            item.quantity >=
                Number(
                    product.stock_quantity
                )
        ) {

            alert(
                TEXT.noStock
            );

            return;
        }

        item.quantity += 1;

        saveCart();
    }
}


function openCart() {

    cartDrawer.classList
        .add('open');

    cartOverlay.classList
        .add('open');
}


function closeCart() {

    cartDrawer.classList
        .remove('open');

    cartOverlay.classList
        .remove('open');
}


document
    .getElementById(
        'cartButton'
    )
    .addEventListener(
        'click',
        openCart
    );


document
    .getElementById(
        'closeCartButton'
    )
    .addEventListener(
        'click',
        closeCart
    );


cartOverlay
    .addEventListener(
        'click',
        closeCart
    );


document
    .getElementById(
        'searchButton'
    )
    .addEventListener(
        'click',
        () => {

            document
                .getElementById(
                    'shop'
                )
                .scrollIntoView();

            setTimeout(
                () => {
                    searchInput.focus();
                },
                250
            );
        }
    );


searchInput
    .addEventListener(
        'input',
        renderProducts
    );


document
    .getElementById(
        'checkoutButton'
    )
    .addEventListener(
        'click',
        () => {

            if (!cart.length) {

                alert(
                    TEXT.cartEmpty
                );

                return;
            }

            closeCart();

            checkoutModal
                .classList
                .add('open');
        }
    );


document
    .getElementById(
        'closeCheckoutButton'
    )
    .addEventListener(
        'click',
        () => {

            checkoutModal
                .classList
                .remove('open');
        }
    );


document
    .getElementById(
        'checkoutForm'
    )
    .addEventListener(
        'submit',
        async event => {

            event.preventDefault();

            const button =
                document.getElementById(
                    'submitOrderButton'
                );

            const message =
                document.getElementById(
                    'checkoutMessage'
                );

            const form =
                new FormData(
                    event.target
                );


            button.disabled =
                true;

            message.textContent =
                TEXT.orderSending;


            try {

                const payload = {

                    customer_name:
                        form.get(
                            'customer_name'
                        ),

                    customer_phone:
                        form.get(
                            'customer_phone'
                        ),

                    customer_email:
                        form.get(
                            'customer_email'
                        ) || null,

                    shipping_city:
                        form.get(
                            'shipping_city'
                        ),

                    shipping_address:
                        form.get(
                            'shipping_address'
                        ),

                    shipping_postal_code:
                        form.get(
                            'shipping_postal_code'
                        ) || null,

                    customer_notes:
                        form.get(
                            'customer_notes'
                        ) || null,

                    items:
                        cart.map(
                            item => ({
                                product_id:
                                    item.product_id,

                                quantity:
                                    item.quantity
                            })
                        )
                };


                const result =
                    await apiFetch(
                        '/api/orders',
                        {
                            method:
                                'POST',

                            headers: {
                                'Content-Type':
                                    'application/json'
                            },

                            body:
                                JSON.stringify(
                                    payload
                                )
                        }
                    );


                message.textContent =
                    TEXT.orderSuccess +
                    ' #' +
                    result.order.order_number;


                cart = [];

                saveCart();

                event.target.reset();


                setTimeout(
                    () => {

                        checkoutModal
                            .classList
                            .remove('open');

                        message.textContent =
                            '';

                    },
                    2300
                );


            } catch (error) {

                message.textContent =
                    error.message;

            } finally {

                button.disabled =
                    false;
            }
        }
    );


renderCart();

loadStore();