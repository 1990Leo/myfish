const API_BASE = '/api';

const state = {
  waterQuality: null,
  waterLevel: null,
  lighting: null,
  feeder: null,
  alarms: [],
  isRefilling: false,
  selectedFeedAmount: 5,
  thresholds: {
    tempMin: 22,
    tempMax: 28,
    phMin: 6.5,
    phMax: 8.0,
    oxygenMin: 5
  }
};

const elements = {};

function initElements() {
  elements.currentTime = document.getElementById('currentTime');
  elements.systemStatus = document.getElementById('systemStatus');
  elements.temperature = document.getElementById('temperature');
  elements.tempStatus = document.getElementById('tempStatus');
  elements.tempGauge = document.getElementById('tempGauge');
  elements.ph = document.getElementById('ph');
  elements.phStatus = document.getElementById('phStatus');
  elements.phIndicator = document.getElementById('phIndicator');
  elements.oxygen = document.getElementById('oxygen');
  elements.oxygenStatus = document.getElementById('oxygenStatus');
  elements.waterLastUpdate = document.getElementById('waterLastUpdate');
  elements.waterLevel = document.getElementById('waterLevel');
  elements.levelStatus = document.getElementById('levelStatus');
  elements.tankFill = document.getElementById('tankFill');
  elements.waterLevelSubtitle = document.getElementById('waterLevelSubtitle');
  elements.feedBtn = document.getElementById('feedBtn');
  elements.feederSubtitle = document.getElementById('feederSubtitle');
  elements.feederSchedule = document.getElementById('feederSchedule');
  elements.amountBtns = document.querySelectorAll('.amount-btn');
  elements.lightToggle = document.getElementById('lightToggle');
  elements.lightSubtitle = document.getElementById('lightSubtitle');
  elements.lightStatus = document.getElementById('lightStatus');
  elements.lightSchedule = document.getElementById('lightSchedule');
  elements.lightIconWrapper = document.getElementById('lightIconWrapper');
  elements.brightnessSlider = document.getElementById('brightnessSlider');
  elements.brightnessValue = document.getElementById('brightnessValue');
  elements.refillBtn = document.getElementById('refillBtn');
  elements.stopRefillBtn = document.getElementById('stopRefillBtn');
  elements.alarmList = document.getElementById('alarmList');
  elements.alarmBadge = document.getElementById('alarmBadge');
  elements.clearAlarmsBtn = document.getElementById('clearAlarmsBtn');
  elements.toastContainer = document.getElementById('toastContainer');
  elements.modalOverlay = document.getElementById('modalOverlay');
  elements.modal = document.getElementById('modal');
  elements.modalTitle = document.getElementById('modalTitle');
  elements.modalBody = document.getElementById('modalBody');
  elements.modalFooter = document.getElementById('modalFooter');
  elements.modalClose = document.getElementById('modalClose');
  elements.navLinks = document.querySelectorAll('.nav-link');
  elements.dashboardPage = document.getElementById('dashboardPage');
  elements.settingsPage = document.getElementById('settingsPage');
  elements.lastSync = document.getElementById('lastSync');
  elements.defaultBrightness = document.getElementById('defaultBrightness');
  elements.defaultBrightnessValue = document.getElementById('defaultBrightnessValue');
  elements.saveFeederBtn = document.getElementById('saveFeederBtn');
  elements.saveLightingBtn = document.getElementById('saveLightingBtn');
  elements.saveThresholdBtn = document.getElementById('saveThresholdBtn');
  elements.addFeedTimeBtn = document.getElementById('addFeedTimeBtn');
  elements.feederTimeInputs = document.getElementById('feederTimeInputs');
}

async function fetchAPI(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

async function fetchWaterQuality() {
  try {
    const data = await fetchAPI('/water/current');
    state.waterQuality = data;
    updateWaterQualityUI(data);
  } catch (error) {
    showToast('获取水质数据失败', 'error');
  }
}

async function fetchWaterLevel() {
  try {
    const data = await fetchAPI('/water-level/current');
    state.waterLevel = data;
    updateWaterLevelUI(data);
  } catch (error) {
    showToast('获取水位数据失败', 'error');
  }
}

async function fetchLightingStatus() {
  try {
    const data = await fetchAPI('/lighting/status');
    state.lighting = data;
    updateLightingUI(data);
  } catch (error) {
    showToast('获取灯光状态失败', 'error');
  }
}

async function fetchFeederSchedule() {
  try {
    const data = await fetchAPI('/feeder/history');
    state.feeder = data;
    updateFeederUI(data);
  } catch (error) {
    showToast('获取喂食计划失败', 'error');
  }
}

async function fetchAlarms() {
  try {
    const data = await fetchAPI('/alarm/list');
    state.alarms = data.alarms || [];
    updateAlarmsUI(state.alarms);
  } catch (error) {
    showToast('获取告警列表失败', 'error');
  }
}

async function fetchSystemStatus() {
  try {
    const data = await fetchAPI('/config/status');
    updateSystemStatusUI(data);
  } catch (error) {
    console.error('Failed to fetch system status:', error);
  }
}

function updateWaterQualityUI(data) {
  if (!data) return;
  
  const { temperature, ph, dissolvedOxygen, timestamp } = data;
  
  elements.temperature.textContent = temperature?.toFixed(1) || '--';
  elements.ph.textContent = ph?.toFixed(1) || '--';
  elements.oxygen.textContent = dissolvedOxygen?.toFixed(1) || '--';
  
  updateTemperatureStatus(temperature);
  updatePHIndicator(ph);
  updateOxygenStatus(dissolvedOxygen);
  
  if (timestamp) {
    elements.waterLastUpdate.textContent = `更新于 ${formatTime(timestamp)}`;
  }
  
  if (elements.tempGauge) {
    drawTemperatureGauge(temperature);
  }
}

function updateTemperatureStatus(temp) {
  const { tempMin, tempMax } = state.thresholds;
  let status = 'normal';
  let statusText = '正常';
  
  if (temp < tempMin) {
    status = 'warning';
    statusText = '偏低';
  } else if (temp > tempMax) {
    status = 'error';
    statusText = '偏高';
  }
  
  elements.tempStatus.className = `card-status ${status}`;
  elements.tempStatus.textContent = statusText;
  
  const card = elements.temperature.closest('.water-card');
  card.classList.remove('warning', 'error');
  if (status !== 'normal') {
    card.classList.add(status);
  }
}

function updatePHIndicator(ph) {
  if (!ph) return;
  
  const percentage = Math.min(100, Math.max(0, ((ph - 0) / 14) * 100));
  elements.phIndicator.style.left = `${percentage}%`;
  
  const { phMin, phMax } = state.thresholds;
  let status = 'normal';
  let statusText = '正常';
  
  if (ph < phMin) {
    status = 'warning';
    statusText = '偏酸';
  } else if (ph > phMax) {
    status = 'warning';
    statusText = '偏碱';
  }
  
  elements.phStatus.className = `card-status ${status}`;
  elements.phStatus.textContent = statusText;
}

function updateOxygenStatus(oxygen) {
  const { oxygenMin } = state.thresholds;
  let status = 'normal';
  let statusText = '正常';
  
  if (oxygen < oxygenMin) {
    status = 'error';
    statusText = '过低';
  }
  
  elements.oxygenStatus.className = `card-status ${status}`;
  elements.oxygenStatus.textContent = statusText;
}

function drawTemperatureGauge(temp) {
  const canvas = elements.tempGauge;
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 5;
  
  ctx.clearRect(0, 0, width, height);
  
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 6;
  ctx.stroke();
  
  const minTemp = 15;
  const maxTemp = 35;
  const percentage = Math.min(1, Math.max(0, (temp - minTemp) / (maxTemp - minTemp)));
  const endAngle = -Math.PI / 2 + (percentage * Math.PI * 1.5);
  
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#00d4aa');
  gradient.addColorStop(0.5, '#ffd700');
  gradient.addColorStop(1, '#ff6b6b');
  
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, -Math.PI / 2, endAngle);
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.stroke();
}

function updateWaterLevelUI(data) {
  if (!data) return;
  
  const level = data.level || 0;
  elements.waterLevel.textContent = level;
  elements.tankFill.style.height = `${level}%`;
  
  let status = '正常';
  let statusClass = '';
  
  if (level < 20) {
    status = '过低';
    statusClass = 'error';
  } else if (level < 40) {
    status = '偏低';
    statusClass = 'warning';
  }
  
  elements.levelStatus.textContent = status;
  elements.levelStatus.className = `level-status ${statusClass}`;
  
  if (data.isRefilling) {
    state.isRefilling = true;
    elements.waterLevelSubtitle.textContent = '补水中...';
    elements.refillBtn.classList.add('hidden');
    elements.stopRefillBtn.classList.remove('hidden');
  } else {
    state.isRefilling = false;
    elements.waterLevelSubtitle.textContent = '监测中';
    elements.refillBtn.classList.remove('hidden');
    elements.stopRefillBtn.classList.add('hidden');
  }
}

function updateLightingUI(data) {
  if (!data) return;
  
  const isOn = data.isOn;
  elements.lightToggle.checked = isOn;
  elements.lightStatus.textContent = isOn ? 'ON' : 'OFF';
  elements.lightStatus.className = `light-status ${isOn ? 'on' : ''}`;
  elements.lightSubtitle.textContent = isOn ? '已开启' : '已关闭';
  
  if (isOn) {
    elements.lightIconWrapper.classList.remove('off');
  } else {
    elements.lightIconWrapper.classList.add('off');
  }
  
  if (data.brightness !== undefined) {
    elements.brightnessSlider.value = data.brightness;
    elements.brightnessValue.textContent = `${data.brightness}%`;
  }
  
  if (data.schedule) {
    elements.lightSchedule.textContent = `${data.schedule.onTime} - ${data.schedule.offTime}`;
  }
}

function updateFeederUI(data) {
  if (!data) return;
  
  if (data.schedule && data.schedule.length > 0) {
    const scheduleText = data.schedule.map(s => `${s.time} (${s.amount}g)`).join(', ');
    elements.feederSchedule.textContent = scheduleText;
  }
  
  elements.feederSubtitle.textContent = '待机中';
}

function updateAlarmsUI(alarms) {
  if (!alarms || alarms.length === 0) {
    elements.alarmList.innerHTML = `
      <li class="alarm-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
          <line x1="9" y1="9" x2="9.01" y2="9"/>
          <line x1="15" y1="9" x2="15.01" y2="9"/>
        </svg>
        <span>暂无告警，系统运行正常</span>
      </li>
    `;
    elements.alarmBadge.classList.add('hidden');
    return;
  }
  
  elements.alarmBadge.textContent = alarms.length;
  elements.alarmBadge.classList.remove('hidden');
  
  const alarmIcons = {
    warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>`,
    error: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="15" y1="9" x2="9" y2="15"/>
      <line x1="9" y1="9" x2="15" y2="15"/>
    </svg>`,
    info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>`
  };
  
  elements.alarmList.innerHTML = alarms.map(alarm => `
    <li class="${alarm.type}">
      <div class="alarm-icon ${alarm.type}">
        ${alarmIcons[alarm.type] || alarmIcons.info}
      </div>
      <div class="alarm-content">
        <div class="alarm-message">${alarm.message}</div>
        <div class="alarm-time">${formatTime(alarm.timestamp)}</div>
      </div>
    </li>
  `).join('');
}

function updateSystemStatusUI(data) {
  if (!data) return;
  
  const statusEl = elements.systemStatus;
  const statusDot = statusEl.querySelector('.status-dot');
  const statusText = statusEl.querySelector('.status-text');
  
  statusEl.classList.remove('warning', 'error');
  
  if (data.status === 'warning') {
    statusEl.classList.add('warning');
    statusText.textContent = '需要注意';
  } else if (data.status === 'error') {
    statusEl.classList.add('error');
    statusText.textContent = '系统异常';
  } else {
    statusText.textContent = '系统正常';
  }
}

async function handleFeed() {
  const amount = state.selectedFeedAmount;
  
  try {
    elements.feedBtn.disabled = true;
    elements.feederSubtitle.textContent = '投喂中...';
    
    await fetchAPI('/feeder/feed', {
      method: 'POST',
      body: JSON.stringify({ amount })
    });
    
    showToast(`已投喂 ${amount}g 鱼食`, 'success');
    elements.feederSubtitle.textContent = '投喂完成';
    
    setTimeout(() => {
      elements.feederSubtitle.textContent = '待机中';
    }, 2000);
  } catch (error) {
    showToast('投喂失败，请重试', 'error');
    elements.feederSubtitle.textContent = '待机中';
  } finally {
    elements.feedBtn.disabled = false;
  }
}

async function handleLightToggle() {
  const isOn = elements.lightToggle.checked;
  
  try {
    await fetchAPI('/lighting/toggle', {
      method: 'POST',
      body: JSON.stringify({ isOn })
    });
    
    elements.lightStatus.textContent = isOn ? 'ON' : 'OFF';
    elements.lightStatus.className = `light-status ${isOn ? 'on' : ''}`;
    elements.lightSubtitle.textContent = isOn ? '已开启' : '已关闭';
    
    if (isOn) {
      elements.lightIconWrapper.classList.remove('off');
    } else {
      elements.lightIconWrapper.classList.add('off');
    }
    
    showToast(isOn ? '灯光已开启' : '灯光已关闭', 'success');
  } catch (error) {
    elements.lightToggle.checked = !isOn;
    showToast('操作失败，请重试', 'error');
  }
}

async function handleBrightnessChange() {
  const brightness = parseInt(elements.brightnessSlider.value);
  elements.brightnessValue.textContent = `${brightness}%`;
}

async function handleRefill() {
  try {
    await fetchAPI('/water-level/refill/start', { method: 'POST' });
    
    state.isRefilling = true;
    elements.refillBtn.classList.add('hidden');
    elements.stopRefillBtn.classList.remove('hidden');
    elements.waterLevelSubtitle.textContent = '补水中...';
    
    showToast('补水已启动', 'success');
  } catch (error) {
    showToast('启动补水失败', 'error');
  }
}

async function handleStopRefill() {
  try {
    await fetchAPI('/water-level/refill/stop', { method: 'POST' });
    
    state.isRefilling = false;
    elements.refillBtn.classList.remove('hidden');
    elements.stopRefillBtn.classList.add('hidden');
    elements.waterLevelSubtitle.textContent = '监测中';
    
    showToast('补水已停止', 'success');
  } catch (error) {
    showToast('停止补水失败', 'error');
  }
}

function handleClearAlarms() {
  showModal('清除告警', '确定要清除所有告警记录吗？', [
    { text: '取消', class: 'cancel', action: hideModal },
    { 
      text: '确定', 
      class: 'confirm', 
      action: async () => {
        state.alarms = [];
        updateAlarmsUI([]);
        hideModal();
        showToast('告警已清除', 'success');
      }
    }
  ]);
}

async function handleSaveFeederSchedule() {
  const timeInputs = elements.feederTimeInputs.querySelectorAll('.time-input-group');
  const schedule = [];
  
  timeInputs.forEach((group, index) => {
    const timeInput = group.querySelector('input[type="time"]');
    const amountInput = group.querySelector('input[type="number"]');
    
    if (timeInput.value && amountInput.value) {
      schedule.push({
        time: timeInput.value,
        amount: parseInt(amountInput.value)
      });
    }
  });
  
  try {
    await fetchAPI('/feeder/schedule', {
      method: 'POST',
      body: JSON.stringify({ schedule })
    });
    
    showToast('喂食计划已保存', 'success');
    fetchFeederSchedule();
  } catch (error) {
    showToast('保存失败，请重试', 'error');
  }
}

async function handleSaveLightingSchedule() {
  const onTime = document.getElementById('lightOnTime').value;
  const offTime = document.getElementById('lightOffTime').value;
  const brightness = parseInt(elements.defaultBrightness.value);
  
  try {
    await fetchAPI('/lighting/schedule', {
      method: 'POST',
      body: JSON.stringify({ onTime, offTime, brightness })
    });
    
    showToast('灯光计划已保存', 'success');
    fetchLightingStatus();
  } catch (error) {
    showToast('保存失败，请重试', 'error');
  }
}

function handleSaveThresholds() {
  state.thresholds = {
    tempMin: parseFloat(document.getElementById('tempMin').value),
    tempMax: parseFloat(document.getElementById('tempMax').value),
    phMin: parseFloat(document.getElementById('phMin').value),
    phMax: parseFloat(document.getElementById('phMax').value),
    oxygenMin: parseFloat(document.getElementById('oxygenMin').value)
  };
  
  showToast('阈值设置已保存', 'success');
  
  if (state.waterQuality) {
    updateWaterQualityUI(state.waterQuality);
  }
}

function addFeedTimeInput() {
  const timeInputs = elements.feederTimeInputs;
  const count = timeInputs.querySelectorAll('.time-input-group').length;
  
  if (count >= 5) {
    showToast('最多添加5个喂食时间', 'warning');
    return;
  }
  
  const newGroup = document.createElement('div');
  newGroup.className = 'time-input-group';
  newGroup.innerHTML = `
    <input type="time" id="feedTime${count + 1}" value="12:00">
    <input type="number" id="feedAmount${count + 1}" value="5" min="1" max="20" placeholder="克">
    <button class="btn-remove-time" onclick="this.parentElement.remove()">×</button>
  `;
  
  timeInputs.appendChild(newGroup);
}

function showToast(message, type = 'info') {
  const icons = {
    success: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>`,
    error: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="15" y1="9" x2="9" y2="15"/>
      <line x1="9" y1="9" x2="15" y2="15"/>
    </svg>`,
    warning: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>`,
    info: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>`
  };
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    ${icons[type]}
    <span class="toast-message">${message}</span>
  `;
  
  elements.toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function showModal(title, content, buttons = []) {
  elements.modalTitle.textContent = title;
  elements.modalBody.innerHTML = content;
  
  elements.modalFooter.innerHTML = buttons.map(btn => 
    `<button class="modal-btn ${btn.class}" id="modalBtn_${btn.text}">${btn.text}</button>`
  ).join('');
  
  buttons.forEach(btn => {
    const btnEl = document.getElementById(`modalBtn_${btn.text}`);
    if (btnEl && btn.action) {
      btnEl.addEventListener('click', btn.action);
    }
  });
  
  elements.modalOverlay.classList.remove('hidden');
}

function hideModal() {
  elements.modalOverlay.classList.add('hidden');
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function updateCurrentTime() {
  const now = new Date();
  elements.currentTime.textContent = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function switchPage(pageName) {
  elements.navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.dataset.page === pageName) {
      link.classList.add('active');
    }
  });
  
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  
  document.getElementById(`${pageName}Page`).classList.add('active');
}

function bindEvents() {
  elements.feedBtn.addEventListener('click', handleFeed);
  
  elements.amountBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.amountBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.selectedFeedAmount = parseInt(btn.dataset.amount);
    });
  });
  
  elements.lightToggle.addEventListener('change', handleLightToggle);
  elements.brightnessSlider.addEventListener('input', handleBrightnessChange);
  
  elements.refillBtn.addEventListener('click', handleRefill);
  elements.stopRefillBtn.addEventListener('click', handleStopRefill);
  
  elements.clearAlarmsBtn.addEventListener('click', handleClearAlarms);
  
  elements.navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      switchPage(link.dataset.page);
    });
  });
  
  elements.modalClose.addEventListener('click', hideModal);
  elements.modalOverlay.addEventListener('click', (e) => {
    if (e.target === elements.modalOverlay) {
      hideModal();
    }
  });
  
  elements.saveFeederBtn.addEventListener('click', handleSaveFeederSchedule);
  elements.saveLightingBtn.addEventListener('click', handleSaveLightingSchedule);
  elements.saveThresholdBtn.addEventListener('click', handleSaveThresholds);
  elements.addFeedTimeBtn.addEventListener('click', addFeedTimeInput);
  
  elements.defaultBrightness.addEventListener('input', () => {
    elements.defaultBrightnessValue.textContent = `${elements.defaultBrightness.value}%`;
  });
}

async function refreshAllData() {
  await Promise.all([
    fetchWaterQuality(),
    fetchWaterLevel(),
    fetchLightingStatus(),
    fetchAlarms()
  ]);
  
  elements.lastSync.textContent = formatTime(new Date());
}

function init() {
  initElements();
  bindEvents();
  
  updateCurrentTime();
  setInterval(updateCurrentTime, 1000);
  
  refreshAllData();
  setInterval(refreshAllData, 5000);
  
  fetchFeederSchedule();
  fetchSystemStatus();
}

document.addEventListener('DOMContentLoaded', init);
