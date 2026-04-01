const db = require('../models/database');
const config = require('../config');

module.exports = {
  getStatus() {
    const status = db.getDB()
      .prepare('SELECT * FROM light_status ORDER BY last_changed DESC LIMIT 1')
      .get();
    if (status) {
      return {
        status: status.status,
        intensity: status.intensity,
        lastChanged: status.last_changed
      };
    }
    return { status: 'off', intensity: 100, lastChanged: null };
  },

  setStatus({ status, intensity }) {
    const currentStatus = this.getStatus();
    const newStatus = status || currentStatus.status;
    const newIntensity = intensity !== undefined ? intensity : (currentStatus.intensity || 100);
    
    const stmt = db.getDB().prepare(
      'INSERT INTO light_status (status, intensity) VALUES (?, ?)'
    );
    const result = stmt.run(newStatus, newIntensity);
    return { id: result.lastInsertRowid, status: newStatus, intensity: newIntensity };
  },

  toggle() {
    const current = this.getStatus();
    const newStatus = current.status === 'on' ? 'off' : 'on';
    return this.setStatus({ status: newStatus, intensity: current.intensity });
  },

  setIntensity(intensity) {
    const intensityValue = Math.max(0, Math.min(100, intensity));
    return this.setStatus({ intensity: intensityValue });
  },

  getSchedule() {
    const configRow = db.getDB()
      .prepare("SELECT value FROM system_config WHERE key = 'light_schedule'")
      .get();
    return configRow ? JSON.parse(configRow.value) : config.lighting.defaultSchedule;
  },

  setSchedule(onTime, offTime) {
    const timePattern = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
    
    if (!timePattern.test(onTime) || !timePattern.test(offTime)) {
      return { success: false, message: '时间格式无效，请使用 HH:MM 格式' };
    }
    
    const stmt = db.getDB().prepare(
      "INSERT INTO system_config (key, value) VALUES ('light_schedule', ?) ON CONFLICT(key) DO UPDATE SET value = ?"
    );
    const schedule = { on: onTime, off: offTime };
    stmt.run(JSON.stringify(schedule), JSON.stringify(schedule));
    
    return { success: true, schedule };
  },

  getHistory(limit = 50) {
    return db.getDB()
      .prepare('SELECT * FROM light_status ORDER BY last_changed DESC LIMIT ?')
      .all(limit);
  }
};
