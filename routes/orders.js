const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const auth = require('../middleware/auth');

// Get all orders for a customer (MySQL version)
router.get('/customer', auth, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Only customers can view their orders' });
    }

    const db = req.app.locals.db;
    // Get all orders for this customer
    const [orders] = await db.query(
      'SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC',
      [req.user.userId]
    );

    // For each order, get its items and restaurant name
    for (let order of orders) {
      // Get order items
      const [items] = await db.query(
        `SELECT oi.quantity, oi.price, mi.name 
         FROM order_items oi
         JOIN menu_items mi ON oi.menu_item_id = mi.id
         WHERE oi.order_id = ?`,
        [order.id]
      );
      order.items = items;

      // Get restaurant name
      const [restaurantRows] = await db.query(
        'SELECT name FROM restaurants WHERE id = ?',
        [order.restaurant_id]
      );
      order.restaurantName = restaurantRows.length ? restaurantRows[0].name : '';
    }

    res.json(orders);
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
});

// Get all orders for a restaurant (owner only, MySQL version)
router.get('/restaurant', auth, async (req, res) => {
  try {
    if (req.user.role !== 'restaurant_owner') {
      return res.status(403).json({ message: 'Only restaurant owners can view their orders' });
    }

    const db = req.app.locals.db;
    // Get all restaurants owned by this user
    const [restaurants] = await db.query('SELECT id FROM restaurants WHERE owner_id = ?', [req.user.userId]);
    if (!restaurants.length) {
      return res.json([]); // No restaurants, no orders
    }
    const restaurantIds = restaurants.map(r => r.id);

    // Get all upcoming orders for these restaurants
    const [orders] = await db.query(
      `SELECT o.id, o.status, o.total_amount, o.delivery_address, o.created_at,
              u.name AS customer_name, u.email AS customer_email,
              oi.quantity, oi.price, mi.name AS item_name
         FROM orders o
         JOIN users u ON o.customer_id = u.id
         JOIN order_items oi ON o.id = oi.order_id
         JOIN menu_items mi ON oi.menu_item_id = mi.id
        WHERE o.restaurant_id IN (?) AND o.status IN ('pending', 'preparing', 'delivering')
        ORDER BY o.created_at DESC`,
      [restaurantIds]
    );

    res.json(orders);
  } catch (error) {
    console.error('Error fetching restaurant orders:', error);
    res.status(500).json({ message: 'Error fetching restaurant orders', error: error.message });
  }
});

// Create new order (customers only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Only customers can place orders' });
    }

    const db = req.app.locals.db;
    const { restaurantId, items, deliveryAddress, paymentMethod } = req.body;

    // Calculate total amount
    let totalAmount = 0;
    for (const item of items) {
      const [menuRows] = await db.query('SELECT * FROM menu_items WHERE id = ?', [item.menuItemId]);
      if (!menuRows.length) {
        return res.status(400).json({ message: `Menu item ${item.menuItemId} not found` });
      }
      totalAmount += menuRows[0].price * item.quantity;
    }

    // Create order
    const [orderResult] = await db.query(
      'INSERT INTO orders (customer_id, restaurant_id, status, total_amount, delivery_address, payment_method) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.userId, restaurantId, 'pending', totalAmount, deliveryAddress, paymentMethod]
    );
    const orderId = orderResult.insertId;

    // Insert order items
    for (const item of items) {
      const [menuRows] = await db.query('SELECT * FROM menu_items WHERE id = ?', [item.menuItemId]);
      await db.query(
        'INSERT INTO order_items (order_id, menu_item_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, item.menuItemId, item.quantity, menuRows[0].price]
      );
    }

    res.status(201).json({ message: 'Order placed successfully', orderId });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Error creating order', error: error.message });
  }
});

// Update order status (restaurant owner only)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    if (req.user.role !== 'restaurant_owner') {
      return res.status(403).json({ message: 'Only restaurant owners can update order status' });
    }

    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const restaurant = await Restaurant.findOne({ owner: req.user.userId });
    if (!restaurant || order.restaurant.toString() !== restaurant._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this order' });
    }

    order.status = status;
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error updating order status', error: error.message });
  }
});

// Cancel order (customers only)
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Only customers can cancel their orders' });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.customer.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to cancel this order' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot cancel order in current status' });
    }

    order.status = 'cancelled';
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling order', error: error.message });
  }
});

module.exports = router; 
