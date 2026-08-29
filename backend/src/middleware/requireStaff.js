const supabase = require('../config/supabase');

async function requireStaff(req, res, next) {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Nuk je i autorizuar'
            });
        }

        const { data: profile, error } = await supabase
            .from('profiles')
            .select('role,is_active')
            .eq('id', req.user.id)
            .single();

        if (error || !profile) {
            return res.status(403).json({
                success: false,
                message: 'Profili nuk u gjet'
            });
        }

        const allowedRoles = ['staff', 'admin', 'owner'];

        if (!profile.is_active || !allowedRoles.includes(profile.role)) {
            return res.status(403).json({
                success: false,
                message: 'Nuk ke leje per kete veprim'
            });
        }

        req.profile = profile;
        next();
    } catch (error) {
        next(error);
    }
}

module.exports = requireStaff;
