// 飞书云文档API配置
const API_CONFIG = {
    baseUrl: "https://www.kdocs.cn/api/v3/ide/file/:file_id/script/:script_id/sync_task",
    token: "6pGQUK9bFZUsOZqijSs7Vs", // 替换为实际的令牌
    fileId: "ckHF3lpIzrlO", // 替换为实际的文件ID
    scriptId: "V2-7L58na42zKAfuIc9afa5bo" // 替换为实际的脚本ID
};

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

// 发送GET请求
function sendGetRequest(url, params, callback) {
    // 创建一个隐藏的iframe元素
    var iframe = document.createElement('iframe');
    iframe.name = 'getFrame';
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    // 构建完整的URL，包含参数
    var fullUrl = buildUrlWithParams(url, params);
    // 添加时间戳，避免缓存
    var timestamp = new Date().getTime();
    var uniqueUrl = fullUrl + '&timestamp=' + timestamp;

    // 设置iframe的src属性
    iframe.src = uniqueUrl;

    // 监听iframe的加载完成事件
    iframe.onload = function () {
        // 获取iframe的内容
        var iframeContent = iframe.contentDocument.body.textContent || iframe.contentDocument.body.innerText;
        // 调用回调函数处理响应数据
        callback(iframeContent);
        // 移除iframe元素
        document.body.removeChild(iframe);
    };
}

// 发送POST请求
function sendPostRequest(url, data, callback) {
    // 创建一个隐藏的iframe元素
    var iframe = document.createElement('iframe');
    iframe.name = 'postFrame';
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    // 创建一个form元素
    var form = document.createElement('form');
    form.action = url;
    form.method = 'post';
    form.target = 'postFrame';
    document.body.appendChild(form);

    // 将请求数据添加到form中
    for (var key in data) {
        if (data.hasOwnProperty(key)) {
            var input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = JSON.stringify(data[key]);
            form.appendChild(input);
        }
    }

    // 监听iframe的加载完成事件
    iframe.onload = function () {
        // 获取iframe的内容
        var iframeContent = iframe.contentDocument.body.textContent || iframe.contentDocument.body.innerText;
        // 调用回调函数处理响应数据
        callback(iframeContent);
        // 移除iframe和form元素
        document.body.removeChild(iframe);
        document.body.removeChild(form);
    };

    // 提交form表单
    form.submit();
}

// 发送请求到飞书云文档API
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

        if (type === 'getGrabRecords') {
            // 如果是获取抢单记录的请求，使用GET请求
            sendGetRequest(url, requestData.Context.argv, function (responseText) {
                try {
                    const response = JSON.parse(responseText);
                    resolve(response);
                } catch (error) {
                    reject(new Error('解析响应数据失败'));
                }
            });
        } else {
            // 其他请求使用POST请求
            sendPostRequest(url, requestData, function (responseText) {
                try {
                    const response = JSON.parse(responseText);
                    resolve(response);
                } catch (error) {
                    reject(new Error('解析响应数据失败'));
                }
            });
        }
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
