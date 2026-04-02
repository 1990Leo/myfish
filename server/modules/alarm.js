const db = require('../models/database');
const waterQuality = require('./waterQuality');
const waterLevel = require('./waterLevel');

module.exports = {
  sendAlert(type, message) {
    const level = this.determineAlertLevel(type);
    
    const stmt = db.getDB().prepare(
      'INSERT INTO alarm_records (type, message, level) VALUES (?, ?, ?)'
    );
    const result = stmt.run(type, message, level);
    
    const alert = { 
      id: result.lastInsertRowid, 
      type, 
      message, 
      level,
      timestamp: new Date().toISOString(),
      resolved: 0
    };
    
    console.log(`[ALERT][${level.toUpperCase()}] ${type}: ${message}`);
    
    return alert;
  },

  determineAlertLevel(type) {
    const errorTypes = ['oxygen', 'water_level', 'system_error'];
    return errorTypes.includes(type) ? 'error' : 'warning';
  },

  getAlerts(limit = 50) {
    return db.getDB()
      .prepare('SELECT * FROM alarm_records ORDER BY timestamp DESC LIMIT ?')
      .all(limit);
  },

  markAsRead(id) {
    const result = db.getDB()
      .prepare('UPDATE alarm_records SET resolved = 1 WHERE id = ?')
      .run(id);
    
    if (result.changes === 0) {
      return { success: false, message: '未找到该告警记录' };
    }
    
    return { success: true, message: '告警已标记为已读' };
  },

  getRecords(limit = 100, unresolvedOnly = false) {
    const sql = unresolvedOnly 
      ? 'SELECT * FROM alarm_records WHERE resolved = 0 ORDER BY timestamp DESC LIMIT ?'
      : 'SELECT * FROM alarm_records ORDER BY timestamp DESC LIMIT ?';
    return db.getDB().prepare(sql).all(limit);
  },

  addAlarm({ type, message, level = 'warning' }) {
    const stmt = db.getDB().prepare(
      'INSERT INTO alarm_records (type, message, level) VALUES (?, ?, ?)'
    );
    const result = stmt.run(type, message, level);
    return { id: result.lastInsertRowid, type, message, level };
  },

  resolve(id) {
    db.getDB().prepare('UPDATE alarm_records SET resolved = 1 WHERE id = ?').run(id);
    return { success: true };
  },

  resolveAll() {
    db.getDB().prepare('UPDATE alarm_records SET resolved = 1 WHERE resolved = 0').run();
    return { success: true };
  },

  checkAlerts() {
    const allAlerts = [];
    
    const latestWater = waterQuality.getLatest();
    if (latestWater) {
      const waterAlerts = waterQuality.checkAlerts(latestWater);
      waterAlerts.forEach(alert => {
        this.addAlarm(alert);
        allAlerts.push(alert);
      });
    }
    
    const latestLevel = waterLevel.getLatest();
    if (latestLevel) {
      const levelAlerts = waterLevel.checkAlerts(latestLevel.level);
      levelAlerts.forEach(alert => {
        this.addAlarm(alert);
        allAlerts.push(alert);
      });
    }
    
    return allAlerts;
  },

  getUnresolvedCount() {
    return db.getDB().prepare('SELECT COUNT(*) as count FROM alarm_records WHERE resolved = 0').get().count;
  },

  getAlertsByType(type, limit = 50) {
    return db.getDB()
      .prepare('SELECT * FROM alarm_records WHERE type = ? ORDER BY timestamp DESC LIMIT ?')
      .all(type, limit);
  },

  getRecentAlerts(hours = 24) {
    return db.getDB()
      .prepare(`SELECT * FROM alarm_records 
        WHERE timestamp >= datetime('now', '-' || ? || ' hours') 
        ORDER BY timestamp DESC`)
      .all(hours);
  }
};
