const express = require('express');
const router = express.Router();
const alarm = require('../modules/alarm');

router.get('/list', (req, res) => {
  try {
    const { limit = 50, unresolved } = req.query;
    const unresolvedOnly = unresolved === 'true';
    const records = alarm.getRecords(parseInt(limit), unresolvedOnly);
    res.json({
      success: true,
      data: records,
      message: '获取告警列表成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `获取告警列表失败: ${error.message}`
    });
  }
});

router.post('/:id/read', (req, res) => {
  try {
    const { id } = req.params;
    const result = alarm.markAsRead(parseInt(id));
    if (result.success) {
      res.json({
        success: true,
        data: null,
        message: result.message
      });
    } else {
      res.status(404).json({
        success: false,
        data: null,
        message: result.message
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `标记告警已读失败: ${error.message}`
    });
  }
});

router.get('/records', (req, res) => {
  try {
    const { limit = 100, unresolved = false } = req.query;
    const records = alarm.getRecords(parseInt(limit), unresolved === 'true');
    res.json({
      success: true,
      data: records,
      message: '获取告警记录成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `获取告警记录失败: ${error.message}`
    });
  }
});

router.post('/resolve/:id', (req, res) => {
  try {
    const { id } = req.params;
    alarm.resolve(parseInt(id));
    res.json({
      success: true,
      data: null,
      message: '告警已解决'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `解决告警失败: ${error.message}`
    });
  }
});

router.post('/resolve-all', (req, res) => {
  try {
    alarm.resolveAll();
    res.json({
      success: true,
      data: null,
      message: '所有告警已标记为已解决'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `批量解决告警失败: ${error.message}`
    });
  }
});

router.get('/check', (req, res) => {
  try {
    const alerts = alarm.checkAlerts();
    res.json({
      success: true,
      data: alerts,
      message: '告警检查完成'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `告警检查失败: ${error.message}`
    });
  }
});

router.get('/unresolved-count', (req, res) => {
  try {
    const count = alarm.getUnresolvedCount();
    res.json({
      success: true,
      data: { count },
      message: '获取未解决告警数量成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `获取未解决告警数量失败: ${error.message}`
    });
  }
});

router.get('/type/:type', (req, res) => {
  try {
    const { type } = req.params;
    const { limit = 50 } = req.query;
    const records = alarm.getAlertsByType(type, parseInt(limit));
    res.json({
      success: true,
      data: records,
      message: `获取 ${type} 类型告警成功`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `获取类型告警失败: ${error.message}`
    });
  }
});

router.get('/recent', (req, res) => {
  try {
    const { hours = 24 } = req.query;
    const records = alarm.getRecentAlerts(parseInt(hours));
    res.json({
      success: true,
      data: records,
      message: `获取最近${hours}小时告警成功`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `获取最近告警失败: ${error.message}`
    });
  }
});

router.post('/add', (req, res) => {
  try {
    const { type, message, level } = req.body;
    if (!type || !message) {
      return res.status(400).json({
        success: false,
        data: null,
        message: '请提供告警类型 type 和消息 message'
      });
    }
    const result = alarm.addAlarm({ type, message, level });
    res.status(201).json({
      success: true,
      data: result,
      message: '添加告警成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `添加告警失败: ${error.message}`
    });
  }
});

module.exports = router;
