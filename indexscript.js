// 飞书云文档API配置
const API_CONFIG = {
    baseUrl: "https://www.kdocs.cn/api/v3/ide/file/:file_id/script/:script_id/sync_task",
    token: "6pGQUK9bFZUsOZqijSs7Vs", // 替换为实际的令牌
    fileId: "ckHF3lpIzrlO", // 替换为实际的文件ID
    scriptId: "V2-7L58na42zKAfuIc9afa5bo" // 替换为实际的脚本ID
};

// 使用CORS代理服务
const CORS_PROXY = "https://api.allorigins.win/raw?url=";

// DOM元素引用
const loginForm = document.getElementById('login-form');
const newGrabForm = document.getElementById('new-grab-form');
const logoutBtn = document.getElementById('logout-btn');
const unauthenticatedView = document.getElementById('unauthenticated-view');
const authenticatedView = document.getElementById('authenticated-view');
const currentUser = document.getElementById('current-user');
const grabRecordsTable = document.getElementById('grab-records-table');
const newGrabFormContainer = document.getElementById('new-grab-form-container');

// 初始化
document.addEventListener('DOMContentLoaded', function () {
    // 检查本地存储中是否有用户信息
    const user = localStorage.getItem('currentUser');
    if (user) {
        currentUser.textContent = user;
        switchToAuthenticatedView();
        // 加载抢单记录
        loadGrabRecords();
    }

    // 初始化个人抢单统计图表
    initPersonalStatsChart();
});

// 登录表单提交处理
loginForm.addEventListener('submit', function (e) {
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
                // 加载抢单记录
                loadGrabRecords();
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
logoutBtn.addEventListener('click', function () {
    // 清除用户信息并切换视图
    localStorage.removeItem('currentUser');
    switchToUnauthenticatedView();
});

// 新增抢单表单提交处理
newGrabForm.addEventListener('submit', function (e) {
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
                hideNewGrabForm();
                alert('抢单信息已成功添加！');
                // 刷新抢单记录
                loadGrabRecords();
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

// 显示新增抢单表单
function showNewGrabForm() {
    newGrabFormContainer.classList.remove('hidden');
}

// 隐藏新增抢单表单
function hideNewGrabForm() {
    newGrabFormContainer.classList.add('hidden');
}

// 构建带参数的URL
function buildUrlWithParams(url, params) {
    const queryString = Object.keys(params)
      .map(function (key) {
            return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
        })
      .join('&');
    return url + (url.indexOf('?') !== -1 ? '&' : '?') + queryString;
}

// 发送请求到金山多维表airscript webhook API
function sendRequest(type, data) {
    return new Promise((resolve, reject) => {
        const requestData = {
            "Context": {
                "argv": {
                    type,
                    ...data
                },
                "sheet_name": "客户抢单数据",
                "range": "$B$156"
            }
        };

        const url = API_CONFIG.baseUrl
          .replace(':file_id', API_CONFIG.fileId)
          .replace(':script_id', API_CONFIG.scriptId);
        
        // 使用CORS代理
        const proxyUrl = CORS_PROXY + encodeURIComponent(url);
        console.log(proxyUrl)
        // 设置请求选项
        const options = {
            method: type === 'getGrabRecords' ? 'GET' : 'POST',
            headers: {
                'Content-Type': 'application/json',
                'AirScript-Token': `${API_CONFIG.token}`
            }
        };
        
        // 添加请求体（POST请求）
        if (options.method === 'POST') {
            options.body = JSON.stringify(requestData);
        }

        // 使用fetch发送请求
        fetch(proxyUrl, options)
          .then(response => {
              if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
              }
              return response.json();
          })
          .then(response => resolve(response))
          .catch(error => reject(error));
    });
}

// 加载抢单记录
function loadGrabRecords() {
    sendRequest('getGrabRecords', {})
      .then(response => {
            if (response.success) {
                const records = response.data;
                const tableBody = grabRecordsTable.getElementsByTagName('tbody')[0];
                tableBody.innerHTML = '';

                records.forEach(record => {
                    const row = tableBody.insertRow();
                    row.insertCell().textContent = record.userId;
                    row.insertCell().textContent = record.customerName;
                    row.insertCell().textContent = record.grabTime;
                    row.insertCell().textContent = record.status;
                    const actionCell = row.insertCell();
                    const viewButton = document.createElement('button');
                    viewButton.textContent = '查看';
                    viewButton.classList.add('bg-primary', 'text-white', 'px-2', 'py-1', 'rounded-button', 'mr-2');
                    actionCell.appendChild(viewButton);
                    const editButton = document.createElement('button');
                    editButton.textContent = '编辑';
                    editButton.classList.add('bg-secondary', 'text-white', 'px-2', 'py-1', 'rounded-button');
                    actionCell.appendChild(editButton);
                });
            } else {
                throw new Error(response.message);
            }
        })
      .catch(error => {
            console.error('加载抢单记录出错:', error);
            alert('加载抢单记录出错，请稍后重试');
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
    window.addEventListener('resize', function () {
        myChart.resize();
    });
}
