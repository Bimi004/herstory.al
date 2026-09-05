(function () {
    'use strict';

    const MARKER = 'HERSTORY_PRODUCT_DETAILS_SAFE_V1';

    if (window.__HERSTORY_PRODUCT_DETAILS_SAFE_V1__) {
        return;
    }

    window.__HERSTORY_PRODUCT_DETAILS_SAFE_V1__ = true;

    let activeProductId = null;
    let activeMediaId = null;


    function esc(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }


    function moneyLek(value) {
        const amount = Number(value || 0);

        return new Intl.NumberFormat(
            'sq-AL',
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }
        ).format(amount) + ' Lek';
    }


    function getProducts() {
        return Array.isArray(window.products)
            ? window.products
            : [];
    }


    function getProduct(productId) {
        return getProducts().find(
            item => String(item.id) === String(productId)
        );
    }


    function getMediaList(product) {
        return Array.isArray(product?.media)
            ? product.media
            : [];
    }


    function getCoverImage(product) {
        const media = getMediaList(product);

        return (
            media.find(
                item =>
                    item.is_primary &&
                    item.media_type === 'image'
            ) ||
            media.find(
                item =>
                    item.media_type === 'image'
            ) ||
            null
        );
    }


    function ensureModal() {
        let modal = document.getElementById(
            'productDetailsModal'
        );

        if (modal) {
            return modal;
        }

        modal = document.createElement('div');
        modal.id = 'productDetailsModal';
        modal.className = 'product-details-modal';
        modal.setAttribute('aria-hidden', 'true');

        modal.innerHTML = `
            <div
                class="product-details-backdrop"
                data-product-close
            ></div>

            <div
                class="product-details-card"
                role="dialog"
                aria-modal="true"
                aria-label="Detajet e produktit"
            >
                <button
                    type="button"
                    class="product-details-close"
                    data-product-close
                    aria-label="Mbyll"
                >
                    &times;
                </button>

                <div
                    id="productDetailsContent"
                    class="product-details-content"
                ></div>
            </div>
        `;

        document.body.appendChild(modal);

        modal
            .querySelectorAll('[data-product-close]')
            .forEach(el => {
                el.addEventListener(
                    'click',
                    closeProductDetails
                );
            });

        return modal;
    }


    function mainMediaHtml(media) {
        if (!media?.public_url) {
            return `
                <div class="product-detail-no-media">
                    <strong>herstory.al</strong>
                    <span>Pa media</span>
                </div>
            `;
        }

        if (media.media_type === 'video') {
            return `
                <video
                    class="product-detail-main-video"
                    src="${esc(media.public_url)}"
                    controls
                    playsinline
                    preload="metadata"
                ></video>
            `;
        }

        return `
            <img
                class="product-detail-main-image"
                src="${esc(media.public_url)}"
                alt=""
            >
        `;
    }


    function thumbHtml(media, active) {
        const activeClass = active
            ? ' active'
            : '';

        if (media.media_type === 'video') {
            return `
                <button
                    type="button"
                    class="product-media-thumb video-thumb${activeClass}"
                    data-media-id="${esc(media.id)}"
                >
                    <video
                        src="${esc(media.public_url)}"
                        muted
                        playsinline
                        preload="metadata"
                    ></video>

                    <span class="video-play-badge">
                        ▶
                    </span>
                </button>
            `;
        }

        return `
            <button
                type="button"
                class="product-media-thumb${activeClass}"
                data-media-id="${esc(media.id)}"
            >
                <img
                    src="${esc(media.public_url)}"
                    alt=""
                    loading="lazy"
                >
            </button>
        `;
    }


    function renderModal() {
        const product = getProduct(
            activeProductId
        );

        if (!product) {
            return;
        }

        const modal = ensureModal();

        const content =
            modal.querySelector(
                '#productDetailsContent'
            );

        const mediaList =
            getMediaList(product);

        if (
            !activeMediaId ||
            !mediaList.some(
                item =>
                    String(item.id) ===
                    String(activeMediaId)
            )
        ) {
            const cover =
                getCoverImage(product);

            activeMediaId =
                cover?.id ||
                mediaList[0]?.id ||
                null;
        }

        const activeMedia =
            mediaList.find(
                item =>
                    String(item.id) ===
                    String(activeMediaId)
            ) ||
            mediaList[0] ||
            null;

        content.innerHTML = `
            <div class="product-details-layout">

                <div class="product-details-gallery">

                    <div class="product-detail-main">
                        ${mainMediaHtml(activeMedia)}
                    </div>

                    ${
                        mediaList.length > 1
                            ? `
                            <div class="product-media-thumbnails">
                                ${mediaList
                                    .map(media =>
                                        thumbHtml(
                                            media,
                                            String(media.id) ===
                                            String(activeMediaId)
                                        )
                                    )
                                    .join('')
                                }
                            </div>
                            `
                            : ''
                    }

                </div>


                <div class="product-details-info">

                    <span class="product-detail-eyebrow">
                        HERSTORY
                    </span>

                    <h2>
                        ${esc(product.name)}
                    </h2>

                    ${
                        product.short_description
                            ? `
                            <p class="product-detail-short">
                                ${esc(
                                    product.short_description
                                )}
                            </p>
                            `
                            : ''
                    }

                    <div class="product-detail-price-row">

                        <strong class="product-detail-price">
                            ${moneyLek(product.price)}
                        </strong>

                        ${
                            product.compare_at_price
                                ? `
                                <span class="product-detail-old-price">
                                    ${moneyLek(
                                        product.compare_at_price
                                    )}
                                </span>
                                `
                                : ''
                        }

                    </div>

                    ${
                        product.description
                            ? `
                            <div class="product-detail-description">

                                <h3>
                                    Përshkrimi
                                </h3>

                                <p>
                                    ${esc(
                                        product.description
                                    )}
                                </p>

                            </div>
                            `
                            : ''
                    }

                    <button
                        type="button"
                        id="productDetailsAddButton"
                        class="product-detail-add-button"
                    >
                        Shto në shportë
                    </button>

                </div>
            </div>
        `;

        content
            .querySelectorAll(
                '.product-media-thumb'
            )
            .forEach(button => {
                button.addEventListener(
                    'click',
                    () => {
                        activeMediaId =
                            button.dataset.mediaId;

                        renderModal();
                    }
                );
            });

        const addButton =
            content.querySelector(
                '#productDetailsAddButton'
            );

        if (
            addButton &&
            typeof window.addToCart === 'function'
        ) {
            addButton.addEventListener(
                'click',
                () => {
                    const id =
                        activeProductId;

                    closeProductDetails();

                    window.addToCart(id);
                }
            );
        }
    }


    function openProductDetails(productId) {
        const product =
            getProduct(productId);

        if (!product) {
            return;
        }

        activeProductId =
            productId;

        const cover =
            getCoverImage(product);

        activeMediaId =
            cover?.id ||
            getMediaList(product)[0]?.id ||
            null;

        const modal =
            ensureModal();

        renderModal();

        modal.classList.add('open');

        modal.setAttribute(
            'aria-hidden',
            'false'
        );

        document.body.classList.add(
            'product-modal-open'
        );
    }


    function closeProductDetails() {
        const modal =
            document.getElementById(
                'productDetailsModal'
            );

        if (!modal) {
            return;
        }

        modal.classList.remove('open');

        modal.setAttribute(
            'aria-hidden',
            'true'
        );

        document.body.classList.remove(
            'product-modal-open'
        );

        modal
            .querySelectorAll('video')
            .forEach(video => {
                try {
                    video.pause();
                } catch (_) {}
            });

        activeProductId = null;
        activeMediaId = null;
    }


    function enhanceCards() {
        const cards =
            document.querySelectorAll(
                '.product-card'
            );

        cards.forEach(card => {
            if (
                card.dataset.herstoryEnhanced ===
                '1'
            ) {
                return;
            }

            const addButton =
                card.querySelector(
                    '.add-button'
                );

            const productId =
                addButton?.dataset.productId;

            if (!productId) {
                return;
            }

            card.dataset.herstoryEnhanced =
                '1';

            card.dataset.productId =
                productId;

            card.classList.add(
                'product-card-clickable'
            );

            card.setAttribute(
                'tabindex',
                '0'
            );

            card.setAttribute(
                'role',
                'button'
            );


            const product =
                getProduct(productId);

            if (product) {

                const info =
                    card.querySelector(
                        '.product-info'
                    );

                const title =
                    info?.querySelector('h3');

                if (
                    info &&
                    title &&
                    product.short_description &&
                    !info.querySelector(
                        '.product-short-description'
                    )
                ) {
                    const p =
                        document.createElement(
                            'p'
                        );

                    p.className =
                        'product-short-description';

                    p.textContent =
                        product.short_description;

                    title.insertAdjacentElement(
                        'afterend',
                        p
                    );
                }


                const imageBox =
                    card.querySelector(
                        '.product-image'
                    );

                const cover =
                    getCoverImage(product);

                if (
                    imageBox &&
                    cover?.public_url
                ) {
                    imageBox.innerHTML = '';

                    const img =
                        document.createElement(
                            'img'
                        );

                    img.src =
                        cover.public_url;

                    img.alt =
                        product.name || '';

                    img.loading =
                        'lazy';

                    imageBox.appendChild(img);
                }


                const price =
                    card.querySelector(
                        '.price'
                    );

                if (price) {
                    price.textContent =
                        moneyLek(
                            product.price
                        );
                }


                const oldPrice =
                    card.querySelector(
                        '.old-price'
                    );

                if (
                    oldPrice &&
                    product.compare_at_price
                ) {
                    oldPrice.textContent =
                        moneyLek(
                            product.compare_at_price
                        );
                }
            }


            card.addEventListener(
                'click',
                event => {

                    if (
                        event.target.closest(
                            '.add-button'
                        )
                    ) {
                        return;
                    }

                    openProductDetails(
                        productId
                    );
                }
            );


            card.addEventListener(
                'keydown',
                event => {

                    if (
                        event.key !== 'Enter' &&
                        event.key !== ' '
                    ) {
                        return;
                    }

                    if (
                        event.target.closest(
                            '.add-button'
                        )
                    ) {
                        return;
                    }

                    event.preventDefault();

                    openProductDetails(
                        productId
                    );
                }
            );
        });


        document
            .querySelectorAll(
                '.cart-item-price'
            )
            .forEach(el => {
                const text =
                    el.textContent || '';

                const numeric =
                    Number(
                        text
                            .replace(/[^\d.,-]/g, '')
                            .replace(/\./g, '')
                            .replace(',', '.')
                    );

                if (
                    Number.isFinite(numeric)
                ) {
                    el.textContent =
                        moneyLek(numeric);
                }
            });


        const cartTotal =
            document.getElementById(
                'cartTotal'
            );

        if (
            cartTotal &&
            Array.isArray(window.cart)
        ) {
            const total =
                window.cart.reduce(
                    (sum, item) =>
                        sum +
                        Number(item.price || 0) *
                        Number(item.quantity || 0),
                    0
                );

            cartTotal.textContent =
                moneyLek(total);
        }
    }


    /*
    HERSTORY_FREEZE_FIX_V1

    MutationObserver u hoq sepse ndryshimet qe
    enhanceCards() bente ne DOM mund ta ndiznin
    observer-in perseri.

    Ky version kontrollon DOM-in ne menyre te kufizuar.
    */

    let enhanceScheduled = false;

    const observer =
        new MutationObserver(
            mutations => {

                const relevant =
                    mutations.some(
                        mutation =>
                            Array.from(
                                mutation.addedNodes || []
                            ).some(
                                node =>
                                    node.nodeType === 1 &&
                                    (
                                        node.matches?.(
                                            '.product-card'
                                        ) ||
                                        node.querySelector?.(
                                            '.product-card'
                                        )
                                    )
                            )
                    );

                if (
                    !relevant ||
                    enhanceScheduled
                ) {
                    return;
                }

                enhanceScheduled = true;

                requestAnimationFrame(
                    () => {
                        enhanceScheduled = false;
                        enhanceCards();
                    }
                );
            }
        );

    observer.observe(
        document.body,
        {
            childList: true,
            subtree: true
        }
    );


    document.addEventListener(
        'keydown',
        event => {
            if (event.key === 'Escape') {
                closeProductDetails();
            }
        }
    );


    enhanceCards();


    window.openProductDetails =
        openProductDetails;

    window.closeProductDetails =
        closeProductDetails;

    window.moneyLek =
        moneyLek;

})();