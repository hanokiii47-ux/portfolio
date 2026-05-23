// ===== 手电筒光圈效果 =====
const revealLayer = document.querySelector('.background-reveal');
const glowLayer = document.querySelector('.glow-layer');

// 跟踪状态
let mousePos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
let targetPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
let velocity = { x: 0, y: 0 };
let isMouseOver = false;
let decayTimer = null;

// 鼠标位置跟踪
document.addEventListener('mousemove', (e) => {
    targetPos = { x: e.clientX, y: e.clientY };
    isMouseOver = true;
    
    // 清除衰减计时器
    if (decayTimer) clearTimeout(decayTimer);
});

// 鼠标离开
document.addEventListener('mouseleave', () => {
    isMouseOver = false;
    // 800ms 后完全消失光圈
    decayTimer = setTimeout(() => {
        velocity = { x: 0, y: 0 };
    }, 800);
});

// 光圈半径参数
const RADIUS = 120; // 主圆心半径
const MAX_RADIUS = 300; // 最大影响范围

// 动画循环 - 平滑跟随
function animate() {
    // 计算速度向量
    const dx = targetPos.x - mousePos.x;
    const dy = targetPos.y - mousePos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 动态速度因子（基于距离）
    const Q = Math.min(distance * 0.002, 0.25);
    const followSpeed = Math.min(0.15 + Q, 0.4);

    // 更新位置（缓动插值）
    mousePos.x += dx * followSpeed;
    mousePos.y += dy * followSpeed;

    // 更新速度（带惯性衰减）
    const newVelX = (targetPos.x - mousePos.x) * 0.7;
    const newVelY = (targetPos.y - mousePos.y) * 0.7;
    velocity.x = newVelX * 0.7 + velocity.x * 0.3;
    velocity.y = newVelY * 0.7 + velocity.y * 0.3;

    // 鼠标离开后惯性衰减
    if (!isMouseOver) {
        mousePos.x += velocity.x;
        mousePos.y += velocity.y;
        velocity.x *= 0.95; // 衰减系数
        velocity.y *= 0.95;
    }

    // 计算光圈大小（距离越远、速度越快，光圈越大）
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
    const dynamicRadius = RADIUS + speed * 0.5;
    const maxRadius = MAX_RADIUS + speed * 0.3;

    // 更新前景层 mask-image（手电筒效果）
    const maskGradient = `
        radial-gradient(
            circle at ${mousePos.x}px ${mousePos.y}px,
            black 0%,
            rgba(0,0,0,0.8) ${dynamicRadius}px,
            rgba(0,0,0,0.5) ${dynamicRadius + 40}px,
            rgba(0,0,0,0.2) ${dynamicRadius + 80}px,
            transparent ${maxRadius}px
        )
    `;
    revealLayer.style.maskImage = maskGradient;

    // 更新光晕层（纯白色）
    const glowGradient = `
        radial-gradient(
            circle at ${mousePos.x}px ${mousePos.y}px,
            rgba(255, 255, 255, 0.2) 0%,
            rgba(255, 255, 255, 0.1) ${dynamicRadius}px,
            rgba(255, 255, 255, 0.05) ${maxRadius * 0.7}px,
            transparent ${maxRadius}px
        )
    `;
    glowLayer.style.background = glowGradient;

    requestAnimationFrame(animate);
}

animate();

// ===== 卡片弹跳交互 (BounceCards 效果) =====
const cardsContainer = document.querySelector('.cards-container');
const cards = document.querySelectorAll('.card');

// 卡片的基础变换 (模拟堆叠效果)
const baseTransforms = [
    'rotate(-5.562417984008789deg)',
    'rotate(0deg)',
    'rotate(3.0250329971313477deg)',
    'rotate(4.327476978302002deg)'
];

// 初始化卡片 - 应用 GSAP 弹跳动画
gsap.context(() => {
    gsap.fromTo(
        '.card',
        { scale: 0, opacity: 0 },
        {
            scale: 1,
            opacity: 1,
            stagger: 0.06,
            ease: 'elastic.out(1, 0.6)',
            delay: 0.8
        }
    );
}, cardsContainer);

// 卡片 hover 效果 - 推开其他卡片
cards.forEach((card, hoveredIdx) => {
    card.addEventListener('mouseenter', () => {
        cards.forEach((otherCard, i) => {
            gsap.killTweensOf(otherCard);
            
            if (i === hoveredIdx) {
                // 当前 hover 的卡片：缩小旋转、放大
                gsap.to(otherCard, {
                    rotation: 0,
                    scale: 1.05,
                    duration: 0.25,
                    ease: 'back.out(1.2)',
                    overwrite: 'auto'
                });
            } else {
                // 其他卡片：根据位置推开
                const offsetX = i < hoveredIdx ? -80 : 80;
                const distance = Math.abs(hoveredIdx - i);
                const delay = distance * 0.03;
                
                gsap.to(otherCard, {
                    x: offsetX,
                    rotation: (i < hoveredIdx ? -8 : 8),
                    duration: 0.25,
                    ease: 'back.out(1.2)',
                    delay,
                    overwrite: 'auto'
                });
            }
        });
    });
    
    card.addEventListener('mouseleave', () => {
        gsap.killTweensOf(cards);
        
        // 所有卡片恢复原位
        cards.forEach((resetCard, i) => {
            gsap.to(resetCard, {
                x: 0,
                rotation: parseFloat(baseTransforms[i].match(/-?\d+\.?\d*/)[0]),
                scale: 1,
                duration: 0.25,
                ease: 'back.out(1.2)',
                overwrite: 'auto'
            });
        });
    });
});

// 卡片点击事件 - 打开详情页面
const detailOverlay = document.querySelector('.detail-overlay');
const detailNavContainer = document.querySelector('.detail-nav-container');

// 详情模态框映射
const detailModals = {
    'card-1': document.querySelector('.detail-modal:not(.detail-modal-2):not(.detail-modal-3):not(.detail-modal-4)'),
    'card-2': document.querySelector('.detail-modal-2'),
    'card-3': document.querySelector('.detail-modal-3'),
    'card-4': document.querySelector('.detail-modal-4')
};

let currentDetailModal = null;
let currentDetailBody = null;
let currentDetailScrollTop = null;

// 卡片内容映射 - 项目1包含图片、特性展示、轮播和底部照片
const cardDetails = {
    'card-1': [
        './项目1/1@1.5x.jpg',
        './项目1/2@1.5x.jpg',
        './项目1/3@1.5x.jpg',
        './项目1/4@1.5x.jpg',
        './项目1/5@1.5x.jpg',
        './项目1/6@1.5x.jpg',
        './项目1/7@1.5x.jpg',
        'features', // 特殊标记：插入特性展示区域
        './项目1/8@1.5x.jpg',
        'carousel', // 特殊标记：插入轮播区域
        // 轮播下面的照片
        './项目1/9@1.5x.jpg',
        './项目1/10@1.5x.jpg',
        './项目1/11@1.5x.jpg',
        './项目1/13@1.5x.jpg',
        './项目1/14@1.5x.jpg',
        './项目1/15@1.5x.jpg'
    ],
    'card-2': [
        './项目2/16@1.5x.jpg',
        './项目2/17@1.5x.jpg',
        './项目2/18@1.5x.jpg',
        './项目2/19@1.5x.jpg',
        './项目2/20@1.5x.jpg',
        './项目2/21@1.5x.jpg',
        './项目2/22@1.5x.jpg',
        'container-23', // 特殊标记：插入容器@23
        './项目2/24@1.5x.jpg',
        './项目2/25@1.5x.jpg',
        './项目2/26@1.5x.jpg',
        './项目2/28@1.5x.jpg',
        './项目2/29@1.5x.jpg'
    ],
    'card-3': [
        './项目3-2/30@1.5x.jpg',
        './项目3-2/31@1.5x.jpg',
        './项目3-2/32@1.5x.jpg',
        './项目3-2/33@1.5x.jpg',
        './项目3-2/34@1.5x.jpg',
        './项目3-2/35@1.5x.jpg'
    ],
    'card-4': [
        'empty-container', // 项目4：空白容器
    ]
};

// 打开详情页面
function openDetail(cardElement) {
    const cardClass = Array.from(cardElement.classList).find(c => c.startsWith('card-'));
    const items = cardDetails[cardClass] || [];
    
    // 获取对应的详情模态框
    currentDetailModal = detailModals[cardClass];
    currentDetailBody = currentDetailModal.querySelector('.detail-body');
    currentDetailScrollTop = currentDetailModal.querySelector('.detail-scroll-top');
    
    // 更新 active 状态
    document.querySelectorAll('.detail-nav-item').forEach(navItem => {
        const navCardClass = navItem.getAttribute('data-card');
        
        // 更新 active 状态
        if (navCardClass === cardClass) {
            navItem.classList.add('active');
        } else {
            navItem.classList.remove('active');
        }
    });
    
    // 关闭其他详情模态框，只显示当前的
    Object.values(detailModals).forEach(modal => {
        modal.classList.remove('active');
    });
    
    // 清空之前的内容
    currentDetailBody.innerHTML = '';
    
    // 添加所有图片和特性展示区域
    items.forEach(item => {
        if (item === 'empty-container') {
            // 插入空白容器 - 高度与第一个项目容器高度一致
            const emptyContainer = document.createElement('div');
            emptyContainer.className = 'detail-empty-container';
            emptyContainer.style.width = '100%';
            emptyContainer.style.height = '90vh';
            emptyContainer.style.background = '#111111';
            currentDetailBody.appendChild(emptyContainer);
        } else if (item === 'container-23') {
            // 插入容器@23 - 根据D2C数据还原
            const container23 = document.createElement('div');
            container23.className = 'detail-container-23';
            container23.innerHTML = `
                <!-- 背景图片 - 容器 402473 -->
                <img src="https://p0.meituan.net/ingee/59b0308d75f82720ee32689e1b65879c822764.png" class="container-23-bg" alt="">
                
                <!-- 中间灰色遮罩容器 - image 容器 -->
                <div class="container-23-middle-overlay">
                    <video src="./案例2/冬战头图动效.mp4" class="container-23-video" autoplay loop muted playsinline></video>
                </div>
                
                <!-- 底部图片 - 容器 402475 -->
                <img src="https://p0.meituan.net/ingee/fec8f64a81f5326abb6b1ad28d211cbe5962.png" class="container-23-bottom" alt="">
            `;
            currentDetailBody.appendChild(container23);
        } else if (item === 'features') {
            // 插入特性展示区域
            const featuresSection = document.createElement('div');
            featuresSection.className = 'detail-features-section';
            featuresSection.innerHTML = `
                <div class="detail-features-container">
                    <div class="detail-feature-item">
                        <div class="detail-feature-box">
                            <video src="./案例/案例1.mp4" class="detail-feature-media" autoplay loop muted playsinline></video>
                        </div>
                        <div class="detail-feature-label">动态背景-营造氛围</div>
                    </div>

                    <div class="detail-feature-item">
                        <div class="detail-feature-box">
                            <video src="./案例/案例2.mp4" class="detail-feature-media" autoplay loop muted playsinline></video>
                        </div>
                        <div class="detail-feature-label">轮播贴纸-特色全展示</div>
                    </div>

                    <div class="detail-feature-item">
                        <div class="detail-feature-box">
                            <img src="./案例/案例3.png" class="detail-feature-media" alt="">
                        </div>
                        <div class="detail-feature-label">异形商品卡-摆脱常规</div>
                    </div>
                </div>
            `;
            currentDetailBody.appendChild(featuresSection);
        } else if (item === 'carousel') {
            // 插入轮播区域
            const carouselSection = document.createElement('div');
            carouselSection.className = 'detail-carousel-section';
            
            // 创建足够多的队列以实现无缝衔接
            const carouselItems = [
                { type: 'video', src: './222/411f4397fc3c5457b3f2b6f520fae49b.mp4' },
                { type: 'video', src: './222/4fa7cf988e7ccd25fd857ffe99f73ce1.mp4' },
                { type: 'video', src: './222/99d6ac7a0b12eba7058471622568d107.mp4' },
                { type: 'video', src: './222/合成 1.mp4' },
                { type: 'video', src: './222/大餐.mp4' },
                { type: 'image', src: './222/游园.png' },
                { type: 'image', src: './222/美发.png' }
            ];
            
            // 创建多组重复的项目（足够让新队列在画面外等待）
            let itemsHTML = '';
            const repeatCount = 4; // 重复4次以确保无缝衔接
            for (let i = 0; i < repeatCount; i++) {
                carouselItems.forEach(carouselItem => {
                    if (carouselItem.type === 'video') {
                        itemsHTML += `<div class="detail-carousel-item"><video src="${carouselItem.src}" class="detail-carousel-media" autoplay loop muted playsinline></video></div>`;
                    } else {
                        itemsHTML += `<div class="detail-carousel-item"><img src="${carouselItem.src}" class="detail-carousel-media" alt=""></div>`;
                    }
                });
            }
            
            carouselSection.innerHTML = `
                <div class="detail-carousel-container">
                    <div class="detail-carousel-track">
                        ${itemsHTML}
                    </div>
                </div>
            `;
            currentDetailBody.appendChild(carouselSection);
            
            // 实现无缝循环 - 使用基于时间的动画
            const track = carouselSection.querySelector('.detail-carousel-track');
            const itemWidth = 11.2; // vw
            const itemGap = 1.49; // vw
            const itemTotal = itemWidth + itemGap;
            const groupSize = carouselItems.length; // 每组项目数
            const groupTotal = groupSize * itemTotal; // 一组的总宽度
            const animationDuration = 50000; // 50秒完成一个循环，单位毫秒
            
            let startTime = Date.now();
            
            function animateCarousel() {
                const elapsed = Date.now() - startTime;
                const progress = (elapsed % animationDuration) / animationDuration; // 0-1循环
                
                // 计算当前滚动距离
                const totalDistance = groupTotal;
                const currentScroll = progress * totalDistance;
                
                track.style.transform = `translateX(calc(-${currentScroll}vw))`;
                requestAnimationFrame(animateCarousel);
            }
            
            animateCarousel();
        } else {
            // 添加图片
            const img = document.createElement('img');
            img.src = item;
            img.alt = '';
            currentDetailBody.appendChild(img);
        }
    });
    
    detailOverlay.classList.add('active');
    currentDetailModal.classList.add('active');
    detailNavContainer.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// 关闭详情页面
function closeDetail() {
    detailOverlay.classList.remove('active');
    Object.values(detailModals).forEach(modal => {
        modal.classList.remove('active');
    });
    detailNavContainer.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// 卡片点击事件
cards.forEach(card => {
    card.addEventListener('click', function() {
        openDetail(this);
    });
});

// 点击遮罩关闭
detailOverlay.addEventListener('click', closeDetail);

// 防止点击modal内容区域时关闭
Object.values(detailModals).forEach(modal => {
    modal.addEventListener('click', (e) => {
        e.stopPropagation();
    });
});

// 为每个详情模态框添加滚动事件监听
Object.values(detailModals).forEach(modal => {
    const body = modal.querySelector('.detail-body');
    const scrollTop = modal.querySelector('.detail-scroll-top');
    
    if (body && scrollTop) {
        // 处理回到顶部按钮
        body.addEventListener('scroll', () => {
            if (body.scrollTop > 200) {
                scrollTop.classList.add('show');
            } else {
                scrollTop.classList.remove('show');
            }
        });
        
        // 点击按钮回到顶部
        scrollTop.addEventListener('click', () => {
            body.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
});

// 左侧 tab 项目切换事件
document.querySelectorAll('.detail-nav-item').forEach(navItem => {
    navItem.addEventListener('click', function() {
        const cardClass = this.getAttribute('data-card');
        const targetCard = document.querySelector(`.${cardClass}`);
        if (targetCard) {
            openDetail(targetCard);
        }
    });
});

// ===== 加载动画 =====
window.addEventListener('load', () => {
    document.querySelectorAll('.decoration-item').forEach((item, index) => {
        item.style.animation = `fadeInUp 0.24s ease-out ${index * 0.032}s none`;
        item.style.opacity = '0';
        
        // 动画完成后，设置最终状态并清除 animation
        setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
            item.style.animation = '';
        }, (index * 0.032 + 0.24) * 1000);
    });

    document.querySelectorAll('.card').forEach((card, index) => {
        card.style.animation = `fadeInUp 0.24s ease-out ${0.12 + index * 0.04}s none`;
        card.style.opacity = '0';
        
        // 动画完成后，设置最终状态并清除 animation
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
            card.style.animation = '';
        }, (0.12 + index * 0.04 + 0.24) * 1000);
    });
});

// ===== 云朵字浮动效果 =====
const cloudClasses = ['deco-2', 'deco-3', 'deco-5', 'deco-6', 'deco-7', 'deco-8', 'deco-9', 'deco-10', 'deco-11'];
const cloudElements = {};
const TRIGGER_DISTANCE = 75; // 触发距离（px）

cloudClasses.forEach(className => {
    const el = document.querySelector('.' + className);
    if (!el) return;
    
    // 随机生成 ±3deg 的旋转角度
    const randomRotation = (Math.random() > 0.5 ? 1 : -1) * 3;
    el.style.setProperty('--rotation', `${randomRotation}deg`);
    
    // 保存元素信息
    cloudElements[className] = {
        el: el,
        active: false
    };
});

// 全局鼠标移动事件 - 基于距离的触发
document.addEventListener('mousemove', (e) => {
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    cloudClasses.forEach(className => {
        const info = cloudElements[className];
        if (!info) return;
        
        const el = info.el;
        const rect = el.getBoundingClientRect();
        
        // 计算元素中心点
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // 计算鼠标到元素的距离
        const distance = Math.sqrt(
            Math.pow(mouseX - centerX, 2) + Math.pow(mouseY - centerY, 2)
        );
        
        // 如果距离在触发范围内，添加浮动效果
        if (distance < TRIGGER_DISTANCE) {
            if (!info.active) {
                info.active = true;
                el.classList.add('floating');
            }
        } else {
            if (info.active) {
                info.active = false;
                el.classList.remove('floating');
            }
        }
    });
});

// 鼠标离开页面时移除所有浮动效果
document.addEventListener('mouseleave', () => {
    cloudClasses.forEach(className => {
        const info = cloudElements[className];
        if (info) {
            info.active = false;
            info.el.classList.remove('floating');
        }
    });
});

// ===== 首页导航逻辑 =====

// 1. 关于项目 - 点击后打开项目1
document.getElementById('nav-about-project').addEventListener('click', function() {
    const card1 = document.querySelector('.card-1');
    if (card1) {
        openDetail(card1);
    }
});

// 2. 联系我 - 鼠标移入时显示微信二维码浮层
const navContact = document.getElementById('nav-contact');
const wechatPopup = navContact.querySelector('.wechat-popup');

navContact.addEventListener('mouseenter', function() {
    wechatPopup.classList.add('show');
});

navContact.addEventListener('mouseleave', function() {
    wechatPopup.classList.remove('show');
});
