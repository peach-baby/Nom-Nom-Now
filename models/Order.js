const db = require('../server').db;

class Order {
  static async findById(id) {
    return new Promise((resolve, reject) => {
      db.query('SELECT * FROM orders WHERE id = ?', [id], (err, results) => {
        if (err) return reject(err);
        resolve(results[0]);
      });
    });
  }

  static async findByCustomerId(customerId) {
    return new Promise((resolve, reject) => {
      db.query('SELECT * FROM orders WHERE customer_id = ?', [customerId], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }

  static async create(order) {
    return new Promise((resolve, reject) => {
      db.query('INSERT INTO orders SET ?', order, (err, result) => {
        if (err) return reject(err);
        resolve({ id: result.insertId, ...order });
      });
    });
  }
}

module.exports = Order; 