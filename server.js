require('dotenv').config({ path: './.env' });
console.log('DB_USER:', process.env.DB_USER, 'DB_PASSWORD:', process.env.DB_PASSWORD ? '*****' : 'empty');

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
const path = require('path');

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5000', // or '*' for all origins during development
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Database Connection (single connection, use db everywhere)
let db;
async function initializeDatabase() {
  try {
    db = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'nomnomnow'
    });
    console.log('MySQL Connected');

    // List of table creation statements
    const tableStatements = [
      `CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('customer', 'restaurant_owner') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;`,

      `CREATE TABLE IF NOT EXISTS restaurants (
        id INT PRIMARY KEY AUTO_INCREMENT,
        owner_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        cuisine VARCHAR(100),
        image VARCHAR(255),
        rating DECIMAL(3,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;`,

      `CREATE TABLE IF NOT EXISTS menu_items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        restaurant_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        image VARCHAR(255),
        available BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;`,

      `CREATE TABLE IF NOT EXISTS orders (
        id INT PRIMARY KEY AUTO_INCREMENT,
        customer_id INT NOT NULL,
        restaurant_id INT NOT NULL,
        status ENUM('pending', 'preparing', 'delivering', 'delivered', 'cancelled') DEFAULT 'pending',
        total_amount DECIMAL(10,2) NOT NULL,
        delivery_address TEXT NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;`,

      `CREATE TABLE IF NOT EXISTS order_items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        order_id INT NOT NULL,
        menu_item_id INT NOT NULL,
        quantity INT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;`,

      `CREATE TABLE IF NOT EXISTS reviews (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        restaurant_id INT NOT NULL,
        rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;`
    ];

    // Run each statement one by one
    for (const stmt of tableStatements) {
      await db.query(stmt);
    }
    console.log('Database tables created or already exist');
    return db;
  } catch (err) {
    console.error('Database Error:', err);
    process.exit(1);
  }
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/restaurants', require('./routes/restaurants'));
app.use('/api/orders', require('./routes/orders'));

// Serve static files from the 'html' directory
app.use(express.static(path.join(__dirname, 'html')));

// Serve static files from 'css' and 'js' directories
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));

// Optionally, serve index.html for the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server after DB initialization
const PORT = process.env.PORT || 5000;
initializeDatabase().then((dbConn) => {
  app.locals.db = dbConn;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
});