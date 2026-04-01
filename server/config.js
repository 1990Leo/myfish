const path = require('path');

module.exports = {
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0'
  },
  database: {
    path: path.join(__dirname, '../data/fish_tank.db'),
    backupPath: path.join(__dirname, '../data/backup/')
  },
  sensors: {
    waterQuality: {
      temperature: {
        min: 18,
        max: 32,
        optimal: 25
      },
      ph: {
        min: 6.0,
        max: 8.5,
        optimal: 7.0
      },
      oxygen: {
        min: 5,
        max: 12,
        optimal: 8
      }
    },
    waterLevel: {
      min: 20,
      max: 100,
      warningLevel: 30
    }
  },
  feeder: {
    defaultAmount: 5,
    maxAmount: 20,
    schedules: ['08:00', '12:00', '18:00']
  },
  lighting: {
    defaultSchedule: {
      on: '07:00',
      off: '22:00'
    },
    maxIntensity: 100
  },
  alarm: {
    enabled: true,
    checkInterval: 60000
  }
};
