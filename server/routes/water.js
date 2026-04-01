const express = require('express');
const router = express.Router();
const waterQuality = require('../modules/waterQuality');

router.get('/current', (req, res) => {
  try {
    const data = waterQuality.getCurrentData();
    res.json({
      success: true,
      data,
      message: '获取当前水质数据成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `获取水质数据失败: ${error.message}`
    });
  }
});

router.get('/history', (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const data = waterQuality.getHistory(hours);
    res.json({
      success: true,
      data,
      message: `获取最近${hours}小时水质历史数据成功`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `获取历史数据失败: ${error.message}`
    });
  }
});

router.get('/records', (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    const records = waterQuality.getRecords(parseInt(limit), parseInt(offset));
    res.json({
      success: true,
      data: records,
      message: '获取水质记录成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `获取水质记录失败: ${error.message}`
    });
  }
});

router.post('/records', (req, res) => {
  try {
    const { temperature, ph, oxygen } = req.body;
    if (temperature === undefined || ph === undefined || oxygen === undefined) {
      return res.status(400).json({
        success: false,
        data: null,
        message: '缺少必要参数: temperature, ph, oxygen'
      });
    }
    const record = waterQuality.addRecord({ temperature, ph, oxygen });
    res.status(201).json({
      success: true,
      data: record,
      message: '添加水质记录成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `添加水质记录失败: ${error.message}`
    });
  }
});

router.get('/latest', (req, res) => {
  try {
    const record = waterQuality.getLatest();
    res.json({
      success: true,
      data: record,
      message: record ? '获取最新水质数据成功' : '暂无水质数据'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `获取最新水质数据失败: ${error.message}`
    });
  }
});

router.get('/stats', (req, res) => {
  try {
    const stats = waterQuality.getStats();
    res.json({
      success: true,
      data: stats,
      message: '获取水质统计数据成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `获取统计数据失败: ${error.message}`
    });
  }
});

router.get('/alerts', (req, res) => {
  try {
    const latest = waterQuality.getLatest();
    if (!latest) {
      return res.json({
        success: true,
        data: [],
        message: '暂无水质数据，无法检测告警'
      });
    }
    const alerts = waterQuality.checkAlerts(latest);
    res.json({
      success: true,
      data: alerts,
      message: '获取水质告警成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `获取水质告警失败: ${error.message}`
    });
  }
});

module.exports = router;
