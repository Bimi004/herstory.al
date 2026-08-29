const express = require('express');
const supabase = require('../config/supabase');
const requireAuth = require('../middleware/requireAuth');
const requireStaff = require('../middleware/requireStaff');

const router = express.Router();

router.use(requireAuth, requireStaff);

router.get('/products', async (req, res, next) => {
    try {
        const { data, error } = await supabase
            .from('products')
            .select(`
                id,
                category_id,
                name,
                slug,
                sku,
                short_description,
                description,
                price,
                compare_at_price,
                cost_price,
                stock_quantity,
                low_stock_threshold,
                track_inventory,
                is_active,
                is_featured,
                weight_grams,
                meta_title,
                meta_description,
                created_at,
                updated_at
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            products: data || []
        });
    } catch (error) {
        next(error);
    }
});

router.get('/categories', async (req, res, next) => {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('sort_order', { ascending: true })
            .order('name', { ascending: true });

        if (error) throw error;

        res.json({
            success: true,
            categories: data || []
        });
    } catch (error) {
        next(error);
    }
});

router.get('/summary', async (req, res, next) => {
    try {
        const [
            productsResult,
            ordersResult,
            categoriesResult
        ] = await Promise.all([
            supabase
                .from('products')
                .select('id,stock_quantity,low_stock_threshold,is_active'),

            supabase
                .from('orders')
                .select('id,total_amount,order_status,payment_status'),

            supabase
                .from('categories')
                .select('id,is_active')
        ]);

        if (productsResult.error) throw productsResult.error;
        if (ordersResult.error) throw ordersResult.error;
        if (categoriesResult.error) throw categoriesResult.error;

        const products = productsResult.data || [];
        const orders = ordersResult.data || [];
        const categories = categoriesResult.data || [];

        const activeProducts = products.filter(p => p.is_active);

        const lowStock = activeProducts.filter(
            p => Number(p.stock_quantity) <= Number(p.low_stock_threshold)
        );

        const newOrders = orders.filter(
            o => o.order_status === 'new'
        );

        const activeOrders = orders.filter(
            o => !['cancelled', 'returned'].includes(o.order_status)
        );

        const revenue = activeOrders.reduce(
            (sum, o) => sum + Number(o.total_amount || 0),
            0
        );

        res.json({
            success: true,
            summary: {
                products: products.length,
                active_products: activeProducts.length,
                low_stock: lowStock.length,
                categories: categories.filter(c => c.is_active).length,
                orders: orders.length,
                new_orders: newOrders.length,
                revenue
            }
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router;
