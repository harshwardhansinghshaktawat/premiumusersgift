// romantic-wedding-slideshow.js
class RomanticWeddingSlideshow extends HTMLElement {
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
    this.heartState = {
      active: false,
      progress: 0
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
        console.log('Wedding slideshow settings updated:', this.settings);
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
    console.log('Wedding slideshow connected');
    this.render();
    this.init();
  }

  disconnectedCallback() {
    this.cleanup();
  }

  getDefaultSettings() {
    return {
      primaryColor: '#fff5f5',
      accentColor: '#d4a5a5',
      roseGold: '#b76e79',
      textColor: '#5a4a4a',
      titleFont: 'Great Vibes',
      bodyFont: 'Cormorant Garamond',
      animationSpeed: 1200,
      autoplayDelay: 5000,
      slideCount: 6,
      coupleNames: 'Emily & James',
      weddingDate: 'June 15, 2025',
      slide1Title: 'Our Love Story Begins',
      slide1Description: 'From the moment we met, we knew this was something special. A journey of love, laughter, and endless memories.',
      slide1Image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&h=1080&fit=crop',
      slide2Title: 'The Proposal',
      slide2Description: 'Under the stars, with hearts full of joy, one question changed everything. She said yes!',
      slide2Image: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=1920&h=1080&fit=crop',
      slide3Title: 'Getting Ready',
      slide3Description: 'The excitement builds as we prepare for the most beautiful day of our lives.',
      slide3Image: 'https://images.unsplash.com/photo-1591604466107-ec97de608b88?w=1920&h=1080&fit=crop',
      slide4Title: 'The Ceremony',
      slide4Description: 'Surrounded by family and friends, we promise forever to each other.',
      slide4Image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1920&h=1080&fit=crop',
      slide5Title: 'Our First Dance',
      slide5Description: 'Dancing together as husband and wife, lost in each other\'s eyes.',
      slide5Image: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1920&h=1080&fit=crop',
      slide6Title: 'Forever Together',
      slide6Description: 'This is just the beginning of our beautiful journey together. Here\'s to a lifetime of love and happiness.',
      slide6Image: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1920&h=1080&fit=crop',
      slide7Title: 'Our Memories',
      slide7Description: 'Every moment together is a treasure we hold close to our hearts.',
      slide7Image: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=1920&h=1080&fit=crop',
      slide8Title: 'Family & Friends',
      slide8Description: 'Celebrating with the people who matter most in our lives.',
      slide8Image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1920&h=1080&fit=crop'
    };
  }

  render() {
    const s = this.settings;
    const slideCount = Math.min(Math.max(1, parseInt(s.slideCount) || 6), 8);

    const styles = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Dancing+Script:wght@400;600;700&display=swap');

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
          font-family: ${s.bodyFont}, serif;
          position: relative;
        }

        .slideshow-container {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 600px;
          overflow: hidden;
          background: linear-gradient(135deg, ${s.primaryColor} 0%, #fffafa 100%);
        }

        #hearts-canvas {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 5;
          opacity: 0;
          transition: opacity 0.5s ease;
        }

        #hearts-canvas.active {
          opacity: 1;
        }

        .slides-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 600px;
        }

        .slide {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          visibility: hidden;
          transition: opacity ${s.animationSpeed}ms ease-in-out,
                      visibility 0s ${s.animationSpeed}ms;
          z-index: 1;
        }

        .slide.active {
          opacity: 1;
          visibility: visible;
          transition: opacity ${s.animationSpeed}ms ease-in-out,
                      visibility 0s 0s;
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
          transform: scale(1.05);
          transition: transform 10s cubic-bezier(0.4, 0, 0.2, 1);
          filter: brightness(0.85);
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
            rgba(255, 245, 245, 0.75) 0%, 
            rgba(255, 250, 250, 0.5) 50%, 
            rgba(212, 165, 165, 0.6) 100%);
          z-index: 1;
        }

        .decorative-frame {
          position: absolute;
          top: 30px;
          left: 30px;
          right: 30px;
          bottom: 30px;
          border: 2px solid rgba(183, 110, 121, 0.3);
          pointer-events: none;
          z-index: 2;
        }

        .decorative-frame::before,
        .decorative-frame::after {
          content: '';
          position: absolute;
          width: 40px;
          height: 40px;
          border: 2px solid ${s.roseGold};
        }

        .decorative-frame::before {
          top: -2px;
          left: -2px;
          border-right: none;
          border-bottom: none;
        }

        .decorative-frame::after {
          bottom: -2px;
          right: -2px;
          border-left: none;
          border-top: none;
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
          align-items: center;
          padding: 100px 140px;
          text-align: center;
        }

        .couple-names {
          font-family: ${s.titleFont}, cursive;
          font-size: clamp(2.5rem, 5vw, 4.5rem);
          font-weight: 400;
          color: ${s.roseGold};
          margin-bottom: 15px;
          opacity: 0;
          transform: translateY(30px);
          transition: all 1s cubic-bezier(0.4, 0, 0.2, 1) 0.2s;
          text-shadow: 0 2px 20px rgba(183, 110, 121, 0.3);
        }

        .slide.active .couple-names {
          opacity: 1;
          transform: translateY(0);
        }

        .wedding-date {
          font-family: ${s.bodyFont}, serif;
          font-size: clamp(0.9rem, 1.2vw, 1.1rem);
          font-weight: 300;
          color: ${s.textColor};
          letter-spacing: 0.2em;
          text-transform: uppercase;
          margin-bottom: 40px;
          opacity: 0;
          transform: translateY(20px);
          transition: all 1s cubic-bezier(0.4, 0, 0.2, 1) 0.4s;
        }

        .slide.active .wedding-date {
          opacity: 1;
          transform: translateY(0);
        }

        .divider {
          width: 150px;
          height: 1px;
          background: linear-gradient(90deg, 
            transparent 0%, 
            ${s.roseGold} 50%, 
            transparent 100%);
          margin: 25px 0;
          position: relative;
          opacity: 0;
          transform: scaleX(0);
          transition: all 1s cubic-bezier(0.4, 0, 0.2, 1) 0.5s;
        }

        .slide.active .divider {
          opacity: 1;
          transform: scaleX(1);
        }

        .divider::before {
          content: '♥';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: ${s.roseGold};
          font-size: 12px;
          background: ${s.primaryColor};
          padding: 0 10px;
        }

        .slide-content {
          max-width: 700px;
          opacity: 0;
          transform: translateY(30px);
          transition: all 1s cubic-bezier(0.4, 0, 0.2, 1) 0.6s;
        }

        .slide.active .slide-content {
          opacity: 1;
          transform: translateY(0);
        }

        .slide-content h2 {
          font-family: ${s.titleFont}, cursive;
          font-size: clamp(2rem, 4vw, 3.5rem);
          font-weight: 400;
          color: ${s.textColor};
          margin-bottom: 20px;
          line-height: 1.2;
        }

        .slide-content p {
          font-family: ${s.bodyFont}, serif;
          font-size: clamp(1rem, 1.3vw, 1.2rem);
          font-weight: 300;
          font-style: italic;
          color: ${s.textColor};
          line-height: 1.8;
          opacity: 0.9;
        }

        .nav-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 10;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border: 2px solid ${s.accentColor};
          border-radius: 50%;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          color: ${s.roseGold};
          pointer-events: auto;
        }

        .nav-btn:hover {
          background: ${s.roseGold};
          color: white;
          transform: translateY(-50%) scale(1.1);
          border-color: ${s.roseGold};
          box-shadow: 0 8px 25px rgba(183, 110, 121, 0.3);
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
          pointer-events: auto;
        }

        .indicator {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: rgba(183, 110, 121, 0.3);
          border: none;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          padding: 0;
          position: relative;
        }

        .indicator::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 20px;
          height: 20px;
          border: 1px solid transparent;
          border-radius: 50%;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .indicator:hover {
          background: rgba(183, 110, 121, 0.6);
        }

        .indicator.active {
          background: ${s.roseGold};
          box-shadow: 0 0 15px rgba(183, 110, 121, 0.5);
        }

        .indicator.active::after {
          border-color: ${s.roseGold};
        }

        .slide-number {
          position: absolute;
          top: 50px;
          right: 60px;
          z-index: 10;
          font-family: ${s.bodyFont}, serif;
          font-size: 0.9rem;
          font-weight: 300;
          color: ${s.textColor};
          letter-spacing: 0.15em;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .slide-number .current {
          font-size: 2rem;
          font-family: ${s.titleFont}, cursive;
          color: ${s.roseGold};
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
          background: rgba(183, 110, 121, 0.1);
          z-index: 10;
        }

        .progress-bar {
          height: 100%;
          width: 16.66%;
          background: linear-gradient(90deg, 
            ${s.roseGold}, 
            ${s.accentColor}, 
            ${s.roseGold});
          transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 0 15px rgba(183, 110, 121, 0.5);
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .content-overlay {
            padding: 100px 100px;
          }

          .nav-btn.prev {
            left: 30px;
          }

          .nav-btn.next {
            right: 30px;
          }
        }

        @media (max-width: 768px) {
          .content-overlay {
            padding: 80px 60px 120px 60px;
          }

          .couple-names {
            font-size: clamp(2rem, 6vw, 3rem);
          }

          .slide-content h2 {
            font-size: clamp(1.8rem, 5vw, 2.5rem);
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
          }

          .decorative-frame {
            top: 20px;
            left: 20px;
            right: 20px;
            bottom: 20px;
          }

          .indicators {
            bottom: 50px;
          }
        }

        @media (max-width: 480px) {
          .content-overlay {
            padding: 100px 20px 140px 20px;
          }

          .couple-names {
            font-size: clamp(1.8rem, 8vw, 2.5rem);
          }

          .wedding-date {
            font-size: clamp(0.8rem, 2vw, 0.9rem);
          }

          .slide-content h2 {
            font-size: clamp(1.5rem, 6vw, 2rem);
          }

          .slide-content p {
            font-size: clamp(0.9rem, 2.5vw, 1.1rem);
          }

          .nav-btn {
            width: 45px;
            height: 45px;
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
          }

          .decorative-frame {
            top: 15px;
            left: 15px;
            right: 15px;
            bottom: 15px;
          }

          .indicators {
            bottom: 40px;
          }
        }
      </style>
    `;

    const slides = Array.from({ length: slideCount }, (_, i) => {
      const num = i + 1;
      const title = s[`slide${num}Title`] || `Moment ${num}`;
      const desc = s[`slide${num}Description`] || 'A beautiful memory together.';
      const img = s[`slide${num}Image`] || `https://images.unsplash.com/photo-151972541998${num}?w=1920&h=1080&fit=crop`;
      
      return `
        <div class="slide ${i === 0 ? 'active' : ''}" data-slide="${i}">
          <div class="slide-bg" style="background-image: url('${img}');"></div>
          <div class="slide-overlay"></div>
          <div class="decorative-frame"></div>
          <div class="content-overlay">
            <div class="couple-names">${s.coupleNames}</div>
            <div class="wedding-date">${s.weddingDate}</div>
            <div class="divider"></div>
            <div class="slide-content">
              <h2>${title}</h2>
              <p>${desc}</p>
            </div>
          </div>
        </div>
      `;
    }).join('');

    const indicators = Array.from({ length: slideCount }, (_, i) => 
      `<button class="indicator ${i === 0 ? 'active' : ''}" data-index="${i}" aria-label="Go to slide ${i + 1}"></button>`
    ).join('');

    this.shadowRoot.innerHTML = `
      ${styles}
      <div class="slideshow-container">
        <canvas id="hearts-canvas"></canvas>
        
        <div class="slides-wrapper">
          ${slides}
        </div>

        <button class="nav-btn prev" aria-label="Previous slide">
          <svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>

        <button class="nav-btn next" aria-label="Next slide">
          <svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>

        <div class="indicators">${indicators}</div>

        <div class="slide-number">
          <span class="current">1</span>
          <span class="total">of ${slideCount}</span>
        </div>

        <div class="progress-container">
          <div class="progress-bar"></div>
        </div>
      </div>
    `;
  }

  init() {
    const slideCount = Math.min(Math.max(1, parseInt(this.settings.slideCount) || 6), 8);
    this.currentSlide = 0;
    this.stopAutoplay();

    const prevBtn = this.shadowRoot.querySelector('.prev');
    const nextBtn = this.shadowRoot.querySelector('.next');
    const indicators = this.shadowRoot.querySelectorAll('.indicator');

    if (prevBtn) {
      const newPrevBtn = prevBtn.cloneNode(true);
      prevBtn.replaceWith(newPrevBtn);
      newPrevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.changeSlide(-1);
      });
    }

    if (nextBtn) {
      const newNextBtn = nextBtn.cloneNode(true);
      nextBtn.replaceWith(newNextBtn);
      newNextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.changeSlide(1);
      });
    }

    indicators.forEach((indicator) => {
      indicator.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const index = parseInt(indicator.getAttribute('data-index'));
        this.goToSlide(index);
      });
    });

    this.initWebGL();
    this.updateDisplay();
    this.startAutoplay();
  }

  initWebGL() {
    try {
      const canvas = this.shadowRoot.getElementById('hearts-canvas');
      if (!canvas) return;

      const container = this.shadowRoot.querySelector('.slideshow-container');
      if (!container) return;

      canvas.width = container.offsetWidth || 800;
      canvas.height = container.offsetHeight || 600;

      this.gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
      if (!this.gl) {
        console.log('WebGL not supported');
        return;
      }

      const vertexShaderSource = `
        attribute vec2 position;
        attribute vec2 heartPos;
        attribute float heartSize;
        attribute float heartAlpha;
        attribute float heartRotation;
        attribute float heartSpeed;
        uniform float progress;
        varying float vAlpha;
        varying float vRotation;
        
        void main() {
          vec2 pos = heartPos;
          
          // Floating upward with wave motion
          float floatY = progress * heartSpeed * 1.5;
          pos.y -= floatY;
          
          // Gentle wave side-to-side
          pos.x += sin(progress * 6.28 + heartPos.y * 10.0) * 0.05;
          
          vec2 clipSpace = (pos * 2.0 - 1.0) * vec2(1.0, -1.0);
          gl_Position = vec4(clipSpace, 0.0, 1.0);
          gl_PointSize = heartSize;
          
          vAlpha = heartAlpha * (1.0 - progress);
          vRotation = heartRotation + progress * 3.14159;
        }
      `;

      const fragmentShaderSource = `
        precision mediump float;
        varying float vAlpha;
        varying float vRotation;
        uniform vec3 heartColor;
        
        // Heart shape SDF
        float heart(vec2 p) {
          p.x *= 0.5;
          p.y -= 0.3;
          float a = atan(p.x, p.y) / 3.14159;
          float r = length(p);
          float h = abs(a);
          float d = (13.0 * h - 22.0 * h * h + 10.0 * h * h * h) / (6.0 - 5.0 * h);
          return r - d * 0.5;
        }
        
        void main() {
          vec2 coord = gl_PointCoord - vec2(0.5);
          
          // Rotate
          float c = cos(vRotation);
          float s = sin(vRotation);
          coord = vec2(coord.x * c - coord.y * s, coord.x * s + coord.y * c);
          
          float dist = heart(coord * 2.0);
          
          if (dist > 0.0) {
            discard;
          }
          
          float alpha = smoothstep(0.0, -0.1, dist) * vAlpha;
          gl_FragColor = vec4(heartColor, alpha);
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
      this.initHeartParticles();

      this.glUniforms = {
        progress: this.gl.getUniformLocation(this.glProgram, 'progress'),
        heartColor: this.gl.getUniformLocation(this.glProgram, 'heartColor')
      };

      this.gl.enable(this.gl.BLEND);
      this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

      this.animateHearts();

    } catch (error) {
      console.error('WebGL initialization error:', error);
    }
  }

  initHeartParticles() {
    const heartCount = 50;
    const positions = [];
    const sizes = [];
    const alphas = [];
    const rotations = [];
    const speeds = [];

    for (let i = 0; i < heartCount; i++) {
      // Start from bottom of screen
      positions.push(Math.random(), 1.0 + Math.random() * 0.2);
      sizes.push(Math.random() * 40 + 20);
      alphas.push(Math.random() * 0.6 + 0.3);
      rotations.push(Math.random() * Math.PI * 2);
      speeds.push(Math.random() * 0.3 + 0.5);
    }

    const posBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, posBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([0, 0]), this.gl.STATIC_DRAW);
    
    const posLocation = this.gl.getAttribLocation(this.glProgram, 'position');
    this.gl.enableVertexAttribArray(posLocation);
    this.gl.vertexAttribPointer(posLocation, 2, this.gl.FLOAT, false, 0, 0);

    const heartPosBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, heartPosBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);
    
    const heartPosLocation = this.gl.getAttribLocation(this.glProgram, 'heartPos');
    this.gl.enableVertexAttribArray(heartPosLocation);
    this.gl.vertexAttribPointer(heartPosLocation, 2, this.gl.FLOAT, false, 0, 0);
    this.gl.vertexAttribDivisor(heartPosLocation, 1);

    const sizeBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, sizeBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(sizes), this.gl.STATIC_DRAW);
    
    const sizeLocation = this.gl.getAttribLocation(this.glProgram, 'heartSize');
    this.gl.enableVertexAttribArray(sizeLocation);
    this.gl.vertexAttribPointer(sizeLocation, 1, this.gl.FLOAT, false, 0, 0);
    this.gl.vertexAttribDivisor(sizeLocation, 1);

    const alphaBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, alphaBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(alphas), this.gl.STATIC_DRAW);
    
    const alphaLocation = this.gl.getAttribLocation(this.glProgram, 'heartAlpha');
    this.gl.enableVertexAttribArray(alphaLocation);
    this.gl.vertexAttribPointer(alphaLocation, 1, this.gl.FLOAT, false, 0, 0);
    this.gl.vertexAttribDivisor(alphaLocation, 1);

    const rotationBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, rotationBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(rotations), this.gl.STATIC_DRAW);
    
    const rotationLocation = this.gl.getAttribLocation(this.glProgram, 'heartRotation');
    this.gl.enableVertexAttribArray(rotationLocation);
    this.gl.vertexAttribPointer(rotationLocation, 1, this.gl.FLOAT, false, 0, 0);
    this.gl.vertexAttribDivisor(rotationLocation, 1);

    const speedBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, speedBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(speeds), this.gl.STATIC_DRAW);
    
    const speedLocation = this.gl.getAttribLocation(this.glProgram, 'heartSpeed');
    this.gl.enableVertexAttribArray(speedLocation);
    this.gl.vertexAttribPointer(speedLocation, 1, this.gl.FLOAT, false, 0, 0);
    this.gl.vertexAttribDivisor(speedLocation, 1);

    this.heartState.particleCount = heartCount;
  }

  animateHearts(time = 0) {
    if (!this.gl || !this.glUniforms || !this.glProgram) return;

    const canvas = this.shadowRoot.getElementById('hearts-canvas');
    if (!canvas) return;

    if (this.heartState.active) {
      this.heartState.progress = Math.min(this.heartState.progress + 0.008, 1);

      this.gl.viewport(0, 0, canvas.width, canvas.height);
      this.gl.clearColor(0, 0, 0, 0);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);

      this.gl.useProgram(this.glProgram);
      this.gl.uniform1f(this.glUniforms.progress, this.heartState.progress);
      this.gl.uniform3f(this.glUniforms.heartColor, 0.72, 0.43, 0.47); // Rose gold

      const ext = this.gl.getExtension('ANGLE_instanced_arrays');
      if (ext) {
        ext.drawArraysInstancedANGLE(this.gl.POINTS, 0, 1, this.heartState.particleCount);
      }

      if (this.heartState.progress >= 1) {
        this.heartState.active = false;
        this.heartState.progress = 0;
        canvas.classList.remove('active');
      }
    }

    this.animationFrameId = requestAnimationFrame((t) => this.animateHearts(t));
  }

  changeSlide(direction) {
    if (this.isTransitioning) return;
    
    const slideCount = Math.min(Math.max(1, parseInt(this.settings.slideCount) || 6), 8);
    const newSlide = (this.currentSlide + direction + slideCount) % slideCount;

    if (newSlide === this.currentSlide) return;

    this.isTransitioning = true;
    this.triggerHearts();
    
    setTimeout(() => {
      this.currentSlide = newSlide;
      this.updateDisplay();
      this.isTransitioning = false;
    }, 300);

    this.resetAutoplay();
  }

  goToSlide(index) {
    if (this.isTransitioning || index === this.currentSlide) return;
    
    this.isTransitioning = true;
    this.triggerHearts();
    
    setTimeout(() => {
      this.currentSlide = index;
      this.updateDisplay();
      this.isTransitioning = false;
    }, 300);

    this.resetAutoplay();
  }

  triggerHearts() {
    const canvas = this.shadowRoot.getElementById('hearts-canvas');
    if (!canvas) return;

    this.heartState = {
      active: true,
      progress: 0,
      particleCount: this.heartState.particleCount || 50
    };

    canvas.classList.add('active');
    this.initHeartParticles();
  }

  updateDisplay() {
    const slides = this.shadowRoot.querySelectorAll('.slide');
    const indicators = this.shadowRoot.querySelectorAll('.indicator');
    const progressBar = this.shadowRoot.querySelector('.progress-bar');
    const currentNum = this.shadowRoot.querySelector('.slide-number .current');
    const slideCount = Math.min(Math.max(1, parseInt(this.settings.slideCount) || 6), 8);

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
      currentNum.textContent = String(this.currentSlide + 1);
    }
  }

  startAutoplay() {
    this.stopAutoplay();
    const delay = this.settings.autoplayDelay || 5000;
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

customElements.define('romantic-wedding-slideshow', RomanticWeddingSlideshow);
