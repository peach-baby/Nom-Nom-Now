class User {
  static async findByEmail(db, email) {
    const [results] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    return results[0];
  }

  static async findById(db, id) {
    const [results] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    return results[0];
  }

  static async create(db, user) {
    const [result] = await db.query('INSERT INTO users SET ?', user);
    return { id: result.insertId, ...user };
  }
}

module.exports = User;