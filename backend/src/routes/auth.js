const express = require('express');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = require('../config/supabase');

const router = express.Router();

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Shumë tentativa hyrjeje. Provo përsëri pas pak.'
    }
});

function createAuthClient() {

    /*
        Ky client krijohet vetem per login.

        Keshtu signInWithPassword nuk prek kurre
        Supabase admin client-in e backend-it.
    */

    return createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SECRET_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
                detectSessionInUrl: false
            }
        }
    );
}

router.post(
    '/login',
    loginLimiter,
    async (req, res, next) => {

        try {

            const {
                email,
                password
            } = req.body || {};

            if (
                !email ||
                !password
            ) {

                return res
                    .status(400)
                    .json({
                        success: false,
                        message: 'Email dhe fjalëkalimi janë të detyrueshëm.'
                    });
            }

            const authClient =
                createAuthClient();

            const {
                data,
                error
            } =
                await authClient
                    .auth
                    .signInWithPassword({
                        email,
                        password
                    });

            if (
                error ||
                !data?.session ||
                !data?.user
            ) {

                return res
                    .status(401)
                    .json({
                        success: false,
                        message: 'Email ose fjalëkalim i gabuar.'
                    });
            }

            /*
                Profili lexohet me admin client-in server-side,
                jo me sesionin e sapo krijuar.
            */

            const {
                data: profile,
                error: profileError
            } =
                await supabaseAdmin
                    .from('profiles')
                    .select(
                        'full_name,role,is_active'
                    )
                    .eq(
                        'id',
                        data.user.id
                    )
                    .single();

            if (
                profileError ||
                !profile ||
                !profile.is_active ||
                ![
                    'staff',
                    'admin',
                    'owner'
                ].includes(
                    profile.role
                )
            ) {

                return res
                    .status(403)
                    .json({
                        success: false,
                        message: 'Nuk ke leje për panelin admin.'
                    });
            }

            res.json({
                success: true,

                access_token:
                    data.session.access_token,

                expires_at:
                    data.session.expires_at,

                user: {
                    id:
                        data.user.id,

                    email:
                        data.user.email,

                    full_name:
                        profile.full_name,

                    role:
                        profile.role
                }
            });

        } catch (error) {

            next(error);
        }
    }
);

module.exports = router;