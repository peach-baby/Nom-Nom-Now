const db = require('../server').db;

class Restaurant {
  static async findAll() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT r.*, 
               COUNT(DISTINCT rev.id) as review_count,
               COALESCE(AVG(rev.rating), 0) as rating
        FROM restaurants r
        LEFT JOIN reviews rev ON r.id = rev.restaurant_id
        WHERE r.is_active = true
        GROUP BY r.id
      `;
      
      db.query(query, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }

  static async findById(id) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT r.*, 
               COUNT(DISTINCT rev.id) as review_count,
               COALESCE(AVG(rev.rating), 0) as rating
        FROM restaurants r
        LEFT JOIN reviews rev ON r.id = rev.restaurant_id
        WHERE r.id = ?
        GROUP BY r.id
      `;
      
      db.query(query, [id], (error, results) => {
        if (error) {
          reject(error);
        } else {
          if (results.length === 0) {
            resolve(null);
          } else {
            // Get menu items
            const menuQuery = 'SELECT * FROM menu_items WHERE restaurant_id = ?';
            db.query(menuQuery, [id], (menuError, menuResults) => {
              if (menuError) {
                reject(menuError);
              } else {
                const restaurant = results[0];
                restaurant.menu = menuResults;
                resolve(restaurant);
              }
            });
          }
        }
      });
    });
  }
}

module.exports = Restaurant; 