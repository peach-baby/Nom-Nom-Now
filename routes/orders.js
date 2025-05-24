const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const auth = require('../middleware/auth');

// Get all orders for a customer
router.get('/customer', auth, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Only customers can view their orders' });
    }

    const orders = await Order.find({ customer: req.user.userId })
      .populate('restaurant', 'name')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
});

// Get all orders for a restaurant (owner only)
router.get('/restaurant', auth, async (req, res) => {
  try {
    if (req.user.role !== 'restaurant_owner') {
      return res.status(403).json({ message: 'Only restaurant owners can view their orders' });
    }

    const restaurant = await Restaurant.findOne({ owner: req.user.userId });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const orders = await Order.find({ restaurant: restaurant._id })
      .populate('customer', 'name email')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
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