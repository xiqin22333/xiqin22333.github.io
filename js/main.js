/*
  页面主逻辑（纯原生 JS）
  功能：粒子背景、Live2D看板娘、打字机标题、项目卡片、首屏滚动解锁
*/
document.addEventListener('DOMContentLoaded', function () {
  // 项目配置
  const PROJECTS = [
    {title:'项目 A', desc:'示例项目 A，纯原生前端实现。', img:'./public/projects/p1.png', link:'#'},
    {title:'项目 B', desc:'示例项目 B，响应式布局交互演示。', img:'./public/projects/p2.png', link:'#'},
    {title:'项目 C', desc:'示例项目 C，页面视觉效果展示。', img:'./public/projects/p3.png', link:'#'}
  ];

  // 元素获取（仅保留HTML中真实存在的元素）
  const particlesRoot = document.getElementById('particles-root');
  const bgLayer = document.getElementById('bg-layer');
  const projectCards = document.getElementById('project-cards');
  const typedTextEl = document.getElementById('typed-text');
  const scrollElements = document.querySelectorAll('.scroll-hide');
  const live2dContainer = document.getElementById('live2d');

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

  // ========== 加载粒子场景 ==========
  (function(){
    const script = document.createElement('script');
    script.type = 'module';
    script.src = './js/particle-scene.js';
    script.onerror = function(e){ console.error('粒子场景加载失败', e); };
    document.body.appendChild(script);
  })();

  // ========== Live2D 看板娘【彻底修复catch报错】 ==========
  function initLive2D() {
    if (!live2dContainer) return;

    // 兼容两种全局变量名，避免大小写/命名差异
    const L2D = window.L2Dwidget || window.L2D_WIDGET;
    if (typeof L2D === 'undefined') {
      live2dContainer.style.display = 'none';
      return;
    }

    // 旧版API双回调写法，完全不用.catch()
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
        function () {}, // 成功回调
        function (err) { // 失败回调（替代catch）
          live2dContainer.style.display = 'none';
          console.warn('Live2D模型加载失败，容器已隐藏', err);
        });
  }

  window.addEventListener('load', initLive2D);

  // ========== 打字机效果 ==========
  const phrases = ['前端工程师','UI 爱好者','静态页面控','Particleify 作者'];
  let ti = 0, charIdx = 0, deleting = false;

  function tick(){
    if (!typedTextEl) return; // 元素不存在直接终止，杜绝报错
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

  // ========== 渲染项目卡片 ==========
  function renderProjects(){
    if (!projectCards) return;
    projectCards.innerHTML = '';
    for (const p of PROJECTS) {
      const card = document.createElement('article');
      card.className = 'card';
      card.innerHTML = `
        <img src="${p.img}" alt="${p.title}">
        <h3>${p.title}</h3>
        <p>${p.desc}</p>
        <div style="display:flex;gap:8px;margin-top:8px">
          <a class="btn-link" href="${p.link}">查看</a>
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
  if (projectCards) projectCards.querySelectorAll('img').forEach(safeImageFallback);
});