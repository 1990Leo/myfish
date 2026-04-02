const db = require('../models/database');
const config = require('../config');

function generateSimulatedData() {
  const temperature = 22 + Math.random() * 6;
  const ph = 6.5 + Math.random() * 1.5;
  const oxygen = 5 + Math.random() * 5;
  
  return {
    temperature: Math.round(temperature * 10) / 10,
    ph: Math.round(ph * 10) / 10,
    oxygen: Math.round(oxygen * 10) / 10,
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  getCurrentData() {
    const data = generateSimulatedData();
    this.addRecord(data);
    return data;
  },

  getHistory(hours = 24) {
    const hoursNum = parseInt(hours) || 24;
    return db.getDB()
      .prepare(`SELECT * FROM water_records 
        WHERE timestamp >= datetime('now', '-' || ? || ' hours') 
        ORDER BY timestamp DESC`)
      .all(hoursNum);
  },

  getRecords(limit = 100, offset = 0) {
    return db.getDB()
      .prepare('SELECT * FROM water_records ORDER BY timestamp DESC LIMIT ? OFFSET ?')
      .all(limit, offset);
  },

  addRecord({ temperature, ph, oxygen }) {
    const stmt = db.getDB().prepare(
      'INSERT INTO water_records (temperature, ph, oxygen) VALUES (?, ?, ?)'
    );
    const result = stmt.run(temperature, ph, oxygen);
    return { id: result.lastInsertRowid, temperature, ph, oxygen };
  },

  getLatest() {
    return db.getDB()
      .prepare('SELECT * FROM water_records ORDER BY timestamp DESC LIMIT 1')
      .get();
  },

  getStats() {
    const stats = db.getDB().prepare(`
      SELECT 
        AVG(temperature) as avgTemp,
        AVG(ph) as avgPh,
        AVG(oxygen) as avgOxygen,
        MAX(temperature) as maxTemp,
        MIN(temperature) as minTemp,
        MAX(ph) as maxPh,
        MIN(ph) as minPh,
        COUNT(*) as totalRecords
      FROM water_records
      WHERE timestamp >= datetime('now', '-24 hours')
    `).get();
    return stats;
  },

  checkAlerts(current) {
    const alerts = [];
    const { temperature, ph, oxygen } = config.sensors.waterQuality;
    
    if (current.temperature < temperature.min || current.temperature > temperature.max) {
      alerts.push({
        type: 'temperature',
        level: 'warning',
        message: `水温异常: ${current.temperature}°C (正常范围: ${temperature.min}-${temperature.max}°C)`
      });
    }
    
    if (current.ph < ph.min || current.ph > ph.max) {
      alerts.push({
        type: 'ph',
        level: 'warning',
        message: `pH值异常: ${current.ph} (正常范围: ${ph.min}-${ph.max})`
      });
    }
    
    if (current.oxygen < oxygen.min) {
      alerts.push({
        type: 'oxygen',
        level: 'error',
        message: `溶解氧过低: ${current.oxygen}mg/L (最低值: ${oxygen.min}mg/L)`
      });
    }
    
    return alerts;
  }
};
