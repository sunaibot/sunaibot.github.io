// 加载导航栏
async function 加载导航栏() {
    const 响应 = await fetch('nav.html');
    const 导航HTML = await 响应.text();
    const 导航容器 = document.getElementById('导航容器');
    导航容器.innerHTML = 导航HTML;
}

// 加载侧边栏
async function 加载侧边栏() {
    const 响应 = await fetch('sidebar.html');
    const 侧边栏HTML = await 响应.text();
    const 侧边栏容器 = document.getElementById('侧边栏容器');
    侧边栏容器.innerHTML = 侧边栏HTML;
    
    // 添加头像
    const 头像容器 = document.getElementById('头像容器');
    头像容器.innerHTML = `
        <img src="https://picsum.photos/200/200" alt="博主头像" class="头像">
        <h3>博主名称</h3>
        <p>这里是博主的简介</p>
    `;
}

// 处理首页点击
function 处理首页点击(事件) {
    事件.preventDefault();
    console.log('首页被点击');
    显示博客列表();
}

// 显示博客列表
async function 显示博客列表() {
    const 博客摘要容器 = document.getElementById('博客摘要容器');
    博客摘要容器.innerHTML = '';
    
    // 模拟博客数据
    const 博客列表 = [
        {
            标题: '第一篇博客',
            内容: '这是我的第一篇博客，介绍了如何搭建博客系统...',
            日期: '2023-01-01',
            阅读量: 123
        },
        {
            标题: '关于模块化开发',
            内容: '模块化开发可以提高代码的可维护性和可扩展性...',
            日期: '2023-01-15',
            阅读量: 456
        },
        {
            标题: '如何优化前端性能',
            内容: '前端性能优化是提高用户体验的重要环节...',
            日期: '2023-02-01',
            阅读量: 789
        }
    ];
    
    // 生成博客摘要卡片
    博客列表.forEach(博客 => {
        const 博客卡片 = document.createElement('div');
        博客卡片.className = '博客卡片';
        博客卡片.innerHTML = `
            <h2 class="博客标题">${博客.标题}</h2>
            <div class="博客内容摘要">${博客.内容}</div>
            <div class="博客底部信息">
                <span>日期: ${博客.日期}</span>
                <span>阅读: ${博客.阅读量}</span>
            </div>
        `;
        
        博客摘要容器.appendChild(博客卡片);
    });
}

// 初始化博客系统
async function 初始化博客系统() {
    await 加载导航栏();
    await 加载侧边栏();
    await 显示博客列表();
}

// 页面加载完成后初始化
window.addEventListener('load', 初始化博客系统);
