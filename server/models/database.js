const Database = require('better-sqlite3');
const path = require('path');

class DatabaseManager {
  constructor() {
    const dbPath = path.join(__dirname, '../../data/fish_tank.db');
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
  }

  getDB() {
    return this.db;
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

module.exports = new DatabaseManager();
