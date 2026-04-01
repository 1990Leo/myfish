const cron = require('node-cron');
const feeder = require('../modules/feeder');
const lighting = require('../modules/lighting');
const waterQuality = require('../modules/waterQuality');
const waterLevel = require('../modules/waterLevel');
const alarm = require('../modules/alarm');
const config = require('../config');

let feederJobs = [];
let lightJobs = { on: null, off: null };
let waterQualityJob = null;
let waterLevelJob = null;
let alarmJob = null;
let isRunning = false;

function parseTime(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours, minutes };
}

function generateSensorData() {
  const { temperature, ph, oxygen } = config.sensors.waterQuality;
  const tempVariation = (Math.random() - 0.5) * 4;
  const phVariation = (Math.random() - 0.5) * 0.8;
  const oxygenVariation = (Math.random() - 0.5) * 3;
  
  return {
    temperature: Math.round((temperature.optimal + tempVariation) * 10) / 10,
    ph: Math.round((ph.optimal + phVariation) * 100) / 100,
    oxygen: Math.round((oxygen.optimal + oxygenVariation) * 10) / 10
  };
}

function generateWaterLevelData() {
  const { min, max, warningLevel } = config.sensors.waterLevel;
  const baseLevel = (min + max) / 2;
  const variation = (Math.random() - 0.5) * 30;
  return Math.round(Math.max(min, Math.min(max, baseLevel + variation)));
}

function scheduleFeeder() {
  feederJobs.forEach(job => job.stop());
  feederJobs = [];
  
  const schedule = feeder.getSchedule();
  schedule.forEach(time => {
    const { hours, minutes } = parseTime(time);
    const job = cron.schedule(`${minutes} ${hours} * * *`, () => {
      console.log(`[定时任务] 自动喂食触发: ${time}`);
      const result = feeder.feed({ type: 'auto' });
      console.log(`[定时任务] 喂食完成:`, result);
    }, {
      scheduled: isRunning
    });
    feederJobs.push(job);
  });
  
  console.log('[调度器] 喂食定时任务已设置:', schedule);
}

function scheduleLighting() {
  if (lightJobs.on) lightJobs.on.stop();
  if (lightJobs.off) lightJobs.off.stop();
  
  const schedule = lighting.getSchedule();
  
  const { hours: onHours, minutes: onMinutes } = parseTime(schedule.on);
  lightJobs.on = cron.schedule(`${onMinutes} ${onHours} * * *`, () => {
    console.log(`[定时任务] 自动开灯: ${schedule.on}`);
    const result = lighting.setStatus({ status: 'on' });
    console.log(`[定时任务] 开灯完成:`, result);
  }, {
    scheduled: isRunning
  });
  
  const { hours: offHours, minutes: offMinutes } = parseTime(schedule.off);
  lightJobs.off = cron.schedule(`${offMinutes} ${offHours} * * *`, () => {
    console.log(`[定时任务] 自动关灯: ${schedule.off}`);
    const result = lighting.setStatus({ status: 'off' });
    console.log(`[定时任务] 关灯完成:`, result);
  }, {
    scheduled: isRunning
  });
  
  console.log('[调度器] 灯光定时任务已设置:', schedule);
}

function scheduleWaterQuality() {
  if (waterQualityJob) waterQualityJob.stop();
  
  waterQualityJob = cron.schedule('*/5 * * * *', () => {
    console.log('[定时任务] 水质数据采集开始');
    const sensorData = generateSensorData();
    const result = waterQuality.addRecord(sensorData);
    console.log('[定时任务] 水质数据已保存:', result);
    
    const alerts = waterQuality.checkAlerts(sensorData);
    if (alerts.length > 0) {
      console.log('[定时任务] 水质告警:', alerts);
      alerts.forEach(alert => alarm.addAlarm(alert));
    }
  }, {
    scheduled: isRunning
  });
  
  console.log('[调度器] 水质数据采集任务已设置: 每5分钟');
}

function scheduleWaterLevel() {
  if (waterLevelJob) waterLevelJob.stop();
  
  waterLevelJob = cron.schedule('*/10 * * * *', () => {
    console.log('[定时任务] 水位检查开始');
    const level = generateWaterLevelData();
    const result = waterLevel.addRecord(level);
    console.log('[定时任务] 水位数据已保存:', result);
    
    const alerts = waterLevel.checkAlert(level);
    if (alerts.length > 0) {
      console.log('[定时任务] 水位告警:', alerts);
      alerts.forEach(alert => alarm.addAlarm(alert));
    }
  }, {
    scheduled: isRunning
  });
  
  console.log('[调度器] 水位检查任务已设置: 每10分钟');
}

function scheduleAlarmCheck() {
  if (alarmJob) alarmJob.stop();
  
  alarmJob = cron.schedule('*/1 * * * *', () => {
    const alerts = alarm.checkAlerts();
    if (alerts.length > 0) {
      console.log('[定时任务] 检测到告警:', alerts);
    }
  }, {
    scheduled: isRunning
  });
  
  console.log('[调度器] 告警检查定时任务已启动: 每1分钟');
}

function startAllSchedulers() {
  if (isRunning) {
    console.log('[调度器] 定时任务已在运行中');
    return;
  }
  
  isRunning = true;
  
  scheduleFeeder();
  scheduleLighting();
  scheduleWaterQuality();
  scheduleWaterLevel();
  scheduleAlarmCheck();
  
  feederJobs.forEach(job => job.start());
  if (lightJobs.on) lightJobs.on.start();
  if (lightJobs.off) lightJobs.off.start();
  if (waterQualityJob) waterQualityJob.start();
  if (waterLevelJob) waterLevelJob.start();
  if (alarmJob) alarmJob.start();
  
  console.log('[调度器] 所有定时任务已启动');
}

function stopAllSchedulers() {
  if (!isRunning) {
    console.log('[调度器] 定时任务未在运行');
    return;
  }
  
  isRunning = false;
  
  feederJobs.forEach(job => job.stop());
  if (lightJobs.on) lightJobs.on.stop();
  if (lightJobs.off) lightJobs.off.stop();
  if (waterQualityJob) waterQualityJob.stop();
  if (waterLevelJob) waterLevelJob.stop();
  if (alarmJob) alarmJob.stop();
  
  console.log('[调度器] 所有定时任务已停止');
}

function updateFeederSchedule(times) {
  if (!Array.isArray(times) || times.length === 0) {
    throw new Error('喂食时间格式错误，应为非空数组');
  }
  
  const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
  for (const time of times) {
    if (!timeRegex.test(time)) {
      throw new Error(`无效的时间格式: ${time}，应为 HH:MM 格式`);
    }
  }
  
  feeder.setSchedule(times);
  scheduleFeeder();
  
  if (isRunning) {
    feederJobs.forEach(job => job.start());
  }
  
  console.log('[调度器] 喂食时间已更新:', times);
  return times;
}

function updateLightSchedule(onTime, offTime) {
  const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
  
  if (!timeRegex.test(onTime)) {
    throw new Error(`无效的开灯时间格式: ${onTime}，应为 HH:MM 格式`);
  }
  if (!timeRegex.test(offTime)) {
    throw new Error(`无效的关灯时间格式: ${offTime}，应为 HH:MM 格式`);
  }
  
  lighting.setSchedule({ on: onTime, off: offTime });
  scheduleLighting();
  
  if (isRunning) {
    if (lightJobs.on) lightJobs.on.start();
    if (lightJobs.off) lightJobs.off.start();
  }
  
  console.log('[调度器] 灯光时间已更新:', { on: onTime, off: offTime });
  return { on: onTime, off: offTime };
}

function getSchedulerStatus() {
  return {
    isRunning,
    feederSchedule: feeder.getSchedule(),
    lightSchedule: lighting.getSchedule(),
    jobs: {
      feeder: feederJobs.length,
      lighting: (lightJobs.on ? 1 : 0) + (lightJobs.off ? 1 : 0),
      waterQuality: waterQualityJob ? 1 : 0,
      waterLevel: waterLevelJob ? 1 : 0,
      alarm: alarmJob ? 1 : 0
    }
  };
}

function initSchedulers() {
  console.log('[调度器] 初始化定时任务...');
  
  scheduleFeeder();
  scheduleLighting();
  scheduleWaterQuality();
  scheduleWaterLevel();
  scheduleAlarmCheck();
  
  console.log('[调度器] 定时任务初始化完成（未启动）');
}

module.exports = {
  initSchedulers,
  startAllSchedulers,
  stopAllSchedulers,
  updateFeederSchedule,
  updateLightSchedule,
  getSchedulerStatus,
  scheduleFeeder,
  scheduleLighting,
  scheduleWaterQuality,
  scheduleWaterLevel,
  scheduleAlarmCheck
};
