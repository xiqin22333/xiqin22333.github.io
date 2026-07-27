/*
  页面主逻辑（纯原生 JS）
  功能：粒子背景、Live2D看板娘、打字机标题、项目卡片渲染、首屏滚动解锁
  优化：移动端自动禁用 Live2D，项目卡片带图片与外链跳转
*/
document.addEventListener('DOMContentLoaded', function () {
  // 项目配置：替换为你的真实项目名称、介绍、图片与跳转链接
  const PROJECTS = [
    {
      title: '项目 A',
      desc: '示例项目描述，可替换为你的作品介绍。',
      img: './public/projects/p1.jpg',
      link: 'https://github.com/xiqin22333'
    },
    {
      title: '项目 B',
      desc: '示例项目描述，可替换为你的作品介绍。',
      img: './public/projects/p2.jpg',
      link: 'https://github.com/xiqin22333'
    },
    {
      title: '项目 C',
      desc: '示例项目描述，可替换为你的作品介绍。',
      img: './public/projects/p3.jpg',
      link: 'https://github.com/xiqin22333'
    },
    {
      title: '项目 C',
      desc: '示例项目描述，可替换为你的作品介绍。',
      img: './public/projects/p3.jpg',
      link: 'https://github.com/xiqin22333'
    }
  ];

  // 元素获取
  const projectCards = document.getElementById('project-cards');
  const typedTextEl = document.getElementById('typed-text');
  const scrollElements = document.querySelectorAll('.scroll-hide');
  const live2dContainer = document.getElementById('live2d');
  const particlesRoot = document.getElementById('particles-root');

  // ========== 首屏滚动解锁 ==========
  let pageUnlocked = false;
  const scrollThreshold = 120;
  document.documentElement.classList.add('intro-mode');

  function unlockPage() {
    if (pageUnlocked) return;
    pageUnlocked = true;
    document.documentElement.classList.remove('intro-mode');
    scrollElements.forEach(el => el.classList.add('scroll-show'));
    window.removeEventListener('scroll', onScrollJudge);
    window.removeEventListener('wheel', onScrollJudge);
    window.removeEventListener('touchstart', onScrollJudge);
  }

  function onScrollJudge() {
    if (window.scrollY > scrollThreshold) unlockPage();
  }

  window.addEventListener('scroll', onScrollJudge, { passive: true });
  window.addEventListener('wheel', onScrollJudge, { passive: true });
  window.addEventListener('touchstart', onScrollJudge, { passive: true });

  // ========== 加载新粒子效果 ==========
  function initParticles() {
    if (!particlesRoot || !window.Particleify) return;
    Particleify.init(particlesRoot, {
      count: window.innerWidth <= 900 ? 72 : 120,
      color: '180,210,255',
      linkDistance: window.innerWidth <= 900 ? 95 : 125,
      opacity: 1
    });
  }
  initParticles();

  // ========== Live2D 看板娘 ==========
  function initLive2D() {
    if (!live2dContainer) return;

    // 移动端直接不加载
    if (window.innerWidth <= 900) {
      live2dContainer.style.display = 'none';
      return;
    }

    const L2D = window.L2Dwidget || window.L2D_WIDGET;
    if (typeof L2D === 'undefined') {
      live2dContainer.style.display = 'none';
      return;
    }

    L2D.createWidget({
          container: live2dContainer,
          model: {
            path: './public/live2d/miku/miku.model.json'
          },
          display: {
            width: '100%',
            height: '100%'
          },
          dialog: {
            enable: false
          }
        },
        function () {},
        function (err) {
          live2dContainer.style.display = 'none';
          console.warn('Live2D模型加载失败，容器已隐藏', err);
        });
  }

  window.addEventListener('load', initLive2D);

  // ========== 打字机效果 ==========
  const phrases = ['前端工程师','UI 爱好者','静态页面控','Particleify 作者'];
  let ti = 0, charIdx = 0, deleting = false;

  function tick(){
    if (!typedTextEl) return;
    const txt = phrases[ti];
    if (!deleting) {
      charIdx++;
      typedTextEl.textContent = txt.slice(0, charIdx);
      if (charIdx === txt.length) {
        deleting = true;
        setTimeout(tick, 900);
        return;
      }
    } else {
      charIdx--;
      typedTextEl.textContent = txt.slice(0, charIdx);
      if (charIdx === 0) {
        deleting = false;
        ti = (ti + 1) % phrases.length;
      }
    }
    setTimeout(tick, deleting ? 60 : 120);
  }
  tick();

  // ========== 渲染项目卡片（带图片+跳转链接） ==========
  function renderProjects(){
    if (!projectCards) return;
    projectCards.innerHTML = '';
    for (const p of PROJECTS) {
      const card = document.createElement('article');
      card.className = 'card';
      card.innerHTML = `
        <a href="${p.link}" target="_blank" style="display:block;text-decoration:none;color:inherit;">
          <img src="${p.img}" alt="${p.title}">
        </a>
        <h3>${p.title}</h3>
        <p>${p.desc}</p>
        <div style="display:flex;gap:8px;margin-top:8px">
          <a class="btn-link" href="${p.link}" target="_blank">查看项目</a>
        </div>
      `;
      projectCards.appendChild(card);
    }
  }
  renderProjects();

  // ========== 图片加载失败兜底 ==========
  function safeImageFallback(imgEl){
    imgEl.addEventListener('error', function () {
      imgEl.style.display = 'none';
      const parent = imgEl.parentElement;
      if (parent) parent.style.background = 'linear-gradient(135deg,#e6eefc,#f6f9ff)';
    });
  }
  document.querySelectorAll('img').forEach(safeImageFallback);
  if (projectCards) {
    projectCards.querySelectorAll('img').forEach(safeImageFallback);
  }
});