const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Get all restaurants
router.get('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const [restaurants] = await db.query('SELECT * FROM restaurants');
    res.json(restaurants);
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    res.status(500).json({ message: 'Error fetching restaurants', error: error.message });
  }
});

// Get single restaurant with menu
router.get('/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const [restaurants] = await db.query('SELECT * FROM restaurants WHERE id = ?', [req.params.id]);
    if (restaurants.length === 0) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    const restaurant = restaurants[0];
    const [menu] = await db.query('SELECT * FROM menu_items WHERE restaurant_id = ?', [req.params.id]);
    restaurant.menu = menu;
    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching restaurant', error: error.message });
  }
});

// Create restaurant (restaurant owner only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'restaurant_owner') {
      return res.status(403).json({ message: 'Only restaurant owners can create restaurants' });
    }

    const db = req.app.locals.db;
    const restaurant = {
      name: req.body.name,
      cuisine: req.body.cuisine,
      description: req.body.description,
      owner_id: req.user.userId
    };

    console.log('Creating restaurant:', restaurant);
    console.log('req.user:', req.user);

    await db.query('INSERT INTO restaurants SET ?', restaurant);
    res.status(201).json(restaurant);
  } catch (error) {
    console.error('Error creating restaurant:', error);
    res.status(500).json({ message: 'Error creating restaurant', error: error.message });
  }
});

// Update restaurant (owner only)
router.put('/:id', auth, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const restaurant = await db.query('SELECT * FROM restaurants WHERE id = ?', [req.params.id]);
    
    if (restaurant.length === 0) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    if (restaurant[0].owner.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to update this restaurant' });
    }

    const updatedRestaurant = {
      ...req.body,
      id: req.params.id
    };

    await db.query('UPDATE restaurants SET ? WHERE id = ?', [updatedRestaurant, req.params.id]);

    res.json(updatedRestaurant);
  } catch (error) {
    res.status(500).json({ message: 'Error updating restaurant', error: error.message });
  }
});

// Add menu item (owner only)
router.post('/:id/menu', auth, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const restaurantId = req.params.id;
    const { name, description, price } = req.body;
    // Optionally, check if the logged-in user is the owner
    // if (req.user.id !== restaurant.owner_id) { ... }

    await db.query(
      'INSERT INTO menu_items (restaurant_id, name, description, price) VALUES (?, ?, ?, ?)',
      [restaurantId, name, description, price]
    );
    res.status(201).json({ message: 'Meal added!' });
  } catch (error) {
    res.status(500).json({ message: 'Error adding meal', error: error.message });
  }
});

// Update menu item (owner only)
router.put('/:id/menu/:itemId', auth, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const restaurant = await db.query('SELECT * FROM restaurants WHERE id = ?', [req.params.id]);
    
    if (restaurant.length === 0) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    if (restaurant[0].owner.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to update menu items' });
    }

    const menuItem = await db.query('SELECT * FROM menu_items WHERE id = ?', [req.params.itemId]);
    if (menuItem.length === 0) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    const updatedMenuItem = {
      ...req.body,
      id: req.params.itemId
    };

    await db.query('UPDATE menu_items SET ? WHERE id = ?', [updatedMenuItem, req.params.itemId]);

    res.json(updatedMenuItem);
  } catch (error) {
    res.status(500).json({ message: 'Error updating menu item', error: error.message });
  }
});

// Delete menu item (owner only)
router.delete('/:id/menu/:itemId', auth, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const restaurant = await db.query('SELECT * FROM restaurants WHERE id = ?', [req.params.id]);
    
    if (restaurant.length === 0) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    if (restaurant[0].owner.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to delete menu items' });
    }

    await db.query('DELETE FROM menu_items WHERE id = ?', [req.params.itemId]);

    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting menu item', error: error.message });
  }
});

// Add review (customers only)
router.post('/:id/reviews', auth, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Only customers can add reviews' });
    }

    const db = req.app.locals.db;
    const restaurant = await db.query('SELECT * FROM restaurants WHERE id = ?', [req.params.id]);
    if (restaurant.length === 0) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const review = {
      user: req.user.userId,
      rating: req.body.rating,
      comment: req.body.comment,
      restaurant_id: req.params.id
    };

    await db.query('INSERT INTO reviews SET ?', review);
    
    // Update average rating
    const totalRating = await db.query('SELECT AVG(rating) AS average_rating FROM reviews WHERE restaurant_id = ?', [req.params.id]);
    const averageRating = totalRating[0].average_rating;

    await db.query('UPDATE restaurants SET rating = ? WHERE id = ?', [averageRating, req.params.id]);

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: 'Error adding review', error: error.message });
  }
});

module.exports = router; 