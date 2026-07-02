/*
  页面主逻辑（纯原生 JS）
  功能：
  - 初始化粒子背景
  - Live2D 看板娘初始化（本地加载，容错兜底）
  - 打字机动态标题
  - 项目卡片渲染
  - 多套壁纸一键切换
  - 设置面板：毛玻璃强度、背景亮度开关
  - 侧边栏：图标导航+悬停展开文字
  - 首屏逻辑：初始内容下沉隐藏，滚动一次永久解锁显示
*/
(function(){
  // 配置
  const WALLPAPERS = [
    './public/wallpapers/wallpaper1.png',
    './public/wallpapers/wallpaper2.png',
    './public/wallpapers/wallpaper3.png'
  ];

  const PROJECTS = [
    {title:'项目 A', desc:'示例项目 A，使用纯原生前端实现。', img:'./public/projects/p1.png', link:'#'},
    {title:'项目 B', desc:'示例项目 B，演示响应式布局与交互。', img:'./public/projects/p2.png', link:'#'},
    {title:'项目 C', desc:'示例项目 C，展示可切换壁纸与设置面板。', img:'./public/projects/p3.png', link:'#'}
  ];

  // 元素获取
  const particlesRoot = document.getElementById('particles-root');
  const bgLayer = document.getElementById('bg-layer');
  const sidebar = document.getElementById('sidebar');
  const settingsModal = document.getElementById('settings-modal');
  const openSettingsBtn = document.getElementById('open-settings');
  const closeSettingsBtn = document.getElementById('close-settings');
  const modalMask = document.getElementById('modal-mask');
  const blurRange = document.getElementById('blur-range');
  const blurValue = document.getElementById('blur-value');
  const bgDimToggle = document.getElementById('bg-dim-toggle');
  const wallpaperList = document.getElementById('wallpaper-list');
  const projectCards = document.getElementById('project-cards');
  const typedTextEl = document.getElementById('typed-text');
  const scrollElements = document.querySelectorAll('.scroll-hide');
  const live2dContainer = document.getElementById('live2d');

  // 全局解锁标记
  let pageUnlocked = false;
  const scrollThreshold = 120;

  // Intro 首屏模式
  document.documentElement.classList.add('intro-mode');

  function unlockPage() {
    if(pageUnlocked) return;
    pageUnlocked = true;
    document.documentElement.classList.remove('intro-mode');
    scrollElements.forEach(el => el.classList.add('scroll-show'));
    window.removeEventListener('scroll', onScrollJudge);
    window.removeEventListener('wheel', onScrollJudge);
    window.removeEventListener('touchstart', onScrollJudge);
  }

  function onScrollJudge() {
    if(window.scrollY > scrollThreshold){
      unlockPage();
    }
  }

  window.addEventListener('scroll', onScrollJudge, {passive:true});
  window.addEventListener('wheel', onScrollJudge, {passive:true});
  window.addEventListener('touchstart', onScrollJudge, {passive:true});

  // 加载 3D 粒子场景
  (function(){
    const script = document.createElement('script');
    script.type = 'module';
    script.src = './js/particle-scene.js';
    script.onerror = function(e){ console.error('加载粒子场景失败', e); };
    document.body.appendChild(script);
  })();

  // ========== Live2D 看板娘初始化 ==========
  function initLive2D() {
    const live2dContainer = document.getElementById('live2d');
    if (!live2dContainer) return;

    // 库未加载成功：直接隐藏容器，不留空白
    if (typeof L2D_WIDGET === 'undefined') {
      live2dContainer.style.display = 'none';
      return;
    }

    L2D_WIDGET.createWidget({
      container: live2dContainer,
      model: {
        // 后续换成你的本地模型路径即可，例如：

        path: 'https://cdn.jsdelivr.net/npm/live2d-widget-model-miku/assets/miku.model.json'
        // https://cdn.jsdelivr.net/npm/live2d-widget-model-miku/assets/miku.model.json miku
        // https://model.hacxy.cn/cat-black/model.json 黑猫

      },
      display: {
        width: '100%',
        height: '100%'
      },
      dialog: {
        enable: false
      }
    }).catch(() => {
      // 模型加载失败：隐藏容器，消除空白区域
      live2dContainer.style.display = 'none';
      console.warn('Live2D 模型加载失败，容器已隐藏');
    });
  }

  window.addEventListener('load', initLive2D);

  // 打字机效果
  const phrases = ['前端工程师','UI 爱好者','静态页面控','Particleify 作者'];
  let ti = 0, charIdx = 0, deleting = false;
  function tick(){
    const txt = phrases[ti];
    if(!deleting){
      charIdx++;
      typedTextEl.textContent = txt.slice(0,charIdx);
      if(charIdx === txt.length){
        deleting = true;
        setTimeout(tick, 900);
        return;
      }
    } else {
      charIdx--;
      typedTextEl.textContent = txt.slice(0,charIdx);
      if(charIdx === 0){
        deleting = false;
        ti = (ti + 1) % phrases.length;
      }
    }
    setTimeout(tick, deleting ? 60 : 120);
  }
  tick();

  // 渲染项目卡片
  function renderProjects(){
    projectCards.innerHTML = '';
    for(const p of PROJECTS){
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

  // 设置面板开关
  openSettingsBtn.addEventListener('click', ()=>{ settingsModal.setAttribute('aria-hidden','false'); });
  closeSettingsBtn.addEventListener('click', ()=>{ settingsModal.setAttribute('aria-hidden','true'); });
  modalMask.addEventListener('click', ()=>{ settingsModal.setAttribute('aria-hidden','true'); });

  // 读取本地存储配置
  const savedBlur = localStorage.getItem('site-glass-blur');
  const savedDim = localStorage.getItem('site-bg-dim');
  const savedWallpaper = localStorage.getItem('site-wallpaper');

  function setBlur(px){
    document.documentElement.style.setProperty('--glass-blur', px + 'px');
    blurValue.textContent = px;
    blurRange.value = px;
    localStorage.setItem('site-glass-blur', px);
  }
  function setBgDim(enabled){
    document.documentElement.style.setProperty('--bg-dim', enabled ? '0.35' : '0');
    bgDimToggle.checked = !!enabled;
    localStorage.setItem('site-bg-dim', enabled ? '1' : '0');
  }
  function setWallpaper(url){
    if(url){
      bgLayer.style.backgroundImage = `url('${url}')`;
      localStorage.setItem('site-wallpaper', url);
      Array.from(wallpaperList.children).forEach(el=>{
        el.classList.toggle('active', el.dataset.src === url);
      });
    } else {
      bgLayer.style.backgroundImage = '';
    }
  }

  setBlur(savedBlur ? Number(savedBlur) : 10);
  setBgDim(savedDim === '1');
  setWallpaper(savedWallpaper || WALLPAPERS[0]);

  blurRange.addEventListener('input', (e)=> setBlur(Number(e.target.value)));
  bgDimToggle.addEventListener('change', (e)=> setBgDim(e.target.checked));

  // 渲染壁纸缩略图
  function renderWallpaperThumbs(){
    wallpaperList.innerHTML = '';
    WALLPAPERS.forEach(src=>{
      const d = document.createElement('div');
      d.className = 'wp-thumb';
      d.dataset.src = src;
      d.innerHTML = `<img src="${src}" alt="wallpaper">`;
      d.addEventListener('click', ()=> setWallpaper(src));
      wallpaperList.appendChild(d);
    });
    const current = localStorage.getItem('site-wallpaper') || WALLPAPERS[0];
    Array.from(wallpaperList.children).forEach(el=>{
      el.classList.toggle('active', el.dataset.src === current);
    });
  }
  renderWallpaperThumbs();

  // 快捷键
  window.addEventListener('keydown', (e)=>{
    if(e.key.toLowerCase() === 's') settingsModal.setAttribute('aria-hidden','false');
    if(e.key === 'Escape') settingsModal.setAttribute('aria-hidden','true');
  });

  // 图片加载失败兜底
  function safeImageFallback(imgEl){
    imgEl.addEventListener('error', ()=>{
      imgEl.style.display = 'none';
      const parent = imgEl.parentElement;
      if(parent) parent.style.background = 'linear-gradient(135deg,#e6eefc,#f6f9ff)';
    });
  }
  document.querySelectorAll('img').forEach(safeImageFallback);
  projectCards.querySelectorAll('img').forEach(safeImageFallback);

})();