/*
  Particleify — 轻量自研粒子系统（纯原生 JS，无外部依赖）
  要点：
  - 将画布注入到指定容器（容器应设置 pointer-events:none，以便鼠标穿透）
  - 简单粒子：圆点带连线、渐隐、响应窗口尺寸
  - API: Particleify.init(containerElement, options)
  - 默认不依赖鼠标（因为 container pointer-events:none），如需启用交互，可在 options.mouseInteractive = true 并移除容器 pointer-events:none
*/
(function(global){
  function Particleify(){
    this.canvas = null;
    this.ctx = null;
    this.w = 0; this.h = 0;
    this.particles = [];
    this.opts = {};
    this.raf = null;
    this.mouse = {x:null,y:null};
  }

  Particleify.prototype._resize = function(){
    this.w = this.canvas.width = window.innerWidth;
    this.h = this.canvas.height = window.innerHeight;
  };

  Particleify.prototype._rand = function(min,max){ return Math.random() * (max - min) + min; };

  Particleify.prototype._createParticles = function(n){
    this.particles = [];
    for(let i=0;i<n;i++){
      this.particles.push({
        x: this._rand(0,this.w),
        y: this._rand(0,this.h),
        vx: this._rand(-0.3,0.3),
        vy: this._rand(-0.3,0.3),
        r: this._rand(0.8,2.2),
        alpha: this._rand(0.3,0.9)
      });
    }
  };

  Particleify.prototype._step = function(){
    const ctx = this.ctx;
    ctx.clearRect(0,0,this.w,this.h);
    // 背景透明，粒子颜色可配置
    const color = this.opts.color || '200,220,255';
    // 更新与绘制
    for(let p of this.particles){
      p.x += p.vx;
      p.y += p.vy;
      if(p.x < -10) p.x = this.w + 10;
      if(p.x > this.w + 10) p.x = -10;
      if(p.y < -10) p.y = this.h + 10;
      if(p.y > this.h + 10) p.y = -10;

      ctx.beginPath();
      ctx.fillStyle = `rgba(${color},${p.alpha})`;
      ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fill();
    }

    // 连线（简单 O(n^2) 层级，粒子数限制为低值保证性能）
    const maxDist = this.opts.linkDistance || 120;
    for(let i=0;i<this.particles.length;i++){
      for(let j=i+1;j<this.particles.length;j++){
        const a = this.particles[i], b = this.particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx*dx + dy*dy;
        if(d2 < maxDist*maxDist){
          const alpha = Math.max(0, 0.6 - (d2 / (maxDist*maxDist)));
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${color},${alpha * 0.8})`;
          ctx.lineWidth = 1;
          ctx.moveTo(a.x,a.y);
          ctx.lineTo(b.x,b.y);
          ctx.stroke();
        }
      }
    }

    // 鼠标吸引（仅在开启且容器可接收事件时有效）
    if(this.opts.mouseInteractive && this.mouse.x !== null && this.mouse.y !== null){
      for(let p of this.particles){
        const dx = p.x - this.mouse.x, dy = p.y - this.mouse.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if(dist < 120){
          const force = (120 - dist) / 220;
          p.vx += (dx/dist) * force * 0.02;
          p.vy += (dy/dist) * force * 0.02;
        }
      }
    }

    // 轻微风阻
    for(let p of this.particles){
      p.vx *= 0.995;
      p.vy *= 0.995;
    }

    // 循环
    this.raf = window.requestAnimationFrame(this._step.bind(this));
  };

  Particleify.prototype.init = function(container, options){
    if(!container) throw new Error('Particleify: 需要传入容器元素');
    this.opts = Object.assign({
      count: 60,
      color: '200,220,255',
      linkDistance: 120,
      mouseInteractive: false
    }, options || {});

    // 清理旧画布
    const existing = container.querySelector('canvas.particleify-canvas');
    if(existing) existing.remove();

    const canvas = document.createElement('canvas');
    canvas.className = 'particleify-canvas';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    canvas.style.opacity = (this.opts.opacity!=null)?this.opts.opacity:1;
    // 注意：容器通常设置 pointer-events:none；若需要交互请自行调整容器样式
    canvas.style.pointerEvents = 'none';
    container.appendChild(canvas);

    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this._resize();
    window.addEventListener('resize', this._resize.bind(this));

    this._createParticles(this.opts.count);

    if(this.opts.mouseInteractive){
      // 仅在允许交互时绑定鼠标事件（调用者需移除容器 pointer-events:none）
      container.addEventListener('mousemove', (e)=>{
        const rect = container.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
      });
      container.addEventListener('mouseleave', ()=>{this.mouse.x = null; this.mouse.y = null});
    }

    // 启动动画
    if(this.raf) window.cancelAnimationFrame(this.raf);
    this._step();
    return this;
  };

  Particleify.prototype.destroy = function(){
    if(this.raf) window.cancelAnimationFrame(this.raf);
    if(this.canvas && this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);
    window.removeEventListener('resize', this._resize);
  };

  // 导出单例工厂
  global.Particleify = new Particleify();
})(window);
