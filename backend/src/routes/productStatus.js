const express = require('express');

const supabase = require('../config/supabase');
const requireAuth = require('../middleware/requireAuth');
const requireStaff = require('../middleware/requireStaff');

const router = express.Router();

router.patch(
    '/:id/active',
    requireAuth,
    requireStaff,
    async (req, res, next) => {
        try {
            const { is_active } = req.body || {};

            if (typeof is_active !== 'boolean') {
                return res.status(400).json({
                    success: false,
                    message: 'Statusi nuk është i vlefshëm.'
                });
            }

            const { data, error } = await supabase
                .from('products')
                .update({ is_active })
                .eq('id', req.params.id)
                .select()
                .single();

            if (error) throw error;

            if (!data) {
                return res.status(404).json({
                    success: false,
                    message: 'Produkti nuk u gjet.'
                });
            }

            res.json({
                success: true,
                product: data
            });

        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;