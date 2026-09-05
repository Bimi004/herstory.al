const express = require('express');
const supabase = require('../config/supabase');
const requireAuth = require('../middleware/requireAuth');
const requireStaff = require('../middleware/requireStaff');
const {
    productSchema,
    productUpdateSchema
} = require('../validators/productValidator');

const router = express.Router();


function slugify(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'produkt';
}


function cleanCategoryIds(value) {

    if (!Array.isArray(value)) {
        return [];
    }

    return [
        ...new Set(
            value.filter(Boolean)
        )
    ];
}


async function makeUniqueSlug(name) {

    const base = slugify(name);

    let candidate = base;
    let suffix = 2;

    while (true) {

        const { data, error } =
            await supabase
                .from('products')
                .select('id')
                .eq('slug', candidate)
                .limit(1);

        if (error) {
            throw error;
        }

        if (!data || data.length === 0) {
            return candidate;
        }

        candidate = `${base}-${suffix}`;
        suffix += 1;
    }
}


async function getCategoryIds(productId) {

    const { data, error } =
        await supabase
            .from('product_categories')
            .select('category_id')
            .eq('product_id', productId);

    if (error) {
        throw error;
    }

    return (data || [])
        .map(row => row.category_id);
}


async function replaceCategories(
    productId,
    categoryIds
) {

    const ids =
        cleanCategoryIds(categoryIds);

    const { error: deleteError } =
        await supabase
            .from('product_categories')
            .delete()
            .eq('product_id', productId);

    if (deleteError) {
        throw deleteError;
    }

    if (!ids.length) {
        return;
    }

    const rows =
        ids.map(categoryId => ({
            product_id: productId,
            category_id: categoryId
        }));

    const { error: insertError } =
        await supabase
            .from('product_categories')
            .insert(rows);

    if (insertError) {
        throw insertError;
    }
}


async function addCategoriesToProducts(products) {

    if (!products.length) {
        return products;
    }

    const productIds =
        products.map(product => product.id);

    const { data, error } =
        await supabase
            .from('product_categories')
            .select('product_id,category_id')
            .in('product_id', productIds);

    if (error) {
        throw error;
    }

    const map = new Map();

    for (const row of data || []) {

        if (!map.has(row.product_id)) {
            map.set(row.product_id, []);
        }

        map.get(row.product_id)
            .push(row.category_id);
    }

    return products.map(product => ({

        ...product,

        category_ids:
            map.get(product.id) ||
            (
                product.category_id
                    ? [product.category_id]
                    : []
            )
    }));
}


/*
    PUBLIC PRODUCTS
*/
router.get('/', async (req, res, next) => {

    try {

        const { data, error } =
            await supabase
                .from('products')
                .select(
                    'id,category_id,name,slug,sku,short_description,description,price,compare_at_price,stock_quantity,track_inventory,is_active,is_featured,weight_grams,meta_title,meta_description,created_at,updated_at'
                )
                .eq('is_active', true)
                .order(
                    'created_at',
                    { ascending: false }
                );

        if (error) {
            throw error;
        }

        const products =
            await addCategoriesToProducts(
                data || []
            );

        res.json({
            success: true,
            products
        });

    } catch (error) {
        next(error);
    }
});


/*
    ADMIN - GET CATEGORIES FOR ONE PRODUCT
    Perdoret edhe kur lista admin vjen nga nje endpoint tjeter.
*/
router.get(
    '/:id/categories',
    requireAuth,
    requireStaff,
    async (req, res, next) => {

        try {

            const categoryIds =
                await getCategoryIds(
                    req.params.id
                );

            res.json({
                success: true,
                category_ids: categoryIds
            });

        } catch (error) {
            next(error);
        }
    }
);


/*
    CREATE PRODUCT
*/
router.post(
    '/',
    requireAuth,
    requireStaff,
    async (req, res, next) => {

        let createdProductId = null;

        try {

            const incoming = {
                ...req.body
            };

            /*
                Slug krijohet nga emri.
                Pronari nuk merret me te.
            */
            incoming.slug =
                await makeUniqueSlug(
                    incoming.name
                );

            const result =
                productSchema.safeParse(
                    incoming
                );

            if (!result.success) {

                return res
                    .status(400)
                    .json({
                        success: false,

                        message:
                            'Te dhenat e produktit nuk jane te vlefshme',

                        errors:
                            result.error
                                .flatten()
                                .fieldErrors
                    });
            }

            const {
                category_ids,
                ...productData
            } = result.data;

            const ids =
                cleanCategoryIds(
                    category_ids
                );

            /*
                Legacy category_id mbahet.
                Kjo ruan kompatibilitetin me kodin e vjeter.
            */
            productData.category_id =
                ids[0] ||
                productData.category_id ||
                null;

            const { data, error } =
                await supabase
                    .from('products')
                    .insert(productData)
                    .select()
                    .single();

            if (error) {

                const text =
                    String(
                        error.message || ''
                    ).toLowerCase();

                if (
                    error.code === '23505' &&
                    text.includes('sku')
                ) {

                    return res
                        .status(409)
                        .json({
                            success: false,
                            message:
                                'Ky SKU ekziston tashme. Vendos nje SKU tjeter.'
                        });
                }

                throw error;
            }

            createdProductId =
                data.id;

            await replaceCategories(
                data.id,
                ids
            );

            res
                .status(201)
                .json({
                    success: true,

                    product: {
                        ...data,
                        category_ids: ids
                    }
                });

        } catch (error) {

            /*
                Nese deshton vetem produkti i sapokrijuar,
                pastrohet ai rekord.
            */
            if (createdProductId) {

                try {

                    await supabase
                        .from('products')
                        .delete()
                        .eq(
                            'id',
                            createdProductId
                        );

                } catch (
                    cleanupError
                ) {

                    console.error(
                        'Product cleanup failed:',
                        cleanupError
                    );
                }
            }

            next(error);
        }
    }
);


/*
    EDIT PRODUCT
*/
router.patch(
    '/:id',
    requireAuth,
    requireStaff,
    async (req, res, next) => {

        try {

            const result =
                productUpdateSchema.safeParse(
                    req.body
                );

            if (!result.success) {

                return res
                    .status(400)
                    .json({
                        success: false,

                        message:
                            'Te dhenat e produktit nuk jane te vlefshme',

                        errors:
                            result.error
                                .flatten()
                                .fieldErrors
                    });
            }

            const {
                category_ids,
                ...productData
            } = result.data;

            /*
                Nuk ndryshojme slug ne edit.
                URL mbetet stabile.
            */
            delete productData.slug;

            let ids = null;

            if (category_ids !== undefined) {

                ids =
                    cleanCategoryIds(
                        category_ids
                    );

                productData.category_id =
                    ids[0] || null;
            }

            const { data, error } =
                await supabase
                    .from('products')
                    .update(productData)
                    .eq(
                        'id',
                        req.params.id
                    )
                    .select()
                    .single();

            if (error) {

                const text =
                    String(
                        error.message || ''
                    ).toLowerCase();

                if (
                    error.code === '23505' &&
                    text.includes('sku')
                ) {

                    return res
                        .status(409)
                        .json({
                            success: false,
                            message:
                                'Ky SKU ekziston tashme. Vendos nje SKU tjeter.'
                        });
                }

                throw error;
            }

            if (ids !== null) {

                await replaceCategories(
                    req.params.id,
                    ids
                );
            }
            else {

                ids =
                    await getCategoryIds(
                        req.params.id
                    );
            }

            res.json({
                success: true,

                product: {
                    ...data,
                    category_ids: ids
                }
            });

        } catch (error) {
            next(error);
        }
    }
);


router.delete(
    '/:id',
    requireAuth,
    requireStaff,
    async (req, res, next) => {

        try {

            const { data, error } =
                await supabase
                    .from('products')
                    .update({
                        is_active: false
                    })
                    .eq(
                        'id',
                        req.params.id
                    )
                    .select()
                    .single();

            if (error) {
                throw error;
            }

            res.json({
                success: true,
                message:
                    'Produkti u caktivizua',
                product: data
            });

        } catch (error) {
            next(error);
        }
    }
);


module.exports = router;