const db = require('../models/database');
const config = require('../config');

let isFeeding = false;

module.exports = {
  feed(amount) {
    if (isFeeding) {
      return { success: false, message: '喂食进行中，请稍后再试' };
    }
    
    const feedAmount = Math.min(amount || config.feeder.defaultAmount, config.feeder.maxAmount);
    
    isFeeding = true;
    
    try {
      const stmt = db.getDB().prepare(
        'INSERT INTO feed_records (type, amount) VALUES (?, ?)'
      );
      const result = stmt.run('manual', feedAmount);
      
      return { 
        success: true, 
        id: result.lastInsertRowid, 
        amount: feedAmount,
        message: `成功投喂 ${feedAmount}g 鱼食`
      };
    } finally {
      isFeeding = false;
    }
  },

  getFeedHistory(limit = 50) {
    return db.getDB()
      .prepare('SELECT * FROM feed_records ORDER BY timestamp DESC LIMIT ?')
      .all(limit);
  },

  getRecords(limit = 100, offset = 0) {
    return db.getDB()
      .prepare('SELECT * FROM feed_records ORDER BY timestamp DESC LIMIT ? OFFSET ?')
      .all(limit, offset);
  },

  setSchedule(times) {
    if (!Array.isArray(times) || times.length === 0) {
      return { success: false, message: '请提供有效的喂食时间数组' };
    }
    
    const timePattern = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
    const validTimes = times.filter(t => timePattern.test(t));
    
    if (validTimes.length !== times.length) {
      return { success: false, message: '时间格式无效，请使用 HH:MM 格式' };
    }
    
    const stmt = db.getDB().prepare(
      "INSERT INTO system_config (key, value) VALUES ('feeder_schedule', ?) ON CONFLICT(key) DO UPDATE SET value = ?"
    );
    stmt.run(JSON.stringify(validTimes), JSON.stringify(validTimes));
    
    return { success: true, schedule: validTimes };
  },

  getSchedule() {
    const configRow = db.getDB()
      .prepare("SELECT value FROM system_config WHERE key = 'feeder_schedule'")
      .get();
    return configRow ? JSON.parse(configRow.value) : config.feeder.schedules;
  },

  getTodayFeedCount() {
    return db.getDB().prepare(`
      SELECT COUNT(*) as count, SUM(amount) as totalAmount 
      FROM feed_records 
      WHERE date(timestamp) = date('now')
    `).get();
  }
};
