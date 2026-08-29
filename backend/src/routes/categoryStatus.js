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

            const { is_active } =
                req.body || {};

            if (
                typeof is_active !==
                'boolean'
            ) {

                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            'Vlera e statusit nuk është e vlefshme.'
                    });
            }


            const {
                data,
                error
            } =
                await supabase
                    .from('categories')
                    .update({
                        is_active
                    })
                    .eq(
                        'id',
                        req.params.id
                    )
                    .select()
                    .single();


            if (error)
                throw error;


            if (!data) {

                return res
                    .status(404)
                    .json({
                        success: false,
                        message:
                            'Kategoria nuk u gjet.'
                    });
            }


            res.json({
                success: true,
                category: data
            });

        } catch (error) {

            next(error);
        }
    }
);


module.exports = router;