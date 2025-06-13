document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('login-form');
    const unauthenticatedView = document.getElementById('unauthenticated-view');
    const authenticatedView = document.getElementById('authenticated-view');
    const logoutBtn = document.getElementById('logout-btn');
    const currentUser = document.getElementById('current-user');
    const newGrabForm = document.getElementById('new-grab-form');

    // 检查是否已登录
    const checkLoginStatus = () => {
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        const username = localStorage.getItem('username');
        if (isLoggedIn === 'true' && username) {
            unauthenticatedView.classList.add('hidden');
            authenticatedView.classList.remove('hidden');
            currentUser.textContent = username.split('@')[0];
        } else {
            unauthenticatedView.classList.remove('hidden');
            authenticatedView.classList.add('hidden');
        }
    };

    // 初始检查登录状态
    checkLoginStatus();

    // 登录表单提交
    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('remember-me').checked;

        // 简单验证
        if (!username || !password) {
            alert('请输入飞书账号和密码');
            return;
        }

        try {
            const response = await fetch('your-login-api-url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('username', username);
                if (rememberMe) {
                    localStorage.setItem('rememberMe', 'true');
                } else {
                    localStorage.removeItem('rememberMe');
                }
                checkLoginStatus();
                alert('登录成功');
            } else {
                alert(data.message || '登录失败，请重试');
            }
        } catch (error) {
            alert('网络错误，请重试');
        }
    });

    // 退出登录
    logoutBtn.addEventListener('click', function () {
        localStorage.removeItem('isLoggedIn');
        if (localStorage.getItem('rememberMe') !== 'true') {
            localStorage.removeItem('username');
        }
        checkLoginStatus();
    });

    // 新增抢单表单提交
    newGrabForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const customerName = document.getElementById('customer-name').value;
        const customerContact = document.getElementById('customer-contact').value;
        const customerPhone = document.getElementById('customer-phone').value;
        const grabTime = document.getElementById('grab-time').value;
        const priority = document.querySelector('input[name="priority"]:checked').value;
        const remarks = document.getElementById('remarks').value;

        try {
            const response = await fetch('your-new-grab-api-url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    customerName,
                    customerContact,
                    customerPhone,
                    grabTime,
                    priority,
                    remarks
                })
            });

            const data = await response.json();
            if (response.ok) {
                alert('新增抢单成功');
                newGrabForm.reset();
            } else {
                alert(data.message || '新增抢单失败，请重试');
            }
        } catch (error) {
            alert('网络错误，请重试');
        }
    });

    // 个人抢单统计图表
    const initPersonalStatsChart = () => {
        const chartDom = document.getElementById('personal-stats-chart');
        if (!chartDom) return;
        const myChart = echarts.init(chartDom);
        const option = {
            animation: false,
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                borderColor: '#e2e8f0',
                textStyle: {
                    color: '#1f2937'
                }
            },
            legend: {
                data: ['抢单数', '成功数'],
                bottom: 0
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '15%',
                top: '10%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: ['6.6', '6.7', '6.8', '6.9', '6.10', '6.11', '6.12'],
                axisLine: {
                    lineStyle: {
                        color: '#e2e8f0'
                    }
                },
                axisLabel: {
                    color: '#1f2937'
                }
            },
            yAxis: {
                type: 'value',
                axisLine: {
                    show: false
                },
                axisLabel: {
                    color: '#1f2937'
                },
                splitLine: {
                    lineStyle: {
                        color: '#e2e8f0'
                    }
                }
            },
            series: [
                {
                    name: '抢单数',
                    type: 'line',
                    smooth: true,
                    lineStyle: {
                        width: 3,
                        color: 'rgba(87, 181, 231, 1)'
                    },
                    symbol: 'none',
                    areaStyle: {
                        color: {
                            type: 'linear',
                            x: 0,
                            y: 0,
                            x2: 0,
                            y2: 1,
                            colorStops: [
                                { offset: 0, color: 'rgba(87, 181, 231, 0.2)' },
                                { offset: 1, color: 'rgba(87, 181, 231, 0.01)' }
                            ]
                        }
                    },
                    data: [5, 7, 3, 9, 6, 8, 10]
                },
                {
                    name: '成功数',
                    type: 'line',
                    smooth: true,
                    lineStyle: {
                        width: 3,
                        color: 'rgba(141, 211, 199, 1)'
                    },
                    symbol: 'none',
                    areaStyle: {
                        color: {
                            type: 'linear',
                            x: 0,
                            y: 0,
                            x2: 0,
                            y2: 1,
                            colorStops: [
                                { offset: 0, color: 'rgba(141, 211, 199, 0.2)' },
                                { offset: 1, color: 'rgba(141, 211, 199, 0.01)' }
                            ]
                        }
                    },
                    data: [3, 4, 2, 7, 4, 6, 7]
                }
            ]
        };
        myChart.setOption(option);
        window.addEventListener('resize', function () {
            myChart.resize();
        });
    };

    // 初始化图表
    initPersonalStatsChart();

    // 自定义单选框和复选框样式
    const setupCustomFormControls = () => {
        // 单选框样式
        const radioInputs = document.querySelectorAll('input[type="radio"]');
        radioInputs.forEach(radio => {
            radio.classList.add('hidden');
            const wrapper = document.createElement('span');
            wrapper.className = 'inline-block w-4 h-4 rounded-full border border-gray-300 mr-2 flex-shrink-0 relative';
            const dot = document.createElement('span');
            dot.className = 'absolute inset-1 rounded-full bg-primary transform scale-0 transition-transform duration-200';
            wrapper.appendChild(dot);
            radio.parentNode.insertBefore(wrapper, radio);

            // 初始状态
            if (radio.checked) {
                dot.classList.remove('scale-0');
                dot.classList.add('scale-100');
                wrapper.classList.add('border-primary');
            }

            // 点击事件
            wrapper.addEventListener('click', () => {
                const name = radio.getAttribute('name');
                document.querySelectorAll(`input[name="${name}"]`).forEach(r => {
                    const siblingDot = r.previousElementSibling.querySelector('span');
                    const siblingWrapper = r.previousElementSibling;
                    if (r === radio) {
                        r.checked = true;
                        siblingDot.classList.remove('scale-0');
                        siblingDot.classList.add('scale-100');
                        siblingWrapper.classList.add('border-primary');
                    } else {
                        r.checked = false;
                        siblingDot.classList.remove('scale-100');
                        siblingDot.classList.add('scale-0');
                        siblingWrapper.classList.remove('border-primary');
                    }
                });
            });
        });

        // 复选框样式
        const checkboxInputs = document.querySelectorAll('input[type="checkbox"]');
        checkboxInputs.forEach(checkbox => {
            checkbox.classList.add('hidden');
            const wrapper = document.createElement('span');
            wrapper.className = 'inline-block w-4 h-4 rounded border border-gray-300 mr-2 flex-shrink-0 relative';
            const checkmark = document.createElement('span');
            checkmark.className = 'absolute inset-0 flex items-center justify-center text-white opacity-0 transition-opacity duration-200';
            checkmark.innerHTML = '<i class="ri-check-line ri-xs"></i>';
            wrapper.appendChild(checkmark);
            checkbox.parentNode.insertBefore(wrapper, checkbox);

            // 初始状态
            if (checkbox.checked) {
                checkmark.classList.remove('opacity-0');
                checkmark.classList.add('opacity-100');
                wrapper.classList.add('bg-primary', 'border-primary');
            }

            // 点击事件
            wrapper.addEventListener('click', () => {
                checkbox.checked = !checkbox.checked;
                if (checkbox.checked) {
                    checkmark.classList.remove('opacity-0');
                    checkmark.classList.add('opacity-100');
                    wrapper.classList.add('bg-primary', 'border-primary');
                } else {
                    checkmark.classList.remove('opacity-100');
                    checkmark.classList.add('opacity-0');
                    wrapper.classList.remove('bg-primary', 'border-primary');
                }
            });
        });
    };

    // 初始化自定义表单控件
    setupCustomFormControls();
});
