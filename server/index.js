const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/water', require('./routes/water'));
app.use('/api/feeder', require('./routes/feeder'));
app.use('/api/lighting', require('./routes/lighting'));
app.use('/api/water-level', require('./routes/waterLevel'));
app.use('/api/alarm', require('./routes/alarm'));
app.use('/api/config', require('./routes/config'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误', message: err.message });
});

app.listen(config.server.port, config.server.host, () => {
  console.log(`智能鱼缸服务器运行在 http://${config.server.host}:${config.server.port}`);
});
