// luxury-slideshow-ripple.js
class LuxurySlideshow extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.currentSlide = 0;
    this.isTransitioning = false;
    this.autoplayInterval = null;
    this.settings = this.getDefaultSettings();
    this.gl = null;
    this.glProgram = null;
    this.glUniforms = null;
    this.animationFrameId = null;
    this.rippleState = {
      active: false,
      progress: 0,
      centerX: 0.5,
      centerY: 0.5
    };
  }

  static get observedAttributes() {
    return ['data'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'data' && newValue) {
      try {
        const parsed = JSON.parse(newValue);
        this.settings = { ...this.getDefaultSettings(), ...parsed };
        console.log('Custom element received settings:', this.settings);
        this.render();
        this.init();
      } catch (e) {
        console.error('Failed to parse slideshow data:', e);
        this.render();
        this.init();
      }
    }
  }

  connectedCallback() {
    console.log('Luxury slideshow connected');
    this.render();
    this.init();
  }

  disconnectedCallback() {
    this.cleanup();
  }

  getDefaultSettings() {
    return {
      primaryColor: '#0a192f',
      accentColor: '#d4af37',
      textColor: '#f8f6f1',
      titleFont: 'Cormorant Garamond',
      bodyFont: 'Montserrat',
      animationSpeed: 1200,
      autoplayDelay: 6000,
      slideCount: 4,
      slide1Title: 'Luxury Redefined',
      slide1Description: 'Experience unparalleled elegance in the heart of paradise.',
      slide1Image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&h=1080&fit=crop',
      slide2Title: 'Breathtaking Views',
      slide2Description: 'Wake up to panoramic vistas that inspire wonder.',
      slide2Image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1920&h=1080&fit=crop',
      slide3Title: 'Culinary Excellence',
      slide3Description: 'Indulge in world-class dining experiences.',
      slide3Image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1920&h=1080&fit=crop',
      slide4Title: 'Serene Sanctuary',
      slide4Description: 'Discover your personal oasis of tranquility.',
      slide4Image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1920&h=1080&fit=crop',
      slide5Title: 'World-Class Spa',
      slide5Description: 'Rejuvenate your mind, body, and soul.',
      slide5Image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1920&h=1080&fit=crop',
      slide6Title: 'Premium Suites',
      slide6Description: 'Immerse yourself in opulence.',
      slide6Image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1920&h=1080&fit=crop',
      slide7Title: 'Infinity Pool Paradise',
      slide7Description: 'Float above the world.',
      slide7Image: 'https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=1920&h=1080&fit=crop',
      slide8Title: 'Grand Ballroom',
      slide8Description: 'Host unforgettable events.',
      slide8Image: 'https://images.unsplash.com/photo-1519167758481-83f29da8c4c0?w=1920&h=1080&fit=crop',
      slide9Title: 'Private Beach Access',
      slide9Description: 'Step directly onto pristine white sands.',
      slide9Image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1920&h=1080&fit=crop',
      slide10Title: 'Concierge Excellence',
      slide10Description: 'Our dedicated team anticipates your every need.',
      slide10Image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1920&h=1080&fit=crop'
    };
  }

  render() {
    const s = this.settings;
    const slideCount = Math.min(Math.max(1, parseInt(s.slideCount) || 4), 10);

    const styles = `
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        :host {
          display: block;
          width: 100%;
          height: 100%;
          min-height: 600px;
          font-family: ${s.bodyFont}, sans-serif;
        }

        .slideshow-container {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 600px;
          overflow: hidden;
          background: #0a0a0a;
        }

        #ripple-canvas {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 5;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        #ripple-canvas.active {
          opacity: 1;
        }

        .slide {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          visibility: hidden;
          transition: opacity ${s.animationSpeed}ms ease-in-out;
        }

        .slide.active {
          opacity: 1;
          visibility: visible;
          z-index: 2;
        }

        .slide-bg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          transform: scale(1.1);
          transition: transform 8s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .slide.active .slide-bg {
          transform: scale(1);
        }

        .slide-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, 
            rgba(10, 25, 47, 0.85) 0%, 
            rgba(10, 25, 47, 0.4) 50%, 
            rgba(10, 25, 47, 0.75) 100%);
          z-index: 1;
        }

        .content-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 2;
          display: flex;
          align-items: center;
          padding: 0 140px;
        }

        .slide-content {
          max-width: 800px;
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.3s;
        }

        .slide.active .slide-content {
          opacity: 1;
          transform: translateY(0);
        }

        .slide-content h2 {
          font-family: ${s.titleFont}, serif;
          font-size: clamp(2rem, 5vw, 5rem);
          font-weight: 700;
          color: ${s.textColor};
          margin-bottom: 1.5rem;
          line-height: 1.1;
          letter-spacing: -0.02em;
          text-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        }

        .slide-content p {
          font-family: ${s.bodyFont}, sans-serif;
          font-size: clamp(0.9rem, 1.2vw, 1.3rem);
          font-weight: 300;
          color: #e8e6e0;
          line-height: 1.8;
          max-width: 600px;
          letter-spacing: 0.02em;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
        }

        .nav-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 10;
          background: rgba(248, 246, 241, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(248, 246, 241, 0.2);
          border-radius: 50%;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          color: ${s.textColor};
        }

        .nav-btn:hover {
          background: rgba(248, 246, 241, 0.2);
          transform: translateY(-50%) scale(1.1);
        }

        .nav-btn.prev {
          left: 40px;
        }

        .nav-btn.next {
          right: 40px;
        }

        .nav-btn svg {
          width: 28px;
          height: 28px;
        }

        .indicators {
          position: absolute;
          bottom: 60px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .indicator {
          width: 12px;
          height: 12px;
          border-radius: 6px;
          background: rgba(248, 246, 241, 0.3);
          border: none;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          padding: 0;
        }

        .indicator:hover {
          background: rgba(248, 246, 241, 0.5);
        }

        .indicator.active {
          width: 40px;
          background: linear-gradient(135deg, ${s.accentColor}, #f4e4b0);
          box-shadow: 0 0 20px rgba(212, 175, 55, 0.6);
        }

        .slide-number {
          position: absolute;
          top: 50px;
          right: 60px;
          z-index: 10;
          font-family: ${s.bodyFont}, sans-serif;
          font-size: 1rem;
          font-weight: 300;
          color: ${s.textColor};
          letter-spacing: 0.2em;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .slide-number .current {
          font-size: 2.5rem;
          font-weight: 300;
          font-family: ${s.titleFont}, serif;
        }

        .slide-number .divider {
          width: 30px;
          height: 1px;
          background: rgba(248, 246, 241, 0.5);
        }

        .slide-number .total {
          opacity: 0.6;
        }

        .progress-container {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 3px;
          background: rgba(248, 246, 241, 0.1);
          z-index: 10;
        }

        .progress-bar {
          height: 100%;
          width: 25%;
          background: linear-gradient(90deg, ${s.accentColor}, #f4e4b0, ${s.accentColor});
          transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 0 20px rgba(212, 175, 55, 0.8);
        }

        /* Tablet Landscape */
        @media (max-width: 1024px) {
          .content-overlay {
            padding: 0 100px;
          }

          .slide-content h2 {
            font-size: clamp(2rem, 5vw, 4rem);
          }

          .nav-btn.prev {
            left: 30px;
          }

          .nav-btn.next {
            right: 30px;
          }

          .slide-number {
            top: 40px;
            right: 40px;
          }
        }

        /* Tablet Portrait */
        @media (max-width: 768px) {
          .content-overlay {
            padding: 80px 80px 120px 80px;
            align-items: flex-start;
          }

          .slide-content {
            margin-top: 60px;
          }

          .slide-content h2 {
            font-size: clamp(1.8rem, 6vw, 3rem);
            margin-bottom: 1rem;
          }

          .slide-content p {
            font-size: clamp(0.85rem, 1.2vw, 1.1rem);
          }

          .nav-btn {
            width: 50px;
            height: 50px;
          }

          .nav-btn svg {
            width: 24px;
            height: 24px;
          }

          .nav-btn.prev {
            left: 20px;
          }

          .nav-btn.next {
            right: 20px;
          }

          .slide-number {
            top: 30px;
            right: 30px;
            font-size: 0.9rem;
          }

          .slide-number .current {
            font-size: 2rem;
          }

          .slide-number .divider {
            width: 20px;
          }

          .indicators {
            bottom: 50px;
            gap: 10px;
          }

          .indicator {
            width: 10px;
            height: 10px;
          }

          .indicator.active {
            width: 30px;
          }
        }

        /* Mobile Landscape */
        @media (max-width: 640px) and (orientation: landscape) {
          .slideshow-container {
            min-height: 500px;
          }

          .content-overlay {
            padding: 60px 90px 100px 90px;
          }

          .slide-content {
            margin-top: 20px;
          }

          .slide-content h2 {
            font-size: clamp(1.5rem, 5vw, 2.5rem);
            margin-bottom: 0.8rem;
          }

          .slide-content p {
            font-size: clamp(0.8rem, 1vw, 1rem);
            line-height: 1.6;
          }

          .indicators {
            bottom: 30px;
          }
        }

        /* Mobile Portrait */
        @media (max-width: 480px) {
          .slideshow-container {
            min-height: 600px;
          }

          .content-overlay {
            padding: 100px 20px 140px 20px;
            align-items: flex-start;
          }

          .slide-content {
            margin-top: 40px;
            max-width: 100%;
          }

          .slide-content h2 {
            font-size: clamp(1.8rem, 8vw, 2.5rem);
            margin-bottom: 1rem;
          }

          .slide-content p {
            font-size: clamp(0.9rem, 3vw, 1.1rem);
            line-height: 1.7;
            max-width: 100%;
          }

          .nav-btn {
            width: 45px;
            height: 45px;
            background: rgba(248, 246, 241, 0.15);
          }

          .nav-btn svg {
            width: 20px;
            height: 20px;
          }

          .nav-btn.prev {
            left: 15px;
          }

          .nav-btn.next {
            right: 15px;
          }

          .slide-number {
            top: 20px;
            right: 20px;
            font-size: 0.75rem;
            gap: 8px;
          }

          .slide-number .current {
            font-size: 1.8rem;
          }

          .slide-number .divider {
            width: 15px;
          }

          .indicators {
            bottom: 40px;
            gap: 8px;
          }

          .indicator {
            width: 8px;
            height: 8px;
          }

          .indicator.active {
            width: 24px;
          }

          .progress-container {
            height: 2px;
          }
        }

        /* Extra Small Devices */
        @media (max-width: 360px) {
          .content-overlay {
            padding: 90px 15px 130px 15px;
          }

          .slide-content h2 {
            font-size: clamp(1.5rem, 8vw, 2rem);
          }

          .slide-content p {
            font-size: clamp(0.85rem, 3vw, 1rem);
          }

          .nav-btn {
            width: 40px;
            height: 40px;
          }

          .nav-btn.prev {
            left: 10px;
          }

          .nav-btn.next {
            right: 10px;
          }

          .slide-number {
            top: 15px;
            right: 15px;
          }

          .slide-number .current {
            font-size: 1.5rem;
          }
        }
      </style>
    `;

    const slides = Array.from({ length: slideCount }, (_, i) => {
      const num = i + 1;
      const title = s[`slide${num}Title`] || `Slide ${num}`;
      const desc = s[`slide${num}Description`] || 'Description';
      const img = s[`slide${num}Image`] || `https://images.unsplash.com/photo-156607377125${num}?w=1920&h=1080&fit=crop`;
      
      return `
        <div class="slide ${i === 0 ? 'active' : ''}" data-index="${i}">
          <div class="slide-bg" style="background-image: url('${img}');"></div>
          <div class="slide-overlay"></div>
          <div class="content-overlay">
            <div class="slide-content">
              <h2>${title}</h2>
              <p>${desc}</p>
            </div>
          </div>
        </div>
      `;
    }).join('');

    const indicators = Array.from({ length: slideCount }, (_, i) => 
      `<button class="indicator ${i === 0 ? 'active' : ''}" data-index="${i}"></button>`
    ).join('');

    this.shadowRoot.innerHTML = `
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600;700&family=Montserrat:wght@300;400;500&family=Playfair+Display:wght@400;600;700&family=Lato:wght@300;400;700&family=Roboto:wght@300;400;500&display=swap" rel="stylesheet">
      ${styles}
      <div class="slideshow-container">
        <canvas id="ripple-canvas"></canvas>
        
        ${slides}
        
        <button class="nav-btn prev">
          <svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>

        <button class="nav-btn next">
          <svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>

        <div class="indicators">${indicators}</div>

        <div class="slide-number">
          <span class="current">01</span>
          <div class="divider"></div>
          <span class="total">${String(slideCount).padStart(2, '0')}</span>
        </div>

        <div class="progress-container">
          <div class="progress-bar"></div>
        </div>
      </div>
    `;
  }

  init() {
    this.cleanup();
    this.currentSlide = 0;

    const prev = this.shadowRoot.querySelector('.prev');
    const next = this.shadowRoot.querySelector('.next');
    const indicators = this.shadowRoot.querySelectorAll('.indicator');

    if (prev) {
      prev.addEventListener('click', () => this.changeSlide(-1));
    }

    if (next) {
      next.addEventListener('click', () => this.changeSlide(1));
    }

    indicators.forEach(ind => {
      ind.addEventListener('click', () => {
        const index = parseInt(ind.dataset.index);
        this.goToSlide(index);
      });
    });

    this.initWebGL();
    this.updateDisplay();
    this.startAutoplay();
  }

  initWebGL() {
    try {
      const canvas = this.shadowRoot.getElementById('ripple-canvas');
      if (!canvas) return;

      const container = this.shadowRoot.querySelector('.slideshow-container');
      if (!container) return;

      canvas.width = container.offsetWidth || 800;
      canvas.height = container.offsetHeight || 600;

      this.gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
      if (!this.gl) {
        console.log('WebGL not supported, continuing without ripple effect');
        return;
      }

      const vertexShaderSource = `
        attribute vec2 position;
        varying vec2 vUv;
        void main() {
          vUv = position * 0.5 + 0.5;
          gl_Position = vec4(position, 0.0, 1.0);
        }
      `;

      const fragmentShaderSource = `
        precision mediump float;
        varying vec2 vUv;
        uniform float time;
        uniform vec2 rippleCenter;
        uniform float rippleProgress;
        
        void main() {
          vec2 uv = vUv;
          float dist = distance(uv, rippleCenter);
          
          float ripple1 = sin((dist - rippleProgress * 1.5) * 15.0);
          float ripple2 = sin((dist - rippleProgress * 1.2) * 20.0);
          float ripple = (ripple1 + ripple2) * 0.5;
          
          ripple *= smoothstep(1.0, 0.0, abs(dist - rippleProgress * 1.2) * 2.5);
          ripple *= smoothstep(0.0, 0.2, rippleProgress);
          ripple *= smoothstep(1.0, 0.8, rippleProgress);
          
          vec3 color1 = vec3(0.04, 0.1, 0.18);
          vec3 color2 = vec3(0.83, 0.69, 0.22);
          vec3 color = mix(color1, color2, ripple * 0.5 + 0.5);
          
          float alpha = abs(ripple) * 0.6 * (1.0 - rippleProgress * 0.8);
          
          gl_FragColor = vec4(color, alpha);
        }
      `;

      const createShader = (type, source) => {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
          console.error('Shader compilation error:', this.gl.getShaderInfoLog(shader));
          this.gl.deleteShader(shader);
          return null;
        }
        return shader;
      };

      const vertexShader = createShader(this.gl.VERTEX_SHADER, vertexShaderSource);
      const fragmentShader = createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);

      if (!vertexShader || !fragmentShader) return;

      this.glProgram = this.gl.createProgram();
      this.gl.attachShader(this.glProgram, vertexShader);
      this.gl.attachShader(this.glProgram, fragmentShader);
      this.gl.linkProgram(this.glProgram);

      if (!this.gl.getProgramParameter(this.glProgram, this.gl.LINK_STATUS)) {
        console.error('Program linking error:', this.gl.getProgramInfoLog(this.glProgram));
        return;
      }

      this.gl.useProgram(this.glProgram);

      const positionBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
         1,  1
      ]), this.gl.STATIC_DRAW);

      const positionLocation = this.gl.getAttribLocation(this.glProgram, 'position');
      this.gl.enableVertexAttribArray(positionLocation);
      this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);

      this.glUniforms = {
        time: this.gl.getUniformLocation(this.glProgram, 'time'),
        rippleCenter: this.gl.getUniformLocation(this.glProgram, 'rippleCenter'),
        rippleProgress: this.gl.getUniformLocation(this.glProgram, 'rippleProgress')
      };

      this.gl.enable(this.gl.BLEND);
      this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

      this.animateRipple();

    } catch (error) {
      console.error('WebGL initialization error:', error);
    }
  }

  animateRipple(time = 0) {
    if (!this.gl || !this.glUniforms || !this.glProgram) return;

    const canvas = this.shadowRoot.getElementById('ripple-canvas');
    if (!canvas) return;

    if (this.rippleState.active) {
      this.rippleState.progress = Math.min(this.rippleState.progress + 0.012, 1);

      this.gl.viewport(0, 0, canvas.width, canvas.height);
      this.gl.clearColor(0, 0, 0, 0);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);

      this.gl.useProgram(this.glProgram);
      this.gl.uniform1f(this.glUniforms.time, time * 0.001);
      this.gl.uniform2f(this.glUniforms.rippleCenter, this.rippleState.centerX, 1 - this.rippleState.centerY);
      this.gl.uniform1f(this.glUniforms.rippleProgress, this.rippleState.progress);

      this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

      if (this.rippleState.progress >= 1) {
        this.rippleState.active = false;
        this.rippleState.progress = 0;
        canvas.classList.remove('active');
      }
    }

    this.animationFrameId = requestAnimationFrame((t) => this.animateRipple(t));
  }

  triggerRipple() {
    const canvas = this.shadowRoot.getElementById('ripple-canvas');
    if (!canvas) return;

    this.rippleState = {
      active: true,
      progress: 0,
      centerX: 0.5,
      centerY: 0.5
    };

    canvas.classList.add('active');
  }

  changeSlide(direction) {
    if (this.isTransitioning) return;
    
    const slideCount = Math.min(Math.max(1, parseInt(this.settings.slideCount) || 4), 10);
    this.currentSlide = (this.currentSlide + direction + slideCount) % slideCount;
    
    this.isTransitioning = true;
    this.triggerRipple();
    this.updateDisplay();
    
    setTimeout(() => {
      this.isTransitioning = false;
    }, this.settings.animationSpeed || 1200);
    
    this.resetAutoplay();
  }

  goToSlide(index) {
    if (this.isTransitioning || index === this.currentSlide) return;
    
    this.currentSlide = index;
    this.isTransitioning = true;
    this.triggerRipple();
    this.updateDisplay();
    
    setTimeout(() => {
      this.isTransitioning = false;
    }, this.settings.animationSpeed || 1200);
    
    this.resetAutoplay();
  }

  updateDisplay() {
    const slides = this.shadowRoot.querySelectorAll('.slide');
    const indicators = this.shadowRoot.querySelectorAll('.indicator');
    const progressBar = this.shadowRoot.querySelector('.progress-bar');
    const currentNum = this.shadowRoot.querySelector('.slide-number .current');
    const slideCount = Math.min(Math.max(1, parseInt(this.settings.slideCount) || 4), 10);

    slides.forEach((slide, i) => {
      if (i === this.currentSlide) {
        slide.classList.add('active');
      } else {
        slide.classList.remove('active');
      }
    });

    indicators.forEach((ind, i) => {
      if (i === this.currentSlide) {
        ind.classList.add('active');
      } else {
        ind.classList.remove('active');
      }
    });

    if (progressBar) {
      const progress = ((this.currentSlide + 1) / slideCount) * 100;
      progressBar.style.width = `${progress}%`;
    }

    if (currentNum) {
      currentNum.textContent = String(this.currentSlide + 1).padStart(2, '0');
    }
  }

  startAutoplay() {
    this.stopAutoplay();
    const delay = this.settings.autoplayDelay || 6000;
    this.autoplayInterval = setInterval(() => {
      this.changeSlide(1);
    }, delay);
  }

  stopAutoplay() {
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
      this.autoplayInterval = null;
    }
  }

  resetAutoplay() {
    this.stopAutoplay();
    this.startAutoplay();
  }

  cleanup() {
    this.stopAutoplay();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}

customElements.define('luxury-slideshow-ripple', LuxurySlideshow);
