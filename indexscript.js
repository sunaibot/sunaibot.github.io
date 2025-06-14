// 飞书云文档API配置（已修改为 netcut.cn 相关配置）
const NETCUT_KEY_READ = "https://netcut.cn/p/198ff0887be153df";  // 密钥文件
const NETCUT_DATA_READ = "https://netcut.cn/p/8d7bd7135b09ed43";  // 仅读数据
const NETCUT_DATA_WRITE = "https://netcut.cn/imoki3_data_write";  // 写数据

// 前端内置密钥配置
const FRONT_KEY = "kehu";    // 前端密码
const KEY_READ_KEY = "kehu";  // 密钥文件密码

// 全局变量
let globalKeyConfig = null;
let cachedBottles = null;
let lastFetchTime = 0;
const CACHE_DURATION = 300000; // 5分钟缓存

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
document.addEventListener('DOMContentLoaded', function() {
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
    
    // 加载公告信息（从 netcut.cn 获取）
    loadAnnouncements();
});

// 登录表单提交处理
loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // 发送登录请求到 netcut.cn
    login(username, password)
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
    
    // 发送新增抢单请求到 netcut.cn
    addGrab(formData)
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

// 登录功能实现
async function login(username, password) {
    try {
        // 获取读密码
        const key_read = await getPassword('data_read');
        
        // 从 netcut.cn 读取用户数据
        const userData = await getNetcutData(NETCUT_DATA_READ, key_read.password);
        
        // 查找匹配的用户
        const user = userData.find(u => u.username === username && u.password === password);
        
        if (user) {
            return { success: true, message: '登录成功', user };
        } else {
            return { success: false, message: '用户名或密码错误' };
        }
    } catch (error) {
        console.error('登录处理出错:', error);
        throw new Error('登录处理异常');
    }
}

// 新增抢单功能实现
async function addGrab(grabData) {
    try {
        // 获取写密码
        const key_write = await getPassword('data_write');
        
        // 从 netcut.cn 读取当前抢单数据
        let grabRecords = await getNetcutData(NETCUT_DATA_WRITE, key_write.password);
        
        // 确保数据是数组
        if (!Array.isArray(grabRecords)) {
            grabRecords = [];
        }
        
        // 添加新抢单记录
        grabRecords.push(grabData);
        
        // 写入更新后的数据
        await writeNecutData(NETCUT_DATA_WRITE, key_write.password, JSON.stringify(grabRecords));
        
        return { success: true, message: '抢单添加成功' };
    } catch (error) {
        console.error('添加抢单出错:', error);
        throw new Error('添加抢单异常');
    }
}

// 加载抢单记录
async function loadGrabRecords() {
    try {
        // 获取读密码
        const key_read = await getPassword('data_read');
        
        // 从 netcut.cn 读取抢单数据
        const records = await getNetcutData(NETCUT_DATA_READ, key_read.password);
        
        if (Array.isArray(records)) {
            const tableBody = grabRecordsTable.getElementsByTagName('tbody')[0];
            tableBody.innerHTML = '';
            
            records.forEach(record => {
                const row = tableBody.insertRow();
                row.insertCell().textContent = record.userId || '';
                row.insertCell().textContent = record.customerName || '';
                row.insertCell().textContent = record.grabTime || '';
                row.insertCell().textContent = record.status || '处理中';
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
            throw new Error('数据格式错误，非数组类型');
        }
    } catch (error) {
        console.error('加载抢单记录出错:', error);
        alert('加载抢单记录出错，请稍后重试');
    }
}

// 加载公告信息
async function loadAnnouncements() {
    try {
        // 获取读密码
        const key_read = await getPassword('data_read');
        
        // 从 netcut.cn 读取公告数据
        const announcements = await getNetcutData(NETCUT_DATA_READ, key_read.password);
        
        if (Array.isArray(announcements) && announcements.length > 0) {
            const announcementBoard = document.getElementById('announcement-board');
            announcementBoard.innerHTML = '';
            
            announcements.slice(0, 2).forEach(announcement => {
                const announcementElement = document.createElement('div');
                announcementElement.classList.add('flex', 'items-start', 'mb-3');
                announcementElement.innerHTML = `
                    <div class="w-8 h-8 flex items-center justify-center rounded-full bg-primary/10 text-primary mr-3 flex-shrink-0">
                        <i class="ri-volume-up-line"></i>
                    </div>
                    <div>
                        <p class="font-medium text-gray-800">${announcement.title || '公告标题'}</p>
                        <p class="text-sm text-gray-500 mt-1">${announcement.content || '公告内容'}</p>
                    </div>
                `;
                announcementBoard.appendChild(announcementElement);
            });
        }
    } catch (error) {
        console.error('加载公告出错:', error);
    }
}

// 初始化个人抢单统计图表
function initPersonalStatsChart() {
    const chartDom = document.getElementById('personal-stats-chart');
    if (!chartDom) return;
    
    const myChart = echarts.init(chartDom);
    
    // 示例数据（实际应用中可从 netcut.cn 获取）
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

// ================================业务逻辑共用函数================================
// 读内容 - netcut.cn
async function getNetcutData(url, note_pwd) {
    let result = "";
    // https://netcut.cn
    const note_id = get_note_id(url);
    const api_url = "https://api.txttool.cn/netcut/note/info/";

    // 使用URLSearchParams处理表单数据
    const formData = new URLSearchParams();
    formData.append('note_id', note_id);    // id
    formData.append('note_pwd', note_pwd);  // 密码

    // 添加请求超时处理
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    // 使用fetch API发送请求
    const response = await fetch(api_url, {
        method: 'POST',
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
        signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
        throw new Error(`HTTP错误! 状态码: ${response.status}`);
    }

    const resp = await response.json();

    const status = resp["status"];
    if (status == 1) {
        const note_content = resp["data"]["note_content"];
        result = note_content;
    } else {
        console.log("❌ 数据获取失败");
    }
    
    // 添加JSON解析
    try {
        result = JSON.parse(result);
    } catch (e) {
        console.log("数据非JSON格式:", result);
    }

    return result;
}

// 写内容 - 覆盖 - netcut.cn
async function writeNecutData(url, note_pwd, note_content) {
    let result = [];
    // https://netcut.cn
    const note_name = get_note_id(url);
    const note = await getNetcutInfo(note_name, note_pwd);
    const note_id = note["note_id"];
    const note_token = note["note_token"];
    const write_url = "https://api.txttool.cn/netcut/note/save/";
    
    // 使用URLSearchParams处理表单数据
    const formData = new URLSearchParams();
    formData.append('note_name', note_name);
    formData.append('note_id', note_id);    // id
    formData.append('note_content', note_content);
    formData.append('note_token', note_token); 
    formData.append('note_pwd', note_pwd);
    formData.append('expire_time', 259200); // 三天

    // 添加请求超时处理
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    // 使用fetch API发送请求
    const response = await fetch(write_url, {
        method: 'POST',
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
        signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
        throw new Error(`HTTP错误! 状态码: ${response.status}`);
    }

    const resp = await response.json();
    const status = resp["status"];
    if (status == 1) {
        const updated_time = resp["data"]["time"]; // 更新时间
        result[0] = status;
        result[1] = formatDate(updated_time);  // 格式化时间
    } else {
        result[0] = status;
    }

    return result;
}

// 追加 - 自定义格式追加
async function addNecutData(url, note_pwd, message) {
    let result = [];
    // https://netcut.cn
    const note_name = get_note_id(url);
    const note = await getNetcutInfo(note_name, note_pwd);
    const note_id = note["note_id"];
    const note_token = note["note_token"];
    let note_content = note["note_content"];
    
    // 解析现有内容并追加新消息
    try {
        let data = JSON.parse(note_content);
        if (!Array.isArray(data)) data = [];
        data.push(message);
        note_content = JSON.stringify(data);
    } catch (e) {
        note_content = JSON.stringify([message]);
    }

    const url = "https://api.txttool.cn/netcut/note/save/";
    // 使用URLSearchParams处理表单数据
    const formData = new URLSearchParams();
    formData.append('note_name', note_name);
    formData.append('note_id', note_id);    // id
    formData.append('note_content', note_content);
    formData.append('note_token', note_token); 
    formData.append('note_pwd', note_pwd);
    formData.append('expire_time', 259200); // 三天

    // 添加请求超时处理
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    // 使用fetch API发送请求
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
        signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
        throw new Error(`HTTP错误! 状态码: ${response.status}`);
    }

    const resp = await response.json();
    const status = resp["status"];
    if (status == 1) {
        const updated_time = resp["data"]["time"]; // 更新时间
        result[0] = status;
        result[1] = formatDate(updated_time);  // 2024-07-20 21:33:22 -> 2024/7/23 10:00
    } else {
        result[0] = status;
    }

    return result;
}

// 获取信息，含id、token
async function getNetcutInfo(note_name, note_pwd) {
    const url = "https://api.txttool.cn/netcut/note/info/";

    const formData = new URLSearchParams();
    formData.append('note_name', note_name);
    formData.append('note_pwd', note_pwd);

    // 添加请求超时处理
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    // 使用fetch API发送请求
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
        signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
        throw new Error(`HTTP错误! 状态码: ${response.status}`);
    }

    const resp = await response.json();
    const note_id = resp["data"]["note_id"];
    const note_name = resp["data"]["note_name"];  
    const note_token = resp["data"]["note_token"]; 
    const note_content = resp["data"]["note_content"];
    
    const note = {
        "note_name": note_name,
        "note_id" : note_id, 
        "note_token" : note_token,
        "note_content" : note_content,
    };
    return note;
}

// 从url获取noteid
function get_note_id(url) {
    const note_id = url.split("/");
    return note_id[note_id.length - 1];
}

// 格式化时间。2024-11-17 13:55:53 ->转化为：2024/7/23 10:01
function formatDate(dateStr) {
    if (!dateStr) return '';
    const [datePart, timePart] = dateStr.split(' ');
    const [year, month, day] = datePart.split('-');
    const [hour, minute] = timePart.split(':');

    const formattedMonth = month.replace(/^0/, ''); // 删除月份的前导零（如果有）
    const formattedDay = day.replace(/^0/, ''); // 删除日期的前导零（如果有）

    // 使用数组元素构建新的日期字符串，时间只取到时
    const formattedDate = `${year}/${formattedMonth}/${formattedDay} ${hour}:${minute}`;

    return formattedDate;
}

// ================================密钥获取、解密、缓存================================
// 解密函数统一入口
function decrypt(algorithm, encryptedStr) {
    // 输入：算法、后端密钥
    // 输出：最终密钥
    switch (algorithm) {
        case 'BMAS':
            return decrypt_BMAS(encryptedStr, FRONT_KEY);
        default:
            throw new Error(`不支持的加密算法: ${algorithm}`);
    }
}

// 密钥获取函数
async function getKeyConfig() {
    if (globalKeyConfig) {
        return globalKeyConfig;
    }
    try {
        const config = await getNetcutData(NETCUT_KEY_READ, KEY_READ_KEY);
        // 增强配置验证
        if (!config.version || !config.keys || !Array.isArray(config.keys)) {
            throw new Error('❌ 无效的密钥配置格式');
        }
        
        // 缓存到全局变量
        globalKeyConfig = config;
        console.log('密钥配置已缓存:', config);
        return config;
    } catch (error) {
        console.error(`❌ 密钥配置获取失败: ${error.message}`);
        throw error;
    }
}

// 密码获取函数 - 解密封装
async function getPassword(operationType) {
    const config = await getKeyConfig();
    const keyConfig = config.keys.find(k => k.target === operationType);
    
    if (!keyConfig) {
        throw new Error(`❌️ 未找到${operationType}操作的密钥配置`);
    }
    return {
        password: decrypt(keyConfig.algorithm, keyConfig.key),
        algorithm: keyConfig.algorithm
    };
}

// ================================BMAS加解密算法================================
// 安全Base64编码（兼容URL）
function safeBase64Encode(bytes) {
    const standard = btoa(String.fromCharCode(...bytes));
    return standard.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// 安全Base64解码
function safeBase64Decode(str) {
    const padded = str.replace(/-/g, '+').replace(/_/g, '/') 
        + '==='.slice(0, (4 - (str.length % 4)) % 4);
    return new Uint8Array([...atob(padded)].map(c => c.charCodeAt(0)));
}

// 矩阵替换层
function createCipherMatrix(key) {
    const STANDARD_BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    const seed = Array.from(key).reduce((sum, c) => sum + c.charCodeAt(0), 0);
    const chars = STANDARD_BASE64.split('');
    const shuffled = [...chars];
    
    // 确定性洗牌算法
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(fastPRNG(seed + i) * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return new Map(chars.map((char, i) => [char, shuffled[i]]));
}

// 伪随机生成（替代sin-based算法）
function fastPRNG(seed) {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
}

// 位移运算
const PRINTABLE_MIN = 32; // 空格
const PRINTABLE_MAX = 126; // ~
const PRINTABLE_RANGE = PRINTABLE_MAX - PRINTABLE_MIN + 1;

function computeShiftValue(key) {
    // 确保位移量在1-93之间（可打印字符范围）
    return Array.from(key).reduce((sum, c) => sum + c.charCodeAt(0), 0) % 93 + 1;
}

function applyShift(bytes, shift) {
    return bytes.map(b => {
        const normalized = b - PRINTABLE_MIN;
        const shifted = (normalized + shift) % PRINTABLE_RANGE;
        return PRINTABLE_MIN + (shifted < 0 ? shifted + PRINTABLE_RANGE : shifted);
    });
}

function reverseShift(bytes, shift) {
    return bytes.map(b => {
        const normalized = b - PRINTABLE_MIN;
        const unshifted = (normalized - shift) % PRINTABLE_RANGE;
        return PRINTABLE_MIN + (unshifted < 0 ? unshifted + PRINTABLE_RANGE : unshifted);
    });
}

// UTF-8编码实现 - 文本字符串转换为字节数组
function textToBytes(text) {
    let bytes = [];
    for (let i = 0; i < text.length; i++) {
        let code = text.charCodeAt(i);
        
        // 处理4字节字符（代理对）
        if (0xD800 <= code && code <= 0xDBFF) {
            let nextCode = text.charCodeAt(i + 1);
            if (0xDC00 <= nextCode && nextCode <= 0xDFFF) {
                code = (code - 0xD800) * 0x400 + nextCode - 0xDC00 + 0x10000;
                i++;
            }
        }

        // 转换为UTF-8字节
        if (code <= 0x7F) {
            bytes.push(code);
        } else if (code <= 0x7FF) {
            bytes.push(0xC0 | (code >> 6), 0x80 | (code & 0x3F));
        } else if (code <= 0xFFFF) {
            bytes.push(0xE0 | (code >> 12), 0x80 | ((code >> 6) & 0x3F), 0x80 | (code & 0x3F));
        } else {
            bytes.push(
                0xF0 | (code >> 18),
                0x80 | ((code >> 12) & 0x3F),
                0x80 | ((code >> 6) & 0x3F),
                0x80 | (code & 0x3F)
            );
        }
    }
    return new Uint8Array(bytes);
}

// UTF-8解码实现 - 字节数组转换为文本字符串
function bytesToText(bytes) {
    let str = '';
    let i = 0;
    while (i < bytes.length) {
        let byte1 = bytes[i++];
        
        // 1字节字符
        if ((byte1 & 0x80) === 0) {
            str += String.fromCharCode(byte1);
        } 
        // 2字节字符
        else if ((byte1 & 0xE0) === 0xC0) {
            let byte2 = bytes[i++];
            str += String.fromCharCode(((byte1 & 0x1F) << 6) | (byte2 & 0x3F));
        }
        // 3字节字符
        else if ((byte1 & 0xF0) === 0xE0) {
            let byte2 = bytes[i++];
            let byte3 = bytes[i++];
            let code = ((byte1 & 0x0F) << 12) | ((byte2 & 0x3F) << 6) | (byte3 & 0x3F);
            str += String.fromCharCode(code);
        }
        // 4字节字符（代理对）
        else {
            let byte2 = bytes[i++];
            let byte3 = bytes[i++];
            let byte4 = bytes[i++];
            let code = ((byte1 & 0x07) << 18) | ((byte2 & 0x3F) << 12) 
                    | ((byte3 & 0x3F) << 6) | (byte4 & 0x3F);
            
            // 转换为代理对
            code -= 0x10000;
            str += String.fromCharCode(
                0xD800 + (code >> 10),
                0xDC00 + (code & 0x3FF)
            );
        }
    }
    return str;
}

// 加密 - BMAS
function encrypt_BMAS(plainText, key) {
    try {
        // 第一层：Base64编码
        const textBytes = textToBytes(plainText);
        const base64Str = safeBase64Encode(textBytes);

        // 第二层：矩阵替换
        const matrix = createCipherMatrix(key);
        const matrixStr = [...base64Str].map(c => matrix.get(c) || c).join('');

        // 第三层：位移运算
        const shift = computeShiftValue(key);
        const shiftedBytes = applyShift(
            new Uint8Array([...matrixStr].map(c => c.charCodeAt(0))),
            shift
        );

        // 第四层：转换为可打印字符
        return Array.from(shiftedBytes)
            .map(b => String.fromCharCode(b))
            .join('');
    } catch (error) {
        console.error('加密失败:', error);
        throw new Error('加密过程异常');
    }
}

// 解密 - BMAS
function decrypt_BMAS(cipherText, key) {
    try {
        // 第四层逆：转换字节数组
        const cipherBytes = new Uint8Array(
            [...cipherText].map(c => c.charCodeAt(0))
        );

        // 第三层逆：位移还原
        const shift = computeShiftValue(key);
        const unshiftedBytes = reverseShift(cipherBytes, shift);

        // 第二层逆：矩阵还原
        const matrix = createCipherMatrix(key);
        const reverseMap = new Map([...matrix].map(([k, v]) => [v, k]));
        const base64Str = String.fromCharCode(...unshiftedBytes)
            .split('')
            .map(c => reverseMap.get(c) || c)
            .join('');

        // 第一层逆：Base64解码
        return bytesToText(safeBase64Decode(base64Str));
    } catch (error) {
        console.error('解密失败:', error);
        throw new Error('解密过程异常');
    }
}
