// 飞书云文档API配置
const API_CONFIG = {
  baseUrl: "https://www.kdocs.cn/api/v3/ide/file/:file_id/script/:script_id/sync_task",
  token: "6pGQUK9bFZUsOZqijSs7Vs", // 替换为实际的令牌
  fileId: ":ckHF3lpIzrlO", // 替换为实际的文件ID
  scriptId: ":V2-7L58na42zKAfuIc9afa5bo" // 替换为实际的脚本ID
};

// DOM元素引用
const loginForm = document.getElementById('login-form');
const newGrabForm = document.getElementById('new-grab-form');
const logoutBtn = document.getElementById('logout-btn');
const unauthenticatedView = document.getElementById('unauthenticated-view');
const authenticatedView = document.getElementById('authenticated-view');
const currentUser = document.getElementById('current-user');

// 初始化
document.addEventListener('DOMContentLoaded', function() {
  // 检查本地存储中是否有用户信息
  const user = localStorage.getItem('currentUser');
  if (user) {
    currentUser.textContent = user;
    switchToAuthenticatedView();
  }
  
  // 初始化个人抢单统计图表
  initPersonalStatsChart();
});

// 登录表单提交处理
loginForm.addEventListener('submit', function(e) {
  e.preventDefault();
  
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  
  // 发送登录请求
  sendRequest('login', { username, password })
    .then(response => {
      if (response.success) {
        // 登录成功，保存用户信息并切换视图
        localStorage.setItem('currentUser', username);
        currentUser.textContent = username;
        switchToAuthenticatedView();
      } else {
        // 登录失败，显示错误信息
        alert('登录失败：' + response.message);
      }
    })
    .catch(error => {
      console.error('登录请求出错:', error);
      alert('登录请求出错，请稍后重试');
    });
});

// 登出按钮点击处理
logoutBtn.addEventListener('click', function() {
  // 清除用户信息并切换视图
  localStorage.removeItem('currentUser');
  switchToUnauthenticatedView();
});

// 新增抢单表单提交处理
newGrabForm.addEventListener('submit', function(e) {
  e.preventDefault();
  
  // 收集表单数据
  const formData = {
    customerName: document.getElementById('customer-name').value,
    customerContact: document.getElementById('customer-contact').value,
    customerPhone: document.getElementById('customer-phone').value,
    grabTime: document.getElementById('grab-time').value,
    priority: document.querySelector('input[name="priority"]:checked').value,
    remarks: document.getElementById('remarks').value,
    userId: currentUser.textContent,
    createTime: new Date().toISOString()
  };
  
  // 发送新增抢单请求
  sendRequest('addGrab', formData)
    .then(response => {
      if (response.success) {
        // 新增成功，重置表单并显示成功信息
        newGrabForm.reset();
        alert('抢单信息已成功添加！');
        // 这里可以添加刷新抢单记录的逻辑
      } else {
        // 新增失败，显示错误信息
        alert('添加抢单信息失败：' + response.message);
      }
    })
    .catch(error => {
      console.error('新增抢单请求出错:', error);
      alert('新增抢单请求出错，请稍后重试');
    });
});

// 切换到已登录视图
function switchToAuthenticatedView() {
  unauthenticatedView.classList.add('hidden');
  authenticatedView.classList.remove('hidden');
}

// 切换到未登录视图
function switchToUnauthenticatedView() {
  unauthenticatedView.classList.remove('hidden');
  authenticatedView.classList.add('hidden');
}

// 发送请求到飞书云文档API
function sendRequest(type, data) {
  return new Promise((resolve, reject) => {
    const requestData = JSON.stringify({
      "Context": {
        "argv": {
          type,
          ...data
        },
        "sheet_name": "客户抢单数据",
        "range": "$B$156"
      }
    });
    
    const xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    
    xhr.addEventListener("readystatechange", function() {
      if (this.readyState === this.DONE) {
        if (this.status >= 200 && this.status < 300) {
          try {
            const response = JSON.parse(this.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('解析响应数据失败'));
          }
        } else {
          reject(new Error(`请求失败，状态码：${this.status}`));
        }
      }
    });
    
    const url = API_CONFIG.baseUrl
      .replace(':file_id', API_CONFIG.fileId)
      .replace(':script_id', API_CONFIG.scriptId);
    
    xhr.open("POST", url);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("AirScript-Token", API_CONFIG.token);
    
    xhr.send(requestData);
  });
}

// 获取抢单记录
function fetchGrabRecords() {
  return sendRequest('getGrabRecords', {})
    .then(response => {
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message);
      }
    });
}

// 初始化个人抢单统计图表
function initPersonalStatsChart() {
  const chartDom = document.getElementById('personal-stats-chart');
  if (!chartDom) return;
  
  const myChart = echarts.init(chartDom);
  
  // 示例数据
  const option = {
    title: {
      text: '个人抢单统计',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['抢单成功', '抢单失败', '处理中']
    },
    xAxis: {
      type: 'category',
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '抢单成功',
        data: [5, 7, 6, 8, 9, 12, 10],
        type: 'line'
      },
      {
        name: '抢单失败',
        data: [2, 3, 1, 2, 1, 3, 2],
        type: 'line'
      },
      {
        name: '处理中',
        data: [1, 2, 3, 1, 2, 1, 0],
        type: 'line'
      }
    ]
  };
  
  myChart.setOption(option);
  
  // 监听窗口大小变化，调整图表
  window.addEventListener('resize', function() {
    myChart.resize();
  });
}
