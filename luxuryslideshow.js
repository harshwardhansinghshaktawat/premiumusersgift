// luxury-slideshow-ripple.js
class LuxurySlideshow extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.settings = this.getDefaultSettings();
    this.currentSlide = 0;
    this.isTransitioning = false;
    this.autoplayInterval = null;
    this.gl = null;
    this.glUniforms = null;
    this.rippleState = {
      active: false,
      x: 0.5,
      y: 0.5,
      progress: 0
    };
  }

  static get observedAttributes() {
    return ['data'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'data' && newValue && newValue !== oldValue) {
      try {
        this.settings = { ...this.getDefaultSettings(), ...JSON.parse(newValue) };
        console.log('Slideshow data updated:', this.settings);
        this.render();
        this.initSlideshow();
      } catch (e) {
        console.error('Failed to parse data:', e);
      }
    }
  }

  connectedCallback() {
    this.render();
    setTimeout(() => this.initSlideshow(), 0);
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
      slide1Description: 'Experience unparalleled elegance in the heart of paradise. Where every moment becomes a cherished memory, and comfort meets sophistication.',
      slide1Image: 'https://picsum.photos/1920/1080?random=1',
      slide2Title: 'Breathtaking Views',
      slide2Description: 'Wake up to panoramic vistas that inspire wonder. Our rooms offer front-row seats to nature's most spectacular performances.',
      slide2Image: 'https://picsum.photos/1920/1080?random=2',
      slide3Title: 'Culinary Excellence',
      slide3Description: 'Indulge in world-class dining experiences crafted by renowned chefs. Every dish tells a story of passion and perfection.',
      slide3Image: 'https://picsum.photos/1920/1080?random=3',
      slide4Title: 'Serene Sanctuary',
      slide4Description: 'Discover your personal oasis of tranquility. Where modern amenities blend seamlessly with timeless hospitality.',
      slide4Image: 'https://picsum.photos/1920/1080?random=4',
      slide5Title: 'World-Class Spa',
      slide5Description: 'Rejuvenate your mind, body, and soul with our exclusive wellness treatments and therapeutic experiences.',
      slide5Image: 'https://picsum.photos/1920/1080?random=5',
      slide6Title: 'Premium Suites',
      slide6Description: 'Immerse yourself in opulence with our meticulously designed suites featuring bespoke furnishings and cutting-edge technology.',
      slide6Image: 'https://picsum.photos/1920/1080?random=6',
      slide7Title: 'Infinity Pool Paradise',
      slide7Description: 'Float above the world in our stunning rooftop infinity pool, offering uninterrupted views of the skyline.',
      slide7Image: 'https://picsum.photos/1920/1080?random=7',
      slide8Title: 'Grand Ballroom',
      slide8Description: 'Host unforgettable events in our magnificent ballroom, where elegance meets state-of-the-art facilities.',
      slide8Image: 'https://picsum.photos/1920/1080?random=8',
      slide9Title: 'Private Beach Access',
      slide9Description: 'Step directly onto pristine white sands from your suite and embrace the exclusive beachfront lifestyle.',
      slide9Image: 'https://picsum.photos/1920/1080?random=9',
      slide10Title: 'Concierge Excellence',
      slide10Description: 'Our dedicated team anticipates your every need, ensuring a seamless and personalized luxury experience.',
      slide10Image: 'https://picsum.photos/1920/1080?random=10'
    };
  }

  render() {
    const s = this.settings;
    const slideCount = Math.min(Math.max(1, parseInt(s.slideCount) || 4), 10);

    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600;700&family=Montserrat:wght@300;400;500&family=Playfair+Display:wght@400;600;700&family=Lato:wght@300;400;700&family=Roboto:wght@300;400;500&display=swap">
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
          overflow: hidden;
          background: #0a0a0a;
        }

        .slideshow-container {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        #ripple-canvas {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 2;
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
          transition: opacity ${s.animationSpeed / 1000}s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 0;
        }

        .slide.active {
          opacity: 1;
          z-index: 1;
        }

        .slide-bg {
          width: 100%;
          height: 100%;
          background-size: cover;
          background-position: center;
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
            ${this.hexToRgba(s.primaryColor, 0.85)} 0%, 
            ${this.hexToRgba(s.primaryColor, 0.4)} 50%, 
            ${this.hexToRgba(s.primaryColor, 0.75)} 100%);
          z-index: 1;
        }

        .content-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 3;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 0 8%;
          pointer-events: none;
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
          font-size: clamp(3rem, 8vw, 7rem);
          font-weight: 700;
          color: ${s.textColor};
          margin-bottom: 1.5rem;
          line-height: 1.1;
          letter-spacing: -0.02em;
          text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          font-family: ${s.titleFont}, serif;
        }

        .slide-content p {
          font-size: clamp(1rem, 1.5vw, 1.3rem);
          font-family: ${s.bodyFont}, sans-serif;
          font-weight: 300;
          color: ${this.adjustBrightness(s.textColor, -10)};
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
          background: ${this.hexToRgba(s.textColor, 0.1)};
          backdrop-filter: blur(10px);
          border: 1px solid ${this.hexToRgba(s.textColor, 0.2)};
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
          background: ${this.hexToRgba(s.textColor, 0.2)};
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
          background: ${this.hexToRgba(s.textColor, 0.3)};
          border: none;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .indicator:hover {
          background: ${this.hexToRgba(s.textColor, 0.5)};
        }

        .indicator.active {
          width: 40px;
          background: linear-gradient(135deg, ${s.accentColor}, ${this.adjustBrightness(s.accentColor, 20)});
          box-shadow: 0 0 20px ${this.hexToRgba(s.accentColor, 0.6)};
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
          background: ${this.hexToRgba(s.textColor, 0.5)};
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
          background: ${this.hexToRgba(s.textColor, 0.1)};
          z-index: 10;
        }

        .progress-bar {
          height: 100%;
          width: 0;
          background: linear-gradient(90deg, 
            ${s.accentColor}, 
            ${this.adjustBrightness(s.accentColor, 20)}, 
            ${s.accentColor});
          transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 0 20px ${this.hexToRgba(s.accentColor, 0.8)};
          position: relative;
          overflow: hidden;
        }

        .progress-shimmer {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
          animation: shimmer 2s infinite;
        }

        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }

        @media (max-width: 768px) {
          .nav-btn {
            width: 50px;
            height: 50px;
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
          }

          .indicators {
            bottom: 40px;
          }

          .slide-content h2 {
            font-size: clamp(2rem, 6vw, 4rem);
          }

          .slide-content p {
            font-size: clamp(0.9rem, 1.2vw, 1.1rem);
          }
        }
      </style>
      <div class="slideshow-container">
        <canvas id="ripple-canvas"></canvas>

        ${Array.from({ length: slideCount }, (_, i) => `
          <div class="slide ${i === 0 ? 'active' : ''}">
            <div class="slide-bg" style="background-image: url('${s[`slide${i + 1}Image`] || 'https://picsum.photos/1920/1080?random=' + (i + 1)}');"></div>
            <div class="slide-overlay"></div>
            <div class="content-overlay">
              <div class="slide-content">
                <h2>${s[`slide${i + 1}Title`] || 'Slide Title ' + (i + 1)}</h2>
                <p>${s[`slide${i + 1}Description`] || 'Slide description goes here.'}</p>
              </div>
            </div>
          </div>
        `).join('')}

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

        <div class="indicators">
          ${Array.from({ length: slideCount }, (_, i) => `
            <button class="indicator ${i === 0 ? 'active' : ''}" data-index="${i}"></button>
          `).join('')}
        </div>

        <div class="slide-number">
          <span class="current">01</span>
          <div class="divider"></div>
          <span class="total">${String(slideCount).padStart(2, '0')}</span>
        </div>

        <div class="progress-container">
          <div class="progress-bar">
            <div class="progress-shimmer"></div>
          </div>
        </div>
      </div>
    `;
  }

  initSlideshow() {
    const slideCount = Math.min(Math.max(1, parseInt(this.settings.slideCount) || 4), 10);
    this.currentSlide = 0;
    this.stopAutoplay();

    const prevBtn = this.shadowRoot.querySelector('.prev');
    const nextBtn = this.shadowRoot.querySelector('.next');
    const indicators = this.shadowRoot.querySelectorAll('.indicator');

    if (prevBtn) {
      prevBtn.replaceWith(prevBtn.cloneNode(true));
      this.shadowRoot.querySelector('.prev').addEventListener('click', () => this.changeSlide(-1));
    }

    if (nextBtn) {
      nextBtn.replaceWith(nextBtn.cloneNode(true));
      this.shadowRoot.querySelector('.next').addEventListener('click', () => this.changeSlide(1));
    }

    indicators.forEach((indicator) => {
      indicator.addEventListener('click', () => {
        const index = parseInt(indicator.getAttribute('data-index'));
        this.goToSlide(index);
      });
    });

    this.initWebGL();
    this.startAutoplay();
    this.updateSlideshow();
  }

  initWebGL() {
    const canvas = this.shadowRoot.getElementById('ripple-canvas');
    if (!canvas) return;

    this.gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
    if (!this.gl) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

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
        
        float ripple = sin((dist - rippleProgress * 1.5) * 20.0) * 0.5 + 0.5;
        ripple *= smoothstep(1.0, 0.0, abs(dist - rippleProgress * 1.2) * 3.0);
        ripple *= smoothstep(0.0, 0.3, rippleProgress);
        
        vec3 color1 = vec3(0.04, 0.1, 0.18);
        vec3 color2 = vec3(0.83, 0.69, 0.22);
        vec3 color = mix(color1, color2, ripple * 0.3);
        
        float alpha = ripple * 0.5 * (1.0 - rippleProgress);
        
        gl_FragColor = vec4(color, alpha);
      }
    `;

    const createShader = (type, source) => {
      const shader = this.gl.createShader(type);
      this.gl.shaderSource(shader, source);
      this.gl.compileShader(shader);
      return shader;
    };

    const vertexShader = createShader(this.gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);

    const program = this.gl.createProgram();
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);
    this.gl.useProgram(program);

    const positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 1, -1, -1, 1, 1, 1
    ]), this.gl.STATIC_DRAW);

    const positionLocation = this.gl.getAttribLocation(program, 'position');
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);

    this.glUniforms = {
      time: this.gl.getUniformLocation(program, 'time'),
      rippleCenter: this.gl.getUniformLocation(program, 'rippleCenter'),
      rippleProgress: this.gl.getUniformLocation(program, 'rippleProgress')
    };

    this.animate();
  }

  animate(time = 0) {
    if (!this.gl || !this.glUniforms) return;

    const canvas = this.shadowRoot.getElementById('ripple-canvas');
    if (!canvas) return;

    if (this.rippleState.active) {
      this.rippleState.progress = Math.min(this.rippleState.progress + 0.015, 1);

      this.gl.viewport(0, 0, canvas.width, canvas.height);
      this.gl.clearColor(0, 0, 0, 0);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);

      this.gl.uniform1f(this.glUniforms.time, time * 0.001);
      this.gl.uniform2f(this.glUniforms.rippleCenter, this.rippleState.x, 1 - this.rippleState.y);
      this.gl.uniform1f(this.glUniforms.rippleProgress, this.rippleState.progress);

      this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

      if (this.rippleState.progress >= 1) {
        this.rippleState.active = false;
        this.rippleState.progress = 0;
        canvas.classList.remove('active');
      }
    }

    requestAnimationFrame((t) => this.animate(t));
  }

  changeSlide(direction) {
    if (this.isTransitioning) return;

    const slideCount = Math.min(Math.max(1, parseInt(this.settings.slideCount) || 4), 10);
    const newSlide = (this.currentSlide + direction + slideCount) % slideCount;

    if (newSlide === this.currentSlide) return;

    this.isTransitioning = true;

    this.rippleState = {
      active: true,
      x: 0.5,
      y: 0.5,
      progress: 0
    };
    const canvas = this.shadowRoot.getElementById('ripple-canvas');
    if (canvas) canvas.classList.add('active');

    setTimeout(() => {
      this.currentSlide = newSlide;
      this.updateSlideshow();
      this.isTransitioning = false;
    }, this.settings.animationSpeed || 1200);

    this.resetAutoplay();
  }

  goToSlide(index) {
    if (this.isTransitioning || index === this.currentSlide) return;

    this.isTransitioning = true;

    this.rippleState = {
      active: true,
      x: 0.5,
      y: 0.5,
      progress: 0
    };
    const canvas = this.shadowRoot.getElementById('ripple-canvas');
    if (canvas) canvas.classList.add('active');

    setTimeout(() => {
      this.currentSlide = index;
      this.updateSlideshow();
      this.isTransitioning = false;
    }, this.settings.animationSpeed || 1200);

    this.resetAutoplay();
  }

  updateSlideshow() {
    const slides = this.shadowRoot.querySelectorAll('.slide');
    const indicators = this.shadowRoot.querySelectorAll('.indicator');
    const progressBar = this.shadowRoot.querySelector('.progress-bar');
    const slideNumber = this.shadowRoot.querySelector('.slide-number .current');
    const slideCount = Math.min(Math.max(1, parseInt(this.settings.slideCount) || 4), 10);

    slides.forEach((slide, index) => {
      slide.classList.toggle('active', index === this.currentSlide);
    });

    indicators.forEach((indicator, index) => {
      indicator.classList.toggle('active', index === this.currentSlide);
    });

    if (progressBar) {
      const progress = ((this.currentSlide + 1) / slideCount) * 100;
      progressBar.style.width = progress + '%';
    }

    if (slideNumber) {
      slideNumber.textContent = String(this.currentSlide + 1).padStart(2, '0');
    }
  }

  startAutoplay() {
    this.stopAutoplay();
    this.autoplayInterval = setInterval(() => {
      this.changeSlide(1);
    }, this.settings.autoplayDelay || 6000);
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

  disconnectedCallback() {
    this.stopAutoplay();
  }

  hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  adjustBrightness(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, Math.max(0, (num >> 16) + amt));
    const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt));
    const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
    return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
  }
}

customElements.define('luxury-slideshow-ripple', LuxurySlideshow);
