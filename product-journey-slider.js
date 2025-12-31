// product-journey-slider.js
class ProductJourneySlider extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.currentSlide = 0;
    this.isTransitioning = false;
    this.autoplayInterval = null;
    this.settings = this.getDefaultSettings();
    this.isScrolling = false;
    this.touchStartY = 0;
    this.touchEndY = 0;
    this.wheelHandler = null;
    this.touchStartHandler = null;
    this.touchEndHandler = null;
    this.isMouseOver = false;
  }

  static get observedAttributes() {
    return ['data'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'data' && newValue) {
      try {
        const parsed = JSON.parse(newValue);
        this.settings = { ...this.getDefaultSettings(), ...parsed };
        console.log('Product Journey Slider settings updated:', this.settings);
        this.render();
        this.init();
      } catch (e) {
        console.error('Failed to parse slider data:', e);
        this.render();
        this.init();
      }
    }
  }

  connectedCallback() {
    console.log('Product Journey Slider connected');
    this.render();
    this.init();
  }

  disconnectedCallback() {
    this.cleanup();
  }

  getDefaultSettings() {
    return {
      bgDark: '#0a0a0a',
      bgSecondary: '#1a1a1a',
      accentCyan: '#00d9ff',
      accentPurple: '#b829ff',
      accentOrange: '#ff6b35',
      textPrimary: '#ffffff',
      textSecondary: '#b0b0b0',
      textMuted: '#666666',
      headingTag: 'h2',
      numberFont: 'Bebas Neue',
      labelFont: 'Bebas Neue',
      bodyFont: 'Outfit',
      animationSpeed: 800,
      autoplayDelay: 5000,
      slideCount: 5,
      slide1Number: '01',
      slide1Label: 'SKETCH',
      slide1Tagline: 'From Concept to Canvas',
      slide1Description: 'Every innovation begins with a simple line on paper. Raw ideas take shape through sketches, capturing the essence of what could be. This is where imagination meets possibility, where the journey from vision to reality begins.',
      slide1Image: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800&h=600&fit=crop',
      slide2Number: '02',
      slide2Label: 'DESIGN',
      slide2Tagline: 'Digital Precision',
      slide2Description: 'Ideas transform into precise digital models. Every curve, every angle refined through advanced CAD software. This is where creativity meets engineering, where concepts gain structure and form in the digital realm.',
      slide2Image: 'https://images.unsplash.com/photo-1598662779094-64c7c2bc1f19?w=800&h=600&fit=crop',
      slide3Number: '03',
      slide3Label: 'PROTOTYPE',
      slide3Tagline: 'Touch the Future',
      slide3Description: 'Digital becomes tangible. Advanced 3D printing brings designs into physical reality. Hold the form, test the weight, experience the vision. This is where we validate what works and discover what needs refinement.',
      slide3Image: 'https://images.unsplash.com/photo-1567789884554-0b844b597180?w=800&h=600&fit=crop',
      slide4Number: '04',
      slide4Label: 'REFINE',
      slide4Tagline: 'Perfect Every Detail',
      slide4Description: 'Materials meet design. Premium finishes applied, ergonomics perfected, functionality tested to extremes. Every surface, every interaction refined through countless iterations. Excellence lives in the details.',
      slide4Image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=600&fit=crop',
      slide5Number: '05',
      slide5Label: 'PRODUCT',
      slide5Tagline: 'Ready to Inspire',
      slide5Description: 'The journey complete. From initial sketch to final product, innovation realized. Every element perfected, every detail considered. This is more than a product—it\'s a testament to vision, precision, and relentless pursuit of excellence.',
      slide5Image: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=800&h=600&fit=crop',
      slide6Number: '06',
      slide6Label: 'SLIDE 6',
      slide6Tagline: 'Your Tagline Here',
      slide6Description: 'Your description here.',
      slide6Image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=600&fit=crop',
      slide7Number: '07',
      slide7Label: 'SLIDE 7',
      slide7Tagline: 'Your Tagline Here',
      slide7Description: 'Your description here.',
      slide7Image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&h=600&fit=crop',
      slide8Number: '08',
      slide8Label: 'SLIDE 8',
      slide8Tagline: 'Your Tagline Here',
      slide8Description: 'Your description here.',
      slide8Image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&h=600&fit=crop'
    };
  }

  render() {
    const s = this.settings;
    const slideCount = Math.min(Math.max(1, parseInt(s.slideCount) || 5), 8);
    const HeadingTag = s.headingTag || 'h2';

    const styles = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;600;700&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        :host {
          display: block;
          width: 100%;
          height: 100%;
          font-family: ${s.bodyFont}, sans-serif;
          position: relative;
          overflow: hidden;
        }

        .slider-container {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: ${s.bgDark};
        }

        .bg-gradient {
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle at center, rgba(0, 217, 255, 0.1) 0%, transparent 50%);
          animation: rotate 30s linear infinite;
          pointer-events: none;
        }

        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .progress-bar {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 3px;
          background: ${s.bgSecondary};
          z-index: 1000;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, ${s.accentCyan}, ${s.accentPurple});
          transition: width ${s.animationSpeed}ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        .slides-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .slide {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          visibility: hidden;
          transition: opacity ${s.animationSpeed}ms ease, visibility ${s.animationSpeed}ms ease;
          padding: 5% 4% 8% 4%;
        }

        .slide.active {
          opacity: 1;
          visibility: visible;
          z-index: 1;
        }

        .slide-content {
          width: 100%;
          max-width: 90%;
          height: 100%;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 5%;
          align-items: center;
        }

        .text-content {
          display: flex;
          flex-direction: column;
          justify-content: center;
          height: 100%;
          transform: translateX(-100px);
          opacity: 0;
          transition: all 1s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .slide.active .text-content {
          transform: translateX(0);
          opacity: 1;
          transition-delay: 0.3s;
        }

        .accent-line {
          width: min(100px, 15%);
          height: 2px;
          background: linear-gradient(90deg, ${s.accentCyan}, transparent);
          margin-bottom: 4%;
          opacity: 0;
          transform: translateX(-50px);
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
          flex-shrink: 0;
        }

        .slide.active .accent-line {
          opacity: 1;
          transform: translateX(0);
          transition-delay: 0.8s;
        }

        .slide-number {
          font-family: ${s.numberFont}, sans-serif;
          font-size: clamp(2rem, 12vh, 8rem);
          line-height: 0.9;
          background: linear-gradient(135deg, ${s.accentCyan}, ${s.accentPurple});
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 3%;
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
          flex-shrink: 0;
        }

        .slide.active .slide-number {
          opacity: 1;
          transform: translateY(0);
          transition-delay: 0.4s;
        }

        .stage-label {
          font-family: ${s.labelFont}, sans-serif;
          font-size: clamp(1.5rem, 8vh, 5rem);
          line-height: 1;
          margin-bottom: 2%;
          letter-spacing: 0.05em;
          color: ${s.textPrimary};
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
          flex-shrink: 0;
        }

        .slide.active .stage-label {
          opacity: 1;
          transform: translateY(0);
          transition-delay: 0.5s;
        }

        .tagline {
          font-size: clamp(0.65rem, 1.5vh, 1rem);
          font-weight: 300;
          color: ${s.textSecondary};
          text-transform: uppercase;
          letter-spacing: 0.2em;
          margin-bottom: 4%;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
          flex-shrink: 0;
        }

        .slide.active .tagline {
          opacity: 1;
          transform: translateY(0);
          transition-delay: 0.6s;
        }

        .description {
          font-size: clamp(0.8rem, 2vh, 1.125rem);
          line-height: 1.7;
          color: ${s.textSecondary};
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
          overflow-y: auto;
          max-height: 40%;
        }

        .slide.active .description {
          opacity: 1;
          transform: translateY(0);
          transition-delay: 0.7s;
        }

        .image-content {
          position: relative;
          height: 100%;
          display: flex;
          align-items: center;
          transform: scale(0.9) translateX(100px);
          opacity: 0;
          transition: all 1s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .slide.active .image-content {
          transform: scale(1) translateX(0);
          opacity: 1;
          transition-delay: 0.4s;
        }

        .image-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
          max-height: 100%;
          border-radius: min(20px, 2vh);
          overflow: hidden;
          box-shadow: 0 4vh 8vh rgba(0, 0, 0, 0.5);
        }

        .image-wrapper::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(0, 217, 255, 0.2), rgba(184, 41, 255, 0.2));
          z-index: 1;
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        .image-wrapper:hover::before {
          opacity: 1;
        }

        .product-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .image-wrapper:hover .product-image {
          transform: scale(1.05);
        }

        .navigation {
          position: absolute;
          right: 3%;
          top: 50%;
          transform: translateY(-50%);
          z-index: 100;
        }

        .nav-item {
          position: relative;
          display: flex;
          align-items: center;
          margin: 2vh 0;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .nav-dot {
          width: min(12px, 1.2vh);
          height: min(12px, 1.2vh);
          border-radius: 50%;
          background: ${s.bgSecondary};
          border: 2px solid ${s.textMuted};
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
        }

        .nav-item:hover .nav-dot {
          background: ${s.accentCyan};
          border-color: ${s.accentCyan};
          transform: scale(1.2);
        }

        .nav-item.active .nav-dot {
          background: ${s.accentCyan};
          border-color: ${s.accentCyan};
          transform: scale(1.3);
        }

        .nav-item.active .nav-dot::before {
          content: '';
          position: absolute;
          width: min(24px, 2.4vh);
          height: min(24px, 2.4vh);
          border: 2px solid ${s.accentCyan};
          border-radius: 50%;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0; transform: translate(-50%, -50%) scale(1.5); }
        }

        .nav-label {
          position: absolute;
          right: 2vh;
          white-space: nowrap;
          font-size: clamp(0.6rem, 1.2vh, 0.75rem);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: ${s.textMuted};
          opacity: 0;
          transform: translateX(10px);
          transition: all 0.3s ease;
          pointer-events: none;
        }

        .nav-item:hover .nav-label,
        .nav-item.active .nav-label {
          opacity: 1;
          transform: translateX(0);
          color: ${s.textPrimary};
        }

        .controls {
          position: absolute;
          bottom: 4%;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 3%;
          z-index: 100;
        }

        .control-btn {
          position: relative;
          width: min(70px, 8vh);
          height: min(70px, 8vh);
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.2);
          background: rgba(26, 26, 26, 0.6);
          backdrop-filter: blur(20px);
          color: ${s.textPrimary};
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
        }

        .control-btn::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) scale(0);
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: linear-gradient(135deg, ${s.accentCyan}, ${s.accentPurple});
          opacity: 0;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: -1;
        }

        .control-btn:hover::before {
          transform: translate(-50%, -50%) scale(1);
          opacity: 0.2;
        }

        .control-btn:hover {
          border-color: ${s.accentCyan};
          transform: scale(1.1);
          box-shadow: 0 1vh 4vh rgba(0, 217, 255, 0.3);
        }

        .control-btn:active {
          transform: scale(0.95);
        }

        .control-btn svg {
          width: 30%;
          height: 30%;
          transition: transform 0.3s ease;
        }

        .control-btn:hover svg {
          transform: scale(1.2);
        }

        /* Responsive Breakpoints */
        @media (max-width: 1024px) {
          .slide-content {
            grid-template-columns: 1fr;
            gap: 3%;
          }

          .slide {
            padding: 8% 4% 12% 4%;
          }

          .text-content {
            text-align: center;
            transform: none !important;
          }

          .image-content {
            transform: none !important;
            height: 40%;
          }

          .slide.active .text-content,
          .slide.active .image-content {
            transform: none !important;
          }

          .accent-line {
            margin-left: auto;
            margin-right: auto;
          }

          .description {
            max-width: 100%;
            max-height: none;
          }

          .navigation {
            right: 2%;
          }
        }

        @media (max-width: 768px) {
          .slide {
            padding: 10% 3% 15% 3%;
          }

          .slide-content {
            gap: 2%;
          }

          .navigation {
            right: 1.5%;
          }

          .nav-item {
            margin: 1.5vh 0;
          }

          .controls {
            bottom: 3%;
          }

          .image-content {
            height: 35%;
          }
        }

        @media (max-width: 480px) {
          .slide {
            padding: 12% 2% 18% 2%;
          }

          .navigation {
            right: 1%;
          }

          .controls {
            bottom: 2%;
          }

          .control-btn {
            width: min(50px, 6vh);
            height: min(50px, 6vh);
          }

          .image-content {
            height: 30%;
          }

          .nav-dot {
            width: min(10px, 1vh);
            height: min(10px, 1vh);
          }

          .nav-item.active .nav-dot::before {
            width: min(20px, 2vh);
            height: min(20px, 2vh);
          }
        }
      </style>
    `;

    const slides = Array.from({ length: slideCount }, (_, i) => {
      const num = i + 1;
      const slideNum = s[`slide${num}Number`] || `0${num}`;
      const label = s[`slide${num}Label`] || `SLIDE ${num}`;
      const tagline = s[`slide${num}Tagline`] || 'Your Tagline Here';
      const desc = s[`slide${num}Description`] || 'Your description here.';
      const img = s[`slide${num}Image`] || `https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=600&fit=crop`;
      
      return `
        <div class="slide ${i === 0 ? 'active' : ''}" data-slide="${i}">
          <div class="slide-content">
            <div class="text-content">
              <div class="accent-line"></div>
              <div class="slide-number">${slideNum}</div>
              <${HeadingTag} class="stage-label">${label}</${HeadingTag}>
              <p class="tagline">${tagline}</p>
              <p class="description">${desc}</p>
            </div>
            <div class="image-content">
              <div class="image-wrapper">
                <img src="${img}" alt="${label}" class="product-image">
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    const navItems = Array.from({ length: slideCount }, (_, i) => {
      const num = i + 1;
      const label = s[`slide${num}Label`] || `Slide ${num}`;
      return `
        <div class="nav-item ${i === 0 ? 'active' : ''}" data-nav="${i}">
          <div class="nav-dot"></div>
          <span class="nav-label">${label}</span>
        </div>
      `;
    }).join('');

    this.shadowRoot.innerHTML = `
      ${styles}
      <div class="slider-container">
        <div class="bg-gradient"></div>
        
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${(1 / slideCount) * 100}%"></div>
        </div>

        <div class="slides-wrapper">
          ${slides}
        </div>

        <div class="navigation">
          ${navItems}
        </div>

        <div class="controls">
          <button class="control-btn prev-btn" aria-label="Previous slide">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <button class="control-btn next-btn" aria-label="Next slide">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  init() {
    const slideCount = Math.min(Math.max(1, parseInt(this.settings.slideCount) || 5), 8);
    this.currentSlide = 0;
    this.stopAutoplay();

    const prevBtn = this.shadowRoot.querySelector('.prev-btn');
    const nextBtn = this.shadowRoot.querySelector('.next-btn');
    const navItems = this.shadowRoot.querySelectorAll('.nav-item');

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

    navItems.forEach((item) => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const index = parseInt(item.getAttribute('data-nav'));
        this.goToSlide(index);
      });
    });

    // Setup mouse enter/leave detection
    this.addEventListener('mouseenter', () => {
      this.isMouseOver = true;
    });

    this.addEventListener('mouseleave', () => {
      this.isMouseOver = false;
    });

    // Setup scroll and touch handlers
    this.setupScrollNavigation();
    this.setupTouchNavigation();

    this.updateDisplay();
    this.startAutoplay();
  }

  setupScrollNavigation() {
    const slideCount = Math.min(Math.max(1, parseInt(this.settings.slideCount) || 5), 8);

    // Remove old listener if exists
    if (this.wheelHandler) {
      document.removeEventListener('wheel', this.wheelHandler);
    }

    this.wheelHandler = (e) => {
      // Only handle scroll when mouse is over the element
      if (!this.isMouseOver) return;

      // If on first slide and scrolling up, allow page scroll
      if (this.currentSlide === 0 && e.deltaY < 0) {
        return;
      }

      // If on last slide and scrolling down, allow page scroll
      if (this.currentSlide === slideCount - 1 && e.deltaY > 0) {
        return;
      }

      // Prevent page scroll and handle slide change
      e.preventDefault();
      
      if (this.isScrolling) return;

      this.isScrolling = true;
      setTimeout(() => {
        this.isScrolling = false;
      }, this.settings.animationSpeed);

      if (e.deltaY > 0) {
        this.changeSlide(1);
      } else {
        this.changeSlide(-1);
      }
    };

    document.addEventListener('wheel', this.wheelHandler, { passive: false });
  }

  setupTouchNavigation() {
    // Remove old listeners if exist
    if (this.touchStartHandler) {
      this.removeEventListener('touchstart', this.touchStartHandler);
    }
    if (this.touchEndHandler) {
      this.removeEventListener('touchend', this.touchEndHandler);
    }

    this.touchStartHandler = (e) => {
      this.touchStartY = e.changedTouches[0].screenY;
    };

    this.touchEndHandler = (e) => {
      this.touchEndY = e.changedTouches[0].screenY;
      this.handleSwipe();
    };

    this.addEventListener('touchstart', this.touchStartHandler);
    this.addEventListener('touchend', this.touchEndHandler);
  }

  handleSwipe() {
    const slideCount = Math.min(Math.max(1, parseInt(this.settings.slideCount) || 5), 8);
    const swipeThreshold = 50;

    // Swipe up (next slide)
    if (this.touchStartY - this.touchEndY > swipeThreshold) {
      if (this.currentSlide === slideCount - 1) {
        return; // Allow page scroll
      }
      this.changeSlide(1);
    }

    // Swipe down (previous slide)
    if (this.touchEndY - this.touchStartY > swipeThreshold) {
      if (this.currentSlide === 0) {
        return; // Allow page scroll
      }
      this.changeSlide(-1);
    }
  }

  changeSlide(direction) {
    if (this.isTransitioning) return;
    
    const slideCount = Math.min(Math.max(1, parseInt(this.settings.slideCount) || 5), 8);
    let newSlide = this.currentSlide + direction;

    // Clamp to valid range
    if (newSlide < 0) newSlide = 0;
    if (newSlide >= slideCount) newSlide = slideCount - 1;

    if (newSlide === this.currentSlide) return;

    this.isTransitioning = true;
    this.currentSlide = newSlide;
    this.updateDisplay();
    
    setTimeout(() => {
      this.isTransitioning = false;
    }, this.settings.animationSpeed);

    this.resetAutoplay();
  }

  goToSlide(index) {
    if (this.isTransitioning || index === this.currentSlide) return;
    
    this.isTransitioning = true;
    this.currentSlide = index;
    this.updateDisplay();
    
    setTimeout(() => {
      this.isTransitioning = false;
    }, this.settings.animationSpeed);

    this.resetAutoplay();
  }

  updateDisplay() {
    const slides = this.shadowRoot.querySelectorAll('.slide');
    const navItems = this.shadowRoot.querySelectorAll('.nav-item');
    const progressFill = this.shadowRoot.querySelector('.progress-fill');
    const slideCount = Math.min(Math.max(1, parseInt(this.settings.slideCount) || 5), 8);

    slides.forEach((slide, i) => {
      if (i === this.currentSlide) {
        slide.classList.add('active');
      } else {
        slide.classList.remove('active');
      }
    });

    navItems.forEach((nav, i) => {
      if (i === this.currentSlide) {
        nav.classList.add('active');
      } else {
        nav.classList.remove('active');
      }
    });

    if (progressFill) {
      const progress = ((this.currentSlide + 1) / slideCount) * 100;
      progressFill.style.width = `${progress}%`;
    }
  }

  startAutoplay() {
    this.stopAutoplay();
    const delay = this.settings.autoplayDelay || 5000;
    if (delay > 0) {
      this.autoplayInterval = setInterval(() => {
        const slideCount = Math.min(Math.max(1, parseInt(this.settings.slideCount) || 5), 8);
        if (this.currentSlide === slideCount - 1) {
          this.goToSlide(0);
        } else {
          this.changeSlide(1);
        }
      }, delay);
    }
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
    
    if (this.wheelHandler) {
      document.removeEventListener('wheel', this.wheelHandler);
    }
    if (this.touchStartHandler) {
      this.removeEventListener('touchstart', this.touchStartHandler);
    }
    if (this.touchEndHandler) {
      this.removeEventListener('touchend', this.touchEndHandler);
    }
  }
}

customElements.define('product-journey-slider', ProductJourneySlider);
