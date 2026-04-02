const express = require('express');
const router = express.Router();
const db = require('../models/database');
const scheduler = require('../scheduler');
const config = require('../config');

router.get('/', (req, res) => {
  try {
    const configs = db.getDB().prepare('SELECT * FROM system_config').all();
    const result = {};
    configs.forEach(c => {
      try {
        result[c.key] = JSON.parse(c.value);
      } catch {
        result[c.key] = c.value;
      }
    });
    res.json({
      success: true,
      data: result,
      message: '获取所有配置成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `获取配置失败: ${error.message}`
    });
  }
});

router.put('/', (req, res) => {
  try {
    const updates = req.body;
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({
        success: false,
        data: null,
        message: '请提供配置更新对象'
      });
    }
    
    const stmt = db.getDB().prepare(`
      INSERT INTO system_config (key, value, updated_at) 
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP
    `);
    
    const updatedKeys = [];
    for (const [key, value] of Object.entries(updates)) {
      const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
      stmt.run(key, valueStr, valueStr);
      updatedKeys.push(key);
    }
    
    res.json({
      success: true,
      data: { updatedKeys },
      message: '配置更新成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `更新配置失败: ${error.message}`
    });
  }
});

router.get('/status', (req, res) => {
  try {
    const schedulerStatus = scheduler.getSchedulerStatus();
    res.json({
      success: true,
      data: {
        scheduler: schedulerStatus,
        server: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          timestamp: new Date().toISOString()
        }
      },
      message: '获取系统状态成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `获取系统状态失败: ${error.message}`
    });
  }
});

router.get('/:key', (req, res) => {
  try {
    const { key } = req.params;
    const configRow = db.getDB().prepare('SELECT * FROM system_config WHERE key = ?').get(key);
    if (!configRow) {
      return res.status(404).json({
        success: false,
        data: null,
        message: '配置项不存在'
      });
    }
    let value;
    try {
      value = JSON.parse(configRow.value);
    } catch {
      value = configRow.value;
    }
    res.json({
      success: true,
      data: { key, value },
      message: '获取配置项成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `获取配置项失败: ${error.message}`
    });
  }
});

router.post('/:key', (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    if (value === undefined) {
      return res.status(400).json({
        success: false,
        data: null,
        message: '请提供配置值 value'
      });
    }
    const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
    db.getDB().prepare(`
      INSERT INTO system_config (key, value, updated_at) 
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP
    `).run(key, valueStr, valueStr);
    res.json({
      success: true,
      data: { key, value },
      message: '设置配置项成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `设置配置项失败: ${error.message}`
    });
  }
});

router.delete('/:key', (req, res) => {
  try {
    const { key } = req.params;
    const result = db.getDB().prepare('DELETE FROM system_config WHERE key = ?').run(key);
    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: '配置项不存在'
      });
    }
    res.json({
      success: true,
      data: null,
      message: '删除配置项成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `删除配置项失败: ${error.message}`
    });
  }
});

router.get('/default/sensors', (req, res) => {
  try {
    res.json({
      success: true,
      data: config.sensors,
      message: '获取默认传感器配置成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `获取默认传感器配置失败: ${error.message}`
    });
  }
});

router.get('/default/feeder', (req, res) => {
  try {
    res.json({
      success: true,
      data: config.feeder,
      message: '获取默认喂食器配置成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `获取默认喂食器配置失败: ${error.message}`
    });
  }
});

router.get('/default/lighting', (req, res) => {
  try {
    res.json({
      success: true,
      data: config.lighting,
      message: '获取默认灯光配置成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `获取默认灯光配置失败: ${error.message}`
    });
  }
});

module.exports = router;
