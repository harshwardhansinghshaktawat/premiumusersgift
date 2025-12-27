// grand-serene-welcome.js
class GrandSereneWelcome extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.settings = this.getDefaultSettings();
    this.gl = null;
    this.glProgram = null;
    this.glUniforms = null;
    this.animationFrameId = null;
    this.transitionState = {
      active: false,
      progress: 0,
      particles: []
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
        this.render();
        this.init();
      } catch (e) {
        console.error('Failed to parse welcome screen data:', e);
        this.render();
        this.init();
      }
    }
  }

  connectedCallback() {
    this.render();
    this.init();
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }

  disconnectedCallback() {
    this.cleanup();
    // Restore body scroll
    document.body.style.overflow = '';
  }

  getDefaultSettings() {
    return {
      hotelName: 'THE GRAND SERENE',
      welcomeTitle: 'Welcome to Luxury',
      welcomeMessage: 'Experience the pinnacle of hospitality where timeless elegance meets modern sophistication. Your journey to extraordinary begins here.',
      bookingButtonText: 'Book Your Stay',
      bookingButtonLink: '#booking',
      enterButtonText: 'Enter The Website',
      enterButtonLink: '#home',
      primaryColor: '#0a192f',
      accentColor: '#d4af37',
      textColor: '#f8f6f1',
      titleFont: 'Cormorant Garamond',
      bodyFont: 'Montserrat',
      showOnce: 'true'
    };
  }

  render() {
    const s = this.settings;

    const styles = `
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        :host {
          display: block;
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: 9999;
          font-family: ${s.bodyFont}, sans-serif;
          overflow: hidden;
          pointer-events: auto;
        }

        :host(.removing) {
          pointer-events: none;
        }

        .welcome-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: linear-gradient(135deg, 
            rgba(10, 25, 47, 0.95) 0%, 
            rgba(10, 25, 47, 0.98) 50%,
            rgba(10, 25, 47, 0.95) 100%);
          backdrop-filter: blur(20px);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 1;
          transition: opacity 1.2s ease;
          overflow: hidden;
        }

        .welcome-overlay.hidden {
          opacity: 0;
          pointer-events: none;
        }

        #transition-canvas {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          pointer-events: none;
          z-index: 10001;
          opacity: 0;
          transition: opacity 0.5s ease;
        }

        #transition-canvas.active {
          opacity: 1;
        }

        .radial-overlay {
          position: fixed;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          background: radial-gradient(circle, 
            rgba(212, 175, 55, 0.3) 0%, 
            rgba(212, 175, 55, 0.1) 30%,
            transparent 70%);
          transform: translate(-50%, -50%);
          border-radius: 50%;
          pointer-events: none;
          z-index: 10000;
          opacity: 0;
          transition: all 1.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .radial-overlay.active {
          width: 300vw;
          height: 300vh;
          opacity: 1;
        }

        .radial-overlay.fadeout {
          opacity: 0;
          transition: opacity 0.5s ease;
        }

        .welcome-container {
          text-align: center;
          max-width: 900px;
          padding: 60px 40px;
          position: relative;
          z-index: 2;
          animation: fadeInUp 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .ornament-top,
        .ornament-bottom {
          width: 120px;
          height: 2px;
          background: linear-gradient(90deg, 
            transparent 0%, 
            ${s.accentColor} 50%, 
            transparent 100%);
          margin: 0 auto;
          position: relative;
          animation: expandWidth 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        @keyframes expandWidth {
          from {
            width: 0;
          }
          to {
            width: 120px;
          }
        }

        .ornament-top::before,
        .ornament-top::after,
        .ornament-bottom::before,
        .ornament-bottom::after {
          content: '';
          position: absolute;
          width: 8px;
          height: 8px;
          background: ${s.accentColor};
          border-radius: 50%;
          top: 50%;
          transform: translateY(-50%);
          box-shadow: 0 0 20px ${s.accentColor};
        }

        .ornament-top::before,
        .ornament-bottom::before {
          left: -4px;
        }

        .ornament-top::after,
        .ornament-bottom::after {
          right: -4px;
        }

        .ornament-top {
          margin-bottom: 40px;
        }

        .ornament-bottom {
          margin-top: 40px;
        }

        .hotel-name {
          font-family: ${s.titleFont}, serif;
          font-size: clamp(2.5rem, 6vw, 5rem);
          font-weight: 700;
          color: ${s.accentColor};
          letter-spacing: 0.15em;
          margin-bottom: 20px;
          text-shadow: 0 0 40px rgba(212, 175, 55, 0.4);
          animation: glow 3s ease-in-out infinite alternate;
        }

        @keyframes glow {
          from {
            text-shadow: 0 0 20px rgba(212, 175, 55, 0.4);
          }
          to {
            text-shadow: 0 0 40px rgba(212, 175, 55, 0.6),
                         0 0 60px rgba(212, 175, 55, 0.3);
          }
        }

        .welcome-title {
          font-family: ${s.titleFont}, serif;
          font-size: clamp(1.8rem, 4vw, 3rem);
          font-weight: 400;
          color: ${s.textColor};
          margin-bottom: 30px;
          font-style: italic;
          opacity: 0;
          animation: fadeIn 1s ease 0.5s forwards;
        }

        @keyframes fadeIn {
          to {
            opacity: 1;
          }
        }

        .welcome-message {
          font-family: ${s.bodyFont}, sans-serif;
          font-size: clamp(1rem, 1.5vw, 1.2rem);
          font-weight: 300;
          color: #e8e6e0;
          line-height: 1.8;
          margin-bottom: 50px;
          max-width: 700px;
          margin-left: auto;
          margin-right: auto;
          opacity: 0;
          animation: fadeIn 1s ease 0.8s forwards;
        }

        .button-group {
          display: flex;
          gap: 20px;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
          opacity: 0;
          animation: fadeIn 1s ease 1.1s forwards;
        }

        .btn {
          padding: 18px 45px;
          font-family: ${s.bodyFont}, sans-serif;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 2px;
          border: none;
          border-radius: 0;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        .btn::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }

        .btn:hover::before {
          width: 300px;
          height: 300px;
        }

        .btn-primary {
          background: linear-gradient(135deg, ${s.accentColor}, #f4e4b0);
          color: ${s.primaryColor};
          box-shadow: 0 8px 30px rgba(212, 175, 55, 0.4);
          position: relative;
        }

        .btn-primary:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 40px rgba(212, 175, 55, 0.6);
        }

        .btn-secondary {
          background: transparent;
          color: ${s.textColor};
          border: 2px solid ${s.accentColor};
          box-shadow: 0 8px 30px rgba(212, 175, 55, 0.2);
        }

        .btn-secondary:hover {
          background: rgba(212, 175, 55, 0.1);
          transform: translateY(-3px);
          box-shadow: 0 12px 40px rgba(212, 175, 55, 0.4);
        }

        .decorative-pattern {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          opacity: 0.03;
          background-image: 
            radial-gradient(circle at 20% 50%, ${s.accentColor} 1px, transparent 1px),
            radial-gradient(circle at 80% 50%, ${s.accentColor} 1px, transparent 1px);
          background-size: 50px 50px;
          pointer-events: none;
          z-index: 1;
        }

        .corner-ornament {
          position: absolute;
          width: 120px;
          height: 120px;
          border: 2px solid ${s.accentColor};
          opacity: 0.3;
          pointer-events: none;
        }

        .corner-ornament.top-left {
          top: 40px;
          left: 40px;
          border-right: none;
          border-bottom: none;
        }

        .corner-ornament.top-right {
          top: 40px;
          right: 40px;
          border-left: none;
          border-bottom: none;
        }

        .corner-ornament.bottom-left {
          bottom: 40px;
          left: 40px;
          border-right: none;
          border-top: none;
        }

        .corner-ornament.bottom-right {
          bottom: 40px;
          right: 40px;
          border-left: none;
          border-top: none;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .welcome-container {
            padding: 40px 30px;
          }

          .hotel-name {
            font-size: clamp(2rem, 8vw, 3rem);
            letter-spacing: 0.1em;
          }

          .welcome-title {
            font-size: clamp(1.5rem, 5vw, 2rem);
          }

          .welcome-message {
            font-size: clamp(0.9rem, 2vw, 1.1rem);
            margin-bottom: 40px;
          }

          .button-group {
            flex-direction: column;
            gap: 15px;
            align-items: center;
          }

          .btn {
            width: 100%;
            max-width: 300px;
          }

          .corner-ornament {
            width: 60px;
            height: 60px;
          }

          .corner-ornament.top-left,
          .corner-ornament.top-right {
            top: 20px;
          }

          .corner-ornament.bottom-left,
          .corner-ornament.bottom-right {
            bottom: 20px;
          }

          .corner-ornament.top-left,
          .corner-ornament.bottom-left {
            left: 20px;
          }

          .corner-ornament.top-right,
          .corner-ornament.bottom-right {
            right: 20px;
          }
        }

        @media (max-width: 480px) {
          .welcome-container {
            padding: 30px 20px;
          }

          .ornament-top,
          .ornament-bottom {
            width: 80px;
          }

          .ornament-top {
            margin-bottom: 30px;
          }

          .ornament-bottom {
            margin-top: 30px;
          }

          .corner-ornament {
            width: 40px;
            height: 40px;
          }
        }
      </style>
    `;

    this.shadowRoot.innerHTML = `
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600;700&family=Montserrat:wght@300;400;500;600&display=swap" rel="stylesheet">
      ${styles}
      
      <canvas id="transition-canvas"></canvas>
      <div class="radial-overlay"></div>
      
      <div class="welcome-overlay">
        <div class="decorative-pattern"></div>
        <div class="corner-ornament top-left"></div>
        <div class="corner-ornament top-right"></div>
        <div class="corner-ornament bottom-left"></div>
        <div class="corner-ornament bottom-right"></div>
        
        <div class="welcome-container">
          <div class="ornament-top"></div>
          
          <h1 class="hotel-name">${s.hotelName}</h1>
          <h2 class="welcome-title">${s.welcomeTitle}</h2>
          <p class="welcome-message">${s.welcomeMessage}</p>
          
          <div class="button-group">
            <a href="${s.bookingButtonLink}" class="btn btn-primary" id="bookingBtn">
              ${s.bookingButtonText}
            </a>
            <a href="${s.enterButtonLink}" class="btn btn-secondary" id="enterBtn">
              ${s.enterButtonText}
            </a>
          </div>
          
          <div class="ornament-bottom"></div>
        </div>
      </div>
    `;
  }

  init() {
    const shouldShowOnce = this.settings.showOnce === 'true' || this.settings.showOnce === true;
    
    if (shouldShowOnce) {
      const hasSeenWelcome = localStorage.getItem('grandSereneWelcomeSeen');
      if (hasSeenWelcome === 'true') {
        this.hideImmediately();
        return;
      }
    }

    const bookingBtn = this.shadowRoot.getElementById('bookingBtn');
    const enterBtn = this.shadowRoot.getElementById('enterBtn');

    if (bookingBtn) {
      bookingBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.closeWelcome(this.settings.bookingButtonLink);
      });
    }

    if (enterBtn) {
      enterBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.closeWelcome(this.settings.enterButtonLink);
      });
    }

    this.initWebGL();
  }

  hideImmediately() {
    this.style.display = 'none';
    document.body.style.overflow = '';
  }

  initWebGL() {
    try {
      const canvas = this.shadowRoot.getElementById('transition-canvas');
      if (!canvas) return;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      this.gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
      if (!this.gl) {
        console.log('WebGL not supported');
        return;
      }

      const vertexShaderSource = `
        attribute vec2 position;
        attribute vec2 particlePos;
        attribute float particleSize;
        attribute float particleAlpha;
        attribute float particleAngle;
        attribute float particleSpeed;
        uniform float progress;
        uniform vec2 resolution;
        varying float vAlpha;
        varying float vProgress;
        
        void main() {
          vec2 pos = particlePos;
          
          vec2 center = vec2(0.5, 0.5);
          vec2 dir = normalize(particlePos - center);
          
          float angle = particleAngle + progress * 3.14159 * 2.0;
          mat2 rotation = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
          dir = rotation * dir;
          
          float distance = progress * particleSpeed * 2.5;
          pos += dir * distance;
          
          pos.x += sin(progress * 6.28 + particleAngle) * 0.05 * progress;
          pos.y += cos(progress * 6.28 + particleAngle) * 0.05 * progress;
          
          vec2 clipSpace = (pos * 2.0 - 1.0) * vec2(1.0, -1.0);
          gl_Position = vec4(clipSpace, 0.0, 1.0);
          
          float sizeFactor = sin(progress * 3.14159);
          gl_PointSize = particleSize * sizeFactor * 1.5;
          
          vAlpha = particleAlpha * (1.0 - progress * progress);
          vProgress = progress;
        }
      `;

      const fragmentShaderSource = `
        precision mediump float;
        varying float vAlpha;
        varying float vProgress;
        uniform vec3 color1;
        uniform vec3 color2;
        
        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          
          if (dist > 0.5) {
            discard;
          }
          
          vec3 color = mix(color1, color2, vProgress);
          float alpha = (1.0 - dist * 2.0) * vAlpha;
          alpha += (1.0 - dist) * vAlpha * 0.3;
          
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

      this.initParticles();

      this.glUniforms = {
        progress: this.gl.getUniformLocation(this.glProgram, 'progress'),
        resolution: this.gl.getUniformLocation(this.glProgram, 'resolution'),
        color1: this.gl.getUniformLocation(this.glProgram, 'color1'),
        color2: this.gl.getUniformLocation(this.glProgram, 'color2')
      };

      this.gl.enable(this.gl.BLEND);
      this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE);

      this.animateTransition();

    } catch (error) {
      console.error('WebGL initialization error:', error);
    }
  }

  initParticles() {
    const particleCount = 400;
    const positions = [];
    const sizes = [];
    const alphas = [];
    const angles = [];
    const speeds = [];

    for (let i = 0; i < particleCount; i++) {
      const centerX = 0.5 + (Math.random() - 0.5) * 0.1;
      const centerY = 0.5 + (Math.random() - 0.5) * 0.1;
      positions.push(centerX, centerY);
      sizes.push(Math.random() * 40 + 15);
      alphas.push(Math.random() * 0.8 + 0.2);
      angles.push(Math.random() * Math.PI * 2);
      speeds.push(Math.random() * 0.5 + 0.7);
    }

    const posBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, posBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([0, 0]), this.gl.STATIC_DRAW);
    
    const posLocation = this.gl.getAttribLocation(this.glProgram, 'position');
    this.gl.enableVertexAttribArray(posLocation);
    this.gl.vertexAttribPointer(posLocation, 2, this.gl.FLOAT, false, 0, 0);

    const particlePosBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, particlePosBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);
    
    const particlePosLocation = this.gl.getAttribLocation(this.glProgram, 'particlePos');
    this.gl.enableVertexAttribArray(particlePosLocation);
    this.gl.vertexAttribPointer(particlePosLocation, 2, this.gl.FLOAT, false, 0, 0);
    this.gl.vertexAttribDivisor(particlePosLocation, 1);

    const sizeBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, sizeBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(sizes), this.gl.STATIC_DRAW);
    
    const sizeLocation = this.gl.getAttribLocation(this.glProgram, 'particleSize');
    this.gl.enableVertexAttribArray(sizeLocation);
    this.gl.vertexAttribPointer(sizeLocation, 1, this.gl.FLOAT, false, 0, 0);
    this.gl.vertexAttribDivisor(sizeLocation, 1);

    const alphaBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, alphaBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(alphas), this.gl.STATIC_DRAW);
    
    const alphaLocation = this.gl.getAttribLocation(this.glProgram, 'particleAlpha');
    this.gl.enableVertexAttribArray(alphaLocation);
    this.gl.vertexAttribPointer(alphaLocation, 1, this.gl.FLOAT, false, 0, 0);
    this.gl.vertexAttribDivisor(alphaLocation, 1);

    const angleBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, angleBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(angles), this.gl.STATIC_DRAW);
    
    const angleLocation = this.gl.getAttribLocation(this.glProgram, 'particleAngle');
    this.gl.enableVertexAttribArray(angleLocation);
    this.gl.vertexAttribPointer(angleLocation, 1, this.gl.FLOAT, false, 0, 0);
    this.gl.vertexAttribDivisor(angleLocation, 1);

    const speedBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, speedBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(speeds), this.gl.STATIC_DRAW);
    
    const speedLocation = this.gl.getAttribLocation(this.glProgram, 'particleSpeed');
    this.gl.enableVertexAttribArray(speedLocation);
    this.gl.vertexAttribPointer(speedLocation, 1, this.gl.FLOAT, false, 0, 0);
    this.gl.vertexAttribDivisor(speedLocation, 1);

    this.transitionState.particleCount = particleCount;
  }

  animateTransition(time = 0) {
    if (!this.gl || !this.glUniforms || !this.glProgram) return;

    const canvas = this.shadowRoot.getElementById('transition-canvas');
    if (!canvas) return;

    if (this.transitionState.active) {
      this.transitionState.progress = Math.min(this.transitionState.progress + 0.01, 1);

      this.gl.viewport(0, 0, canvas.width, canvas.height);
      this.gl.clearColor(0, 0, 0, 0);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);

      this.gl.useProgram(this.glProgram);
      this.gl.uniform1f(this.glUniforms.progress, this.transitionState.progress);
      this.gl.uniform2f(this.glUniforms.resolution, canvas.width, canvas.height);
      this.gl.uniform3f(this.glUniforms.color1, 0.83, 0.69, 0.22);
      this.gl.uniform3f(this.glUniforms.color2, 1.0, 1.0, 1.0);

      const ext = this.gl.getExtension('ANGLE_instanced_arrays');
      if (ext) {
        ext.drawArraysInstancedANGLE(this.gl.POINTS, 0, 1, this.transitionState.particleCount);
      } else {
        this.gl.drawArrays(this.gl.POINTS, 0, this.transitionState.particleCount);
      }

      if (this.transitionState.progress >= 1) {
        this.transitionState.active = false;
        
        // Clean up and navigate
        const radialOverlay = this.shadowRoot.querySelector('.radial-overlay');
        if (radialOverlay) {
          radialOverlay.classList.add('fadeout');
        }
        
        setTimeout(() => {
          // Restore scroll and remove element
          document.body.style.overflow = '';
          
          // Navigate to URL
          if (this.transitionState.targetUrl) {
            window.location.href = this.transitionState.targetUrl;
          }
        }, 500);
      }
    }

    this.animationFrameId = requestAnimationFrame((t) => this.animateTransition(t));
  }

  closeWelcome(targetUrl) {
    const shouldShowOnce = this.settings.showOnce === 'true' || this.settings.showOnce === true;
    
    if (shouldShowOnce) {
      localStorage.setItem('grandSereneWelcomeSeen', 'true');
    }

    const canvas = this.shadowRoot.getElementById('transition-canvas');
    const overlay = this.shadowRoot.querySelector('.welcome-overlay');
    const radialOverlay = this.shadowRoot.querySelector('.radial-overlay');

    // Disable pointer events on host
    this.classList.add('removing');

    // Start transition
    this.transitionState = {
      active: true,
      progress: 0,
      targetUrl: targetUrl,
      particleCount: this.transitionState.particleCount || 400
    };

    if (canvas) {
      canvas.classList.add('active');
    }

    if (radialOverlay) {
      radialOverlay.classList.add('active');
    }

    // Hide overlay
    if (overlay) {
      overlay.classList.add('hidden');
    }

    // Reinitialize particles
    this.initParticles();
  }

  cleanup() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}

customElements.define('grand-serene-welcome', GrandSereneWelcome);
