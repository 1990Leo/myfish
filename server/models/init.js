const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'fish_tank.db');
const db = new Database(dbPath);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS water_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    temperature REAL NOT NULL,
    ph REAL NOT NULL,
    oxygen REAL NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS feed_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK(type IN ('manual', 'auto')),
    amount REAL NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS light_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    status TEXT NOT NULL CHECK(status IN ('on', 'off')),
    intensity INTEGER DEFAULT 100,
    last_changed DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS water_level_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    level REAL NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS system_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS alarm_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    level TEXT NOT NULL CHECK(level IN ('info', 'warning', 'error')),
    resolved INTEGER DEFAULT 0,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_water_records_timestamp ON water_records(timestamp);
  CREATE INDEX IF NOT EXISTS idx_feed_records_timestamp ON feed_records(timestamp);
  CREATE INDEX IF NOT EXISTS idx_water_level_timestamp ON water_level_records(timestamp);
  CREATE INDEX IF NOT EXISTS idx_alarm_records_timestamp ON alarm_records(timestamp);
`);

const initConfig = db.prepare('INSERT OR IGNORE INTO system_config (key, value) VALUES (?, ?)');
initConfig.run('feeder_schedule', JSON.stringify(['08:00', '12:00', '18:00']));
initConfig.run('light_schedule', JSON.stringify({ on: '07:00', off: '22:00' }));
initConfig.run('alarm_enabled', 'true');

const initLight = db.prepare("INSERT OR IGNORE INTO light_status (status, intensity) VALUES ('off', 100)");
initLight.run();

console.log('数据库初始化完成！');
console.log('数据库路径:', dbPath);

db.close();
