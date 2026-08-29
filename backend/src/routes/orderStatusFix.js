const express = require('express');

const supabase = require('../config/supabase');
const requireAuth = require('../middleware/requireAuth');
const requireStaff = require('../middleware/requireStaff');

const router = express.Router();

const VALID_STATUSES = [
    'new',
    'confirmed',
    'processing',
    'ready_to_ship',
    'shipped',
    'delivered',
    'cancelled',
    'returned'
];

const STOCK_RESERVED_STATUSES = [
    'confirmed',
    'processing',
    'ready_to_ship',
    'shipped',
    'delivered'
];

router.patch(
    '/:id/status',
    requireAuth,
    requireStaff,
    async (req, res, next) => {

        try {

            const orderId = req.params.id;
            const newStatus = req.body?.status;
            const note = req.body?.note || null;

            if (!VALID_STATUSES.includes(newStatus)) {
                return res.status(400).json({
                    success: false,
                    message: 'Status i pavlefshem'
                });
            }

            const { data: order, error: orderError } = await supabase
                .from('orders')
                .select('id,order_status')
                .eq('id', orderId)
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
                    message: 'Statusi eshte tashme i njejte',
                    order: {
                        id: order.id,
                        order_status: oldStatus
                    }
                });
            }

            const oldReserved =
                STOCK_RESERVED_STATUSES.includes(oldStatus);

            const newReserved =
                STOCK_RESERVED_STATUSES.includes(newStatus);

            const { data: items, error: itemsError } = await supabase
                .from('order_items')
                .select('product_id,variant_id,quantity')
                .eq('order_id', orderId);

            if (itemsError) throw itemsError;

            /*
                Kalim:
                jo-reserved -> reserved = hiq stok
                reserved -> jo-reserved = rikthe stok

                Keshtu admini mund te korrigjoje edhe nje status
                te vendosur gabimisht.
            */

            if (!oldReserved && newReserved) {

                for (const item of items || []) {

                    if (!item.product_id) continue;

                    const { data: product, error: productError } =
                        await supabase
                            .from('products')
                            .select('id,stock_quantity,track_inventory,name')
                            .eq('id', item.product_id)
                            .single();

                    if (productError || !product) {
                        throw new Error('Produkti i porosise nuk u gjet');
                    }

                    if (!product.track_inventory) continue;

                    const currentStock =
                        Number(product.stock_quantity || 0);

                    const qty =
                        Number(item.quantity || 0);

                    if (currentStock < qty) {
                        return res.status(409).json({
                            success: false,
                            message:
                                'Nuk ka stok te mjaftueshem per ' +
                                product.name
                        });
                    }

                    const { error: stockError } = await supabase
                        .from('products')
                        .update({
                            stock_quantity:
                                currentStock - qty
                        })
                        .eq('id', product.id);

                    if (stockError) throw stockError;

                    const { error: movementError } = await supabase
                        .from('inventory_movements')
                        .insert({
                            product_id: product.id,
                            variant_id: item.variant_id || null,
                            quantity_change: -qty,
                            movement_type: 'sale',
                            reference_id: orderId,
                            note:
                                'Order status: ' +
                                oldStatus +
                                ' -> ' +
                                newStatus,
                            created_by: req.user.id
                        });

                    if (movementError) {
                        console.error(
                            'Inventory movement warning:',
                            movementError
                        );
                    }
                }
            }

            if (oldReserved && !newReserved) {

                for (const item of items || []) {

                    if (!item.product_id) continue;

                    const { data: product, error: productError } =
                        await supabase
                            .from('products')
                            .select('id,stock_quantity,track_inventory')
                            .eq('id', item.product_id)
                            .single();

                    if (productError || !product) continue;

                    if (!product.track_inventory) continue;

                    const currentStock =
                        Number(product.stock_quantity || 0);

                    const qty =
                        Number(item.quantity || 0);

                    const { error: stockError } = await supabase
                        .from('products')
                        .update({
                            stock_quantity:
                                currentStock + qty
                        })
                        .eq('id', product.id);

                    if (stockError) throw stockError;

                    const { error: movementError } = await supabase
                        .from('inventory_movements')
                        .insert({
                            product_id: product.id,
                            variant_id: item.variant_id || null,
                            quantity_change: qty,
                            movement_type:
                                newStatus === 'returned'
                                    ? 'return'
                                    : 'cancelled_order',
                            reference_id: orderId,
                            note:
                                'Order status: ' +
                                oldStatus +
                                ' -> ' +
                                newStatus,
                            created_by: req.user.id
                        });

                    if (movementError) {
                        console.error(
                            'Inventory movement warning:',
                            movementError
                        );
                    }
                }
            }

            const { data: updatedOrder, error: updateError } =
                await supabase
                    .from('orders')
                    .update({
                        order_status: newStatus
                    })
                    .eq('id', orderId)
                    .select()
                    .single();

            if (updateError) throw updateError;

            const { error: historyError } = await supabase
                .from('order_status_history')
                .insert({
                    order_id: orderId,
                    previous_status: oldStatus,
                    new_status: newStatus,
                    changed_by: req.user.id,
                    note
                });

            if (historyError) {
                console.error(
                    'Order history warning:',
                    historyError
                );
            }

            res.json({
                success: true,
                message: 'Statusi u ruajt',
                order: updatedOrder
            });

        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;