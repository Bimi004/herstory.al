const express = require('express');
const supabase = require('../config/supabase');
const requireAuth = require('../middleware/requireAuth');
const requireStaff = require('../middleware/requireStaff');

const router = express.Router();

router.get('/', async (req, res, next) => {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('id,name,slug,description,image_url,is_active,sort_order,created_at,updated_at')
            .eq('is_active', true)
            .order('sort_order', { ascending: true })
            .order('name', { ascending: true });

        if (error) throw error;

        res.json({
            success: true,
            categories: data
        });
    } catch (error) {
        next(error);
    }
});

router.post('/', requireAuth, requireStaff, async (req, res, next) => {
    try {
        const { name, slug, description = null, image_url = null, sort_order = 0 } = req.body;

        if (!name || !slug) {
            return res.status(400).json({
                success: false,
                message: 'Emri dhe slug jane te detyrueshem'
            });
        }

        const { data, error } = await supabase
            .from('categories')
            .insert({
                name,
                slug,
                description,
                image_url,
                sort_order,
                is_active: true
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            category: data
        });
    } catch (error) {
        next(error);
    }
});

router.patch('/:id', requireAuth, requireStaff, async (req, res, next) => {
    try {
        const allowed = ['name', 'slug', 'description', 'image_url', 'sort_order', 'is_active'];
        const updateData = {};

        for (const key of allowed) {
            if (Object.prototype.hasOwnProperty.call(req.body, key)) {
                updateData[key] = req.body[key];
            }
        }

        const { data, error } = await supabase
            .from('categories')
            .update(updateData)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            category: data
        });
    } catch (error) {
        next(error);
    }
});

router.delete('/:id', requireAuth, requireStaff, async (req, res, next) => {
    try {
        const { data, error } = await supabase
            .from('categories')
            .update({ is_active: false })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: 'Kategoria u caktivizua',
            category: data
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;

