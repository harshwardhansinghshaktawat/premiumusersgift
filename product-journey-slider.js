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
          min-height: 500px;
          font-family: ${s.bodyFont}, sans-serif;
          position: relative;
          overflow: hidden;
        }

        .slider-container {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 500px;
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
          padding: 60px 40px 100px 40px;
        }

        .slide.active {
          opacity: 1;
          visibility: visible;
          z-index: 1;
        }

        .slide-content {
          width: 100%;
          max-width: 1400px;
          height: 100%;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: center;
        }

        .text-content {
          display: flex;
          flex-direction: column;
          justify-content: center;
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
          width: 100px;
          height: 2px;
          background: linear-gradient(90deg, ${s.accentCyan}, transparent);
          margin-bottom: 30px;
          opacity: 0;
          transform: translateX(-50px);
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .slide.active .accent-line {
          opacity: 1;
          transform: translateX(0);
          transition-delay: 0.8s;
        }

        .slide-number {
          font-family: ${s.numberFont}, sans-serif;
          font-size: clamp(40px, 8vw, 120px);
          line-height: 1;
          background: linear-gradient(135deg, ${s.accentCyan}, ${s.accentPurple});
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 20px;
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .slide.active .slide-number {
          opacity: 1;
          transform: translateY(0);
          transition-delay: 0.4s;
        }

        .stage-label {
          font-family: ${s.labelFont}, sans-serif;
          font-size: clamp(30px, 6vw, 80px);
          line-height: 1.1;
          margin-bottom: 10px;
          letter-spacing: 2px;
          color: ${s.textPrimary};
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .slide.active .stage-label {
          opacity: 1;
          transform: translateY(0);
          transition-delay: 0.5s;
        }

        .tagline {
          font-size: clamp(11px, 1.2vw, 16px);
          font-weight: 300;
          color: ${s.textSecondary};
          text-transform: uppercase;
          letter-spacing: 4px;
          margin-bottom: 30px;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .slide.active .tagline {
          opacity: 1;
          transform: translateY(0);
          transition-delay: 0.6s;
        }

        .description {
          font-size: clamp(13px, 1.4vw, 18px);
          line-height: 1.8;
          color: ${s.textSecondary};
          max-width: 500px;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
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
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 40px 80px rgba(0, 0, 0, 0.5);
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
          right: 40px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 100;
        }

        .nav-item {
          position: relative;
          display: flex;
          align-items: center;
          margin: 25px 0;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .nav-dot {
          width: 12px;
          height: 12px;
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
          width: 24px;
          height: 24px;
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
          right: 25px;
          white-space: nowrap;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 2px;
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
          bottom: 40px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 30px;
          z-index: 100;
        }

        .control-btn {
          position: relative;
          width: 70px;
          height: 70px;
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
          box-shadow: 0 10px 40px rgba(0, 217, 255, 0.3);
        }

        .control-btn:active {
          transform: scale(0.95);
        }

        .control-btn svg {
          width: 24px;
          height: 24px;
          transition: transform 0.3s ease;
        }

        .control-btn:hover svg {
          transform: scale(1.2);
        }

        /* Responsive Breakpoints */
        @media (max-width: 1024px) {
          .slide-content {
            grid-template-columns: 1fr;
            gap: 40px;
          }

          .slide {
            padding: 50px 30px 100px 30px;
          }

          .text-content {
            text-align: center;
            transform: none !important;
          }

          .image-content {
            transform: none !important;
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
          }

          .navigation {
            right: 20px;
          }
        }

        @media (max-width: 768px) {
          .slide {
            padding: 40px 20px 90px 20px;
          }

          .slide-content {
            gap: 30px;
          }

          .navigation {
            right: 15px;
          }

          .nav-item {
            margin: 20px 0;
          }

          .controls {
            bottom: 30px;
            gap: 25px;
          }

          .control-btn {
            width: 60px;
            height: 60px;
          }

          .control-btn svg {
            width: 20px;
            height: 20px;
          }
        }

        @media (max-width: 480px) {
          .slide {
            padding: 30px 15px 80px 15px;
          }

          .slide-content {
            gap: 25px;
          }

          .navigation {
            right: 10px;
          }

          .controls {
            bottom: 20px;
            gap: 20px;
          }

          .control-btn {
            width: 50px;
            height: 50px;
          }

          .control-btn svg {
            width: 18px;
            height: 18px;
          }

          .nav-dot {
            width: 10px;
            height: 10px;
          }

          .nav-item.active .nav-dot::before {
            width: 20px;
            height: 20px;
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
      window.removeEventListener('wheel', this.wheelHandler);
    }

    this.wheelHandler = (e) => {
      // Only handle scroll when element is in viewport
      const rect = this.getBoundingClientRect();
      const isInView = rect.top <= window.innerHeight && rect.bottom >= 0;
      
      if (!isInView) return;

      // If scrolling down on last slide, allow normal scroll to continue
      if (this.currentSlide === slideCount - 1 && e.deltaY > 0) {
        return; // Don't preventDefault, let page scroll continue
      }

      // If scrolling up on first slide, allow normal scroll to continue
      if (this.currentSlide === 0 && e.deltaY < 0) {
        return; // Don't preventDefault, let page scroll continue
      }

      // Otherwise, prevent default scroll and change slides
      if (this.isScrolling) return;

      e.preventDefault();
      
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

    window.addEventListener('wheel', this.wheelHandler, { passive: false });
  }

  setupTouchNavigation() {
    // Remove old listeners if exist
    if (this.touchStartHandler) {
      window.removeEventListener('touchstart', this.touchStartHandler);
    }
    if (this.touchEndHandler) {
      window.removeEventListener('touchend', this.touchEndHandler);
    }

    this.touchStartHandler = (e) => {
      const rect = this.getBoundingClientRect();
      const isInView = rect.top <= window.innerHeight && rect.bottom >= 0;
      
      if (!isInView) return;

      this.touchStartY = e.changedTouches[0].screenY;
    };

    this.touchEndHandler = (e) => {
      const rect = this.getBoundingClientRect();
      const isInView = rect.top <= window.innerHeight && rect.bottom >= 0;
      
      if (!isInView) return;

      this.touchEndY = e.changedTouches[0].screenY;
      this.handleSwipe();
    };

    window.addEventListener('touchstart', this.touchStartHandler);
    window.addEventListener('touchend', this.touchEndHandler);
  }

  handleSwipe() {
    const slideCount = Math.min(Math.max(1, parseInt(this.settings.slideCount) || 5), 8);
    const swipeThreshold = 50;

    // Swipe up (next slide)
    if (this.touchStartY - this.touchEndY > swipeThreshold) {
      // If on last slide, don't prevent - let page scroll
      if (this.currentSlide === slideCount - 1) {
        return;
      }
      this.changeSlide(1);
    }

    // Swipe down (previous slide)
    if (this.touchEndY - this.touchStartY > swipeThreshold) {
      // If on first slide, don't prevent - let page scroll
      if (this.currentSlide === 0) {
        return;
      }
      this.changeSlide(-1);
    }
  }

  changeSlide(direction) {
    if (this.isTransitioning) return;
    
    const slideCount = Math.min(Math.max(1, parseInt(this.settings.slideCount) || 5), 8);
    let newSlide = this.currentSlide + direction;

    // Clamp to valid range (don't loop)
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
        // Loop back to first slide when autoplay reaches the end
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
    
    // Remove event listeners
    if (this.wheelHandler) {
      window.removeEventListener('wheel', this.wheelHandler);
    }
    if (this.touchStartHandler) {
      window.removeEventListener('touchstart', this.touchStartHandler);
    }
    if (this.touchEndHandler) {
      window.removeEventListener('touchend', this.touchEndHandler);
    }
  }
}

customElements.define('product-journey-slider', ProductJourneySlider);
