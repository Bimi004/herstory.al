const express = require('express');
const supabase = require('../config/supabase');
const requireAuth = require('../middleware/requireAuth');
const requireStaff = require('../middleware/requireStaff');
const { productSchema, productUpdateSchema } = require('../validators/productValidator');

const router = express.Router();

router.get('/', async (req, res, next) => {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('id,category_id,name,slug,sku,short_description,description,price,compare_at_price,stock_quantity,track_inventory,is_active,is_featured,weight_grams,meta_title,meta_description,created_at,updated_at')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            products: data
        });
    } catch (error) {
        next(error);
    }
});

router.post('/', requireAuth, requireStaff, async (req, res, next) => {
    try {
        const result = productSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: 'Te dhenat e produktit nuk jane te vlefshme',
                errors: result.error.flatten().fieldErrors
            });
        }

        const { data, error } = await supabase
            .from('products')
            .insert(result.data)
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            product: data
        });
    } catch (error) {
        next(error);
    }
});

router.patch('/:id', requireAuth, requireStaff, async (req, res, next) => {
    try {
        const result = productUpdateSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: 'Te dhenat e produktit nuk jane te vlefshme',
                errors: result.error.flatten().fieldErrors
            });
        }

        const { data, error } = await supabase
            .from('products')
            .update(result.data)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            product: data
        });
    } catch (error) {
        next(error);
    }
});

router.delete('/:id', requireAuth, requireStaff, async (req, res, next) => {
    try {
        const { data, error } = await supabase
            .from('products')
            .update({ is_active: false })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: 'Produkti u caktivizua',
            product: data
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;


