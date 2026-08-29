const express = require('express');
const supabase = require('../config/supabase');
const requireAuth = require('../middleware/requireAuth');
const requireStaff = require('../middleware/requireStaff');
const { orderSchema, orderStatusSchema } = require('../validators/orderValidator');

const router = express.Router();

router.post('/', async (req, res, next) => {
    try {
        const result = orderSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: 'Te dhenat e porosise nuk jane te vlefshme',
                errors: result.error.flatten().fieldErrors
            });
        }

        const orderData = result.data;
        const productIds = [...new Set(orderData.items.map(i => i.product_id))];

        const { data: products, error: productsError } = await supabase
            .from('products')
            .select('id,name,sku,price,stock_quantity,track_inventory,is_active')
            .in('id', productIds);

        if (productsError) throw productsError;

        if (!products || products.length !== productIds.length) {
            return res.status(400).json({
                success: false,
                message: 'Nje ose me shume produkte nuk u gjeten'
            });
        }

        const productMap = new Map(products.map(p => [p.id, p]));

        let subtotal = 0;
        const orderItems = [];

        for (const item of orderData.items) {
            const product = productMap.get(item.product_id);

            if (!product || !product.is_active) {
                return res.status(400).json({
                    success: false,
                    message: 'Nje nga produktet nuk eshte aktiv'
                });
            }

            if (product.track_inventory && product.stock_quantity < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Stok i pamjaftueshem per ${product.name}`
                });
            }

            const unitPrice = Number(product.price);
            const lineTotal = unitPrice * item.quantity;

            subtotal += lineTotal;

            orderItems.push({
                product_id: product.id,
                variant_id: null,
                product_name: product.name,
                variant_name: null,
                sku: product.sku,
                quantity: item.quantity,
                unit_price: unitPrice,
                line_total: lineTotal
            });
        }

        const shippingAmount = 0;
        const discountAmount = 0;
        const totalAmount = subtotal + shippingAmount - discountAmount;

        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                customer_name: orderData.customer_name,
                customer_phone: orderData.customer_phone,
                customer_email: orderData.customer_email || null,
                shipping_city: orderData.shipping_city,
                shipping_address: orderData.shipping_address,
                shipping_postal_code: orderData.shipping_postal_code || null,
                customer_notes: orderData.customer_notes || null,

                subtotal,
                shipping_amount: shippingAmount,
                discount_amount: discountAmount,
                total_amount: totalAmount,
                currency: 'EUR',

                payment_method: 'cash_on_delivery',
                payment_status: 'pending',
                order_status: 'new'
            })
            .select()
            .single();

        if (orderError) throw orderError;

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(
                orderItems.map(item => ({
                    ...item,
                    order_id: order.id
                }))
            );

        if (itemsError) {
            await supabase.from('orders').delete().eq('id', order.id);
            throw itemsError;
        }

        res.status(201).json({
            success: true,
            message: 'Porosia u regjistrua me sukses',
            order: {
                id: order.id,
                order_number: order.order_number,
                total_amount: order.total_amount,
                currency: order.currency,
                payment_method: order.payment_method,
                order_status: order.order_status
            }
        });
    } catch (error) {
        next(error);
    }
});

router.get('/', requireAuth, requireStaff, async (req, res, next) => {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                order_items (*)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            orders: data
        });
    } catch (error) {
        next(error);
    }
});

router.patch('/:id/status', requireAuth, requireStaff, async (req, res, next) => {
    try {
        const validation = orderStatusSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Statusi nuk eshte i vlefshem'
            });
        }

        const newStatus = validation.data.status;
        const note = validation.data.note || null;

        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select(`
                *,
                order_items (*)
            `)
            .eq('id', req.params.id)
            .single();

        if (orderError || !order) {
            return res.status(404).json({
                success: false,
                message: 'Porosia nuk u gjet'
            });
        }

        const oldStatus = order.order_status;

        if (oldStatus === newStatus) {
            return res.json({
                success: true,
                message: 'Porosia e ka tashme kete status',
                order
            });
        }

        const finalStatuses = ['cancelled', 'returned'];

        if (finalStatuses.includes(oldStatus)) {
            return res.status(400).json({
                success: false,
                message: 'Statusi i kesaj porosie nuk mund te ndryshohet me'
            });
        }

        if (newStatus === 'confirmed' && oldStatus === 'new') {
            for (const item of order.order_items) {
                if (!item.product_id) continue;

                const { data: product, error: productError } = await supabase
                    .from('products')
                    .select('id,name,stock_quantity,track_inventory')
                    .eq('id', item.product_id)
                    .single();

                if (productError) throw productError;

                if (product.track_inventory) {
                    if (product.stock_quantity < item.quantity) {
                        return res.status(400).json({
                            success: false,
                            message: `Stok i pamjaftueshem per ${product.name}`
                        });
                    }

                    const newStock = product.stock_quantity - item.quantity;

                    const { error: stockError } = await supabase
                        .from('products')
                        .update({ stock_quantity: newStock })
                        .eq('id', product.id);

                    if (stockError) throw stockError;

                    const { error: movementError } = await supabase
                        .from('inventory_movements')
                        .insert({
                            product_id: product.id,
                            variant_id: null,
                            quantity_change: -item.quantity,
                            movement_type: 'sale',
                            reference_id: order.id,
                            note: `Porosia #${order.order_number}`,
                            created_by: req.user.id
                        });

                    if (movementError) throw movementError;
                }
            }
        }

        if (newStatus === 'cancelled' && oldStatus !== 'new') {
            for (const item of order.order_items) {
                if (!item.product_id) continue;

                const { data: product, error: productError } = await supabase
                    .from('products')
                    .select('id,stock_quantity,track_inventory')
                    .eq('id', item.product_id)
                    .single();

                if (productError) throw productError;

                if (product.track_inventory) {
                    const restoredStock = product.stock_quantity + item.quantity;

                    const { error: stockError } = await supabase
                        .from('products')
                        .update({ stock_quantity: restoredStock })
                        .eq('id', product.id);

                    if (stockError) throw stockError;

                    const { error: movementError } = await supabase
                        .from('inventory_movements')
                        .insert({
                            product_id: product.id,
                            variant_id: null,
                            quantity_change: item.quantity,
                            movement_type: 'cancelled_order',
                            reference_id: order.id,
                            note: `Anullim porosie #${order.order_number}`,
                            created_by: req.user.id
                        });

                    if (movementError) throw movementError;
                }
            }
        }

        const { data: updatedOrder, error: updateError } = await supabase
            .from('orders')
            .update({
                order_status: newStatus
            })
            .eq('id', order.id)
            .select()
            .single();

        if (updateError) throw updateError;

        const { error: historyError } = await supabase
            .from('order_status_history')
            .insert({
                order_id: order.id,
                previous_status: oldStatus,
                new_status: newStatus,
                changed_by: req.user.id,
                note
            });

        if (historyError) throw historyError;

        res.json({
            success: true,
            message: 'Statusi i porosise u ndryshua',
            order: updatedOrder
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
