const express = require('express');
const router = express.Router();
const feeder = require('../modules/feeder');
const scheduler = require('../scheduler');

router.post('/feed', (req, res) => {
  try {
    const { amount } = req.body;
    if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: '喂食量必须为正数'
      });
    }
    const result = feeder.feed(amount);
    if (result.success) {
      res.json({
        success: true,
        data: {
          id: result.id,
          amount: result.amount
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
      message: `喂食操作失败: ${error.message}`
    });
  }
});

router.get('/history', (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const history = feeder.getFeedHistory(parseInt(limit));
    res.json({
      success: true,
      data: history,
      message: '获取喂食历史成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `获取喂食历史失败: ${error.message}`
    });
  }
});

router.post('/schedule', (req, res) => {
  try {
    const { times } = req.body;
    if (!times || !Array.isArray(times)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: '请提供喂食时间数组 times'
      });
    }
    const result = feeder.setSchedule(times);
    if (result.success) {
      scheduler.updateFeederSchedule(result.schedule);
      res.json({
        success: true,
        data: { schedule: result.schedule },
        message: '设置喂食计划成功'
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
      message: `设置喂食计划失败: ${error.message}`
    });
  }
});

router.get('/schedule', (req, res) => {
  try {
    const schedule = feeder.getSchedule();
    res.json({
      success: true,
      data: { schedule },
      message: '获取喂食计划成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `获取喂食计划失败: ${error.message}`
    });
  }
});

router.get('/today', (req, res) => {
  try {
    const todayStats = feeder.getTodayFeedCount();
    res.json({
      success: true,
      data: todayStats,
      message: '获取今日喂食统计成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `获取今日喂食统计失败: ${error.message}`
    });
  }
});

router.get('/records', (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    const records = feeder.getRecords(parseInt(limit), parseInt(offset));
    res.json({
      success: true,
      data: records,
      message: '获取喂食记录成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `获取喂食记录失败: ${error.message}`
    });
  }
});

module.exports = router;
