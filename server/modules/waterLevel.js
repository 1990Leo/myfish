const db = require('../models/database');
const config = require('../config');

let isRefilling = false;
let refillStartTime = null;

function generateSimulatedLevel() {
  const baseLevel = 70;
  const variation = Math.random() * 30 - 10;
  return Math.max(20, Math.min(100, Math.round(baseLevel + variation)));
}

module.exports = {
  getCurrentLevel() {
    const level = generateSimulatedLevel();
    this.addRecord(level);
    return {
      level,
      percentage: level,
      timestamp: new Date().toISOString(),
      isRefilling
    };
  },

  startRefill() {
    if (isRefilling) {
      return { success: false, message: '补水已在进行中' };
    }
    
    isRefilling = true;
    refillStartTime = new Date();
    
    const stmt = db.getDB().prepare(
      "INSERT INTO system_config (key, value) VALUES ('refill_status', ?) ON CONFLICT(key) DO UPDATE SET value = ?"
    );
    stmt.run(JSON.stringify({ status: 'on', startTime: refillStartTime.toISOString() }), 
             JSON.stringify({ status: 'on', startTime: refillStartTime.toISOString() }));
    
    return { 
      success: true, 
      message: '补水已启动',
      startTime: refillStartTime.toISOString()
    };
  },

  stopRefill() {
    if (!isRefilling) {
      return { success: false, message: '没有正在进行的补水' };
    }
    
    isRefilling = false;
    const duration = refillStartTime ? (new Date() - refillStartTime) / 1000 : 0;
    refillStartTime = null;
    
    const stmt = db.getDB().prepare(
      "INSERT INTO system_config (key, value) VALUES ('refill_status', ?) ON CONFLICT(key) DO UPDATE SET value = ?"
    );
    stmt.run(JSON.stringify({ status: 'off', lastDuration: duration }), 
             JSON.stringify({ status: 'off', lastDuration: duration }));
    
    return { 
      success: true, 
      message: '补水已停止',
      duration: Math.round(duration)
    };
  },

  checkLevel() {
    const current = this.getCurrentLevel();
    const { min, warningLevel } = config.sensors.waterLevel;
    
    const result = {
      level: current.level,
      needsRefill: false,
      autoStarted: false,
      alerts: []
    };
    
    if (current.level < min) {
      result.needsRefill = true;
      result.alerts.push({
        type: 'water_level',
        level: 'error',
        message: `水位严重不足: ${current.level}%，需要立即补水`
      });
      
      if (!isRefilling) {
        this.startRefill();
        result.autoStarted = true;
      }
    } else if (current.level < warningLevel) {
      result.needsRefill = true;
      result.alerts.push({
        type: 'water_level',
        level: 'warning',
        message: `水位偏低: ${current.level}%，建议补水`
      });
    }
    
    return result;
  },

  getRefillStatus() {
    const configRow = db.getDB()
      .prepare("SELECT value FROM system_config WHERE key = 'refill_status'")
      .get();
    
    if (configRow) {
      const status = JSON.parse(configRow.value);
      return {
        isRefilling,
        ...status
      };
    }
    
    return { isRefilling, status: 'off' };
  },

  getRecords(limit = 100, offset = 0) {
    return db.getDB()
      .prepare('SELECT * FROM water_level_records ORDER BY timestamp DESC LIMIT ? OFFSET ?')
      .all(limit, offset);
  },

  addRecord(level) {
    const stmt = db.getDB().prepare(
      'INSERT INTO water_level_records (level) VALUES (?)'
    );
    const result = stmt.run(level);
    return { id: result.lastInsertRowid, level };
  },

  getLatest() {
    return db.getDB()
      .prepare('SELECT * FROM water_level_records ORDER BY timestamp DESC LIMIT 1')
      .get();
  },

  checkAlert(level) {
    const alerts = [];
    const { min, warningLevel } = config.sensors.waterLevel;
    
    if (level < min) {
      alerts.push({
        type: 'water_level',
        level: 'error',
        message: `水位过低: ${level}% (最低值: ${min}%)`
      });
    } else if (level < warningLevel) {
      alerts.push({
        type: 'water_level',
        level: 'warning',
        message: `水位偏低: ${level}% (警告值: ${warningLevel}%)`
      });
    }
    
    return alerts;
  }
};
