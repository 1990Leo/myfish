const express = require('express');
const router = express.Router();
const lighting = require('../modules/lighting');
const scheduler = require('../scheduler');

router.get('/status', (req, res) => {
  try {
    const status = lighting.getStatus();
    res.json({
      success: true,
      data: status,
      message: '获取灯光状态成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `获取灯光状态失败: ${error.message}`
    });
  }
});

router.post('/toggle', (req, res) => {
  try {
    const result = lighting.toggle();
    res.json({
      success: true,
      data: {
        status: result.status,
        intensity: result.intensity
      },
      message: `灯光已${result.status === 'on' ? '打开' : '关闭'}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `切换灯光状态失败: ${error.message}`
    });
  }
});

router.post('/schedule', (req, res) => {
  try {
    const { onTime, offTime } = req.body;
    if (!onTime || !offTime) {
      return res.status(400).json({
        success: false,
        data: null,
        message: '请提供开灯时间 onTime 和关灯时间 offTime'
      });
    }
    const result = lighting.setSchedule(onTime, offTime);
    if (result.success) {
      scheduler.updateLightSchedule(onTime, offTime);
      res.json({
        success: true,
        data: { schedule: result.schedule },
        message: '设置灯光计划成功'
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
      message: `设置灯光计划失败: ${error.message}`
    });
  }
});

router.get('/schedule', (req, res) => {
  try {
    const schedule = lighting.getSchedule();
    res.json({
      success: true,
      data: { schedule },
      message: '获取灯光计划成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `获取灯光计划失败: ${error.message}`
    });
  }
});

router.post('/intensity', (req, res) => {
  try {
    const { intensity } = req.body;
    if (intensity === undefined) {
      return res.status(400).json({
        success: false,
        data: null,
        message: '请提供亮度值 intensity'
      });
    }
    const intensityValue = parseInt(intensity);
    if (isNaN(intensityValue) || intensityValue < 0 || intensityValue > 100) {
      return res.status(400).json({
        success: false,
        data: null,
        message: '亮度值必须在 0-100 之间'
      });
    }
    const result = lighting.setIntensity(intensityValue);
    res.json({
      success: true,
      data: {
        intensity: result.intensity
      },
      message: `亮度已设置为 ${intensityValue}%`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `设置亮度失败: ${error.message}`
    });
  }
});

router.get('/history', (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const history = lighting.getHistory(parseInt(limit));
    res.json({
      success: true,
      data: history,
      message: '获取灯光历史成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `获取灯光历史失败: ${error.message}`
    });
  }
});

router.post('/on', (req, res) => {
  try {
    const result = lighting.setStatus({ status: 'on' });
    res.json({
      success: true,
      data: {
        status: result.status,
        intensity: result.intensity
      },
      message: '灯光已打开'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `打开灯光失败: ${error.message}`
    });
  }
});

router.post('/off', (req, res) => {
  try {
    const result = lighting.setStatus({ status: 'off' });
    res.json({
      success: true,
      data: {
        status: result.status,
        intensity: result.intensity
      },
      message: '灯光已关闭'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `关闭灯光失败: ${error.message}`
    });
  }
});

module.exports = router;
