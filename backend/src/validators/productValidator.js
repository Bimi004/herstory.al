const { z } = require('zod');

const productFields = {
    name: z.string().min(2, 'Emri duhet te kete te pakten 2 karaktere'),
    slug: z.string().min(2, 'Slug eshte i detyrueshem'),
    sku: z.string().min(1, 'SKU eshte i detyrueshem'),

    short_description: z.string().optional().nullable(),
    description: z.string().optional().nullable(),

    price: z.coerce.number().min(0, 'Cmimi nuk mund te jete negativ'),
    compare_at_price: z.coerce.number().min(0).optional().nullable(),
    cost_price: z.coerce.number().min(0).optional().nullable(),

    stock_quantity: z.coerce.number().int().min(0),
    low_stock_threshold: z.coerce.number().int().min(0),

    track_inventory: z.boolean(),
    is_active: z.boolean(),
    is_featured: z.boolean(),

    category_id: z.string().uuid().optional().nullable(),
    weight_grams: z.coerce.number().int().min(0).optional().nullable(),

    meta_title: z.string().optional().nullable(),
    meta_description: z.string().optional().nullable()
};

const productSchema = z.object({
    ...productFields,
    stock_quantity: productFields.stock_quantity.default(0),
    low_stock_threshold: productFields.low_stock_threshold.default(5),
    track_inventory: productFields.track_inventory.default(true),
    is_active: productFields.is_active.default(true),
    is_featured: productFields.is_featured.default(false)
});

const productUpdateSchema = z.object(productFields).partial();

module.exports = {
    productSchema,
    productUpdateSchema
};
