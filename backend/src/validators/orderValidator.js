const { z } = require('zod');

const orderSchema = z.object({
    customer_name: z.string().min(2),
    customer_phone: z.string().min(6),
    customer_email: z.string().email().optional().nullable(),

    shipping_city: z.string().min(2),
    shipping_address: z.string().min(3),
    shipping_postal_code: z.string().optional().nullable(),

    customer_notes: z.string().max(1000).optional().nullable(),

    items: z.array(
        z.object({
            product_id: z.string().uuid(),
            quantity: z.coerce.number().int().min(1).max(100)
        })
    ).min(1)
});

const orderStatusSchema = z.object({
    status: z.enum([
        'new',
        'confirmed',
        'processing',
        'ready_to_ship',
        'shipped',
        'delivered',
        'cancelled',
        'returned'
    ]),
    note: z.string().max(1000).optional().nullable()
});

module.exports = {
    orderSchema,
    orderStatusSchema
};
