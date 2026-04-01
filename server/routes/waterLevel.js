const express = require('express');
const router = express.Router();
const waterLevel = require('../modules/waterLevel');

router.get('/current', (req, res) => {
  try {
    const data = waterLevel.getCurrentLevel();
    res.json({
      success: true,
      data,
      message: '获取当前水位成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `获取当前水位失败: ${error.message}`
    });
  }
});

router.post('/refill/start', (req, res) => {
  try {
    const result = waterLevel.startRefill();
    if (result.success) {
      res.json({
        success: true,
        data: {
          startTime: result.startTime
        },
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        data: null,
        message: result.message
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `启动补水失败: ${error.message}`
    });
  }
});

router.post('/refill/stop', (req, res) => {
  try {
    const result = waterLevel.stopRefill();
    if (result.success) {
      res.json({
        success: true,
        data: {
          duration: result.duration
        },
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        data: null,
        message: result.message
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `停止补水失败: ${error.message}`
    });
  }
});

router.get('/status', (req, res) => {
  try {
    const status = waterLevel.getRefillStatus();
    res.json({
      success: true,
      data: status,
      message: '获取补水状态成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `获取补水状态失败: ${error.message}`
    });
  }
});

router.get('/check', (req, res) => {
  try {
    const result = waterLevel.checkLevel();
    res.json({
      success: true,
      data: result,
      message: '水位检查完成'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `水位检查失败: ${error.message}`
    });
  }
});

router.get('/records', (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    const records = waterLevel.getRecords(parseInt(limit), parseInt(offset));
    res.json({
      success: true,
      data: records,
      message: '获取水位记录成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `获取水位记录失败: ${error.message}`
    });
  }
});

router.post('/records', (req, res) => {
  try {
    const { level } = req.body;
    if (level === undefined) {
      return res.status(400).json({
        success: false,
        data: null,
        message: '请提供水位值 level'
      });
    }
    const record = waterLevel.addRecord(level);
    res.status(201).json({
      success: true,
      data: record,
      message: '添加水位记录成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `添加水位记录失败: ${error.message}`
    });
  }
});

router.get('/latest', (req, res) => {
  try {
    const record = waterLevel.getLatest();
    res.json({
      success: true,
      data: record,
      message: record ? '获取最新水位数据成功' : '暂无水位数据'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `获取最新水位数据失败: ${error.message}`
    });
  }
});

router.get('/alerts', (req, res) => {
  try {
    const latest = waterLevel.getLatest();
    if (!latest) {
      return res.json({
        success: true,
        data: [],
        message: '暂无水位数据，无法检测告警'
      });
    }
    const alerts = waterLevel.checkAlert(latest.level);
    res.json({
      success: true,
      data: alerts,
      message: '获取水位告警成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `获取水位告警失败: ${error.message}`
    });
  }
});

module.exports = router;
