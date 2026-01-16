class ThemeSwitcherElement extends HTMLElement {
    constructor() {
        super();
        this.settings = {
            autoDetect: true,
            lightColors: [
                '#ffffff', '#f8f9fa', '#e9ecef', '#dee2e6', '#212529',
                '#343a40', '#495057', '#6c757d', '#adb5bd', '#ced4da'
            ],
            darkColors: [
                '#1a1a1a', '#2d2d2d', '#1e1e1e', '#404040', '#e9ecef',
                '#d0d0d0', '#b8b8b8', '#a0a0a0', '#606060', '#4a4a4a'
            ],
            currentTheme: 'light'
        };
        this.originalColors = new WeakMap();
        this.defaultTheme = 'light';
        this.observer = null;
    }

    connectedCallback() {
        this.render();
        this.initializeTheme();
        this.setupMutationObserver();
    }

    static get observedAttributes() {
        return ['settings'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (newValue && newValue !== oldValue && name === 'settings') {
            try {
                const newSettings = JSON.parse(newValue);
                Object.assign(this.settings, newSettings);
                console.log('✅ Settings updated');
            } catch (e) {
                console.error('❌ Failed to parse settings:', e);
            }
        }
    }

    render() {
        this.innerHTML = `
            <style>
                theme-switcher {
                    display: flex !important;
                    height: 100% !important;
                    width: 100% !important;
                    justify-content: center !important;
                    align-items: center !important;
                    background: transparent !important;
                }

                .theme-switcher-container {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    padding: 8px 12px;
                    background: transparent;
                    border: 2px solid rgba(102, 126, 234, 0.3);
                    border-radius: 50px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
                    position: relative;
                }

                .theme-icon {
                    font-size: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 28px;
                    height: 28px;
                    user-select: none;
                }

                .toggle-switch {
                    position: relative;
                    width: 56px;
                    height: 28px;
                    display: inline-block;
                    cursor: pointer;
                }

                .toggle-input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                    position: absolute;
                }

                .toggle-slider {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: transparent;
                    border: 2px solid rgba(0, 0, 0, 0.2);
                    border-radius: 30px;
                    transition: all 0.3s ease;
                }

                .toggle-slider::before {
                    content: "";
                    position: absolute;
                    height: 20px;
                    width: 20px;
                    left: 3px;
                    bottom: 2px;
                    background-color: #FFD700;
                    border-radius: 50%;
                    transition: transform 0.3s ease, background-color 0.3s ease;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                }

                .toggle-input:checked + .toggle-slider {
                    border-color: rgba(0, 0, 0, 0.3);
                }

                .toggle-input:checked + .toggle-slider::before {
                    transform: translateX(28px);
                    background-color: #4169E1;
                }

                .auto-badge {
                    position: absolute;
                    top: -8px;
                    right: -8px;
                    background: #2ecc71;
                    color: white;
                    font-size: 8px;
                    font-weight: 700;
                    padding: 2px 6px;
                    border-radius: 8px;
                    box-shadow: 0 2px 6px rgba(46, 204, 113, 0.4);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
            </style>

            <div class="theme-switcher-container">
                ${this.settings.autoDetect ? '<span class="auto-badge">AUTO</span>' : ''}
                
                <span class="theme-icon">☀️</span>
                
                <label class="toggle-switch">
                    <input type="checkbox" class="toggle-input" id="themeToggle">
                    <span class="toggle-slider"></span>
                </label>
                
                <span class="theme-icon">🌙</span>
            </div>
        `;

        this.setupToggleListener();
    }

    setupToggleListener() {
        const toggle = this.querySelector('#themeToggle');
        if (toggle) {
            toggle.addEventListener('change', (e) => {
                const isChecked = e.target.checked;
                this.settings.currentTheme = isChecked ? 'dark' : 'light';
                localStorage.setItem('themePreference', this.settings.currentTheme);
                
                console.log('🎚️ Toggle clicked! New theme:', this.settings.currentTheme);
                
                this.changeTheme();
            });
        }
    }

    setupMutationObserver() {
        this.observer = new MutationObserver((mutations) => {
            const isDefaultTheme = this.settings.currentTheme === this.defaultTheme;
            if (isDefaultTheme) return;
            
            const isDark = this.settings.currentTheme === 'dark';
            
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            this.storeOriginalColorsForElement(node);
                            this.processElement(node, isDark);
                            
                            if (node.shadowRoot) {
                                this.processShadowRoot(node.shadowRoot, isDark);
                            }
                            
                            this.processWixWidgets(node, isDark);
                        }
                    });
                }
            });
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    initializeTheme() {
        const savedTheme = localStorage.getItem('themePreference');
        
        if (savedTheme) {
            this.settings.currentTheme = savedTheme;
            console.log('📁 Loaded saved theme:', savedTheme);
        } else if (this.settings.autoDetect) {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.settings.currentTheme = prefersDark ? 'dark' : 'light';
            console.log('🌐 Using browser preference:', this.settings.currentTheme);
        }
        
        console.log('💾 Storing original colors...');
        this.storeOriginalColors();
        
        const toggle = this.querySelector('#themeToggle');
        if (toggle) {
            toggle.checked = (this.settings.currentTheme === 'dark');
        }
        
        const isDefaultTheme = this.settings.currentTheme === this.defaultTheme;
        if (!isDefaultTheme) {
            console.log('⚡ Applying non-default theme on load');
            this.changeTheme();
        } else {
            console.log('✅ Default theme active - no changes needed');
        }
    }

    storeOriginalColors() {
        const allElements = document.querySelectorAll('*');
        
        allElements.forEach(element => {
            this.storeOriginalColorsForElement(element);
            
            if (element.shadowRoot) {
                const shadowElements = element.shadowRoot.querySelectorAll('*');
                shadowElements.forEach(shadowEl => {
                    this.storeOriginalColorsForElement(shadowEl);
                });
            }
        });

        console.log('✅ Stored original colors for', allElements.length, 'elements');
    }

    storeOriginalColorsForElement(element) {
        if (element.closest('theme-switcher')) return;
        if (this.originalColors.has(element)) return;

        try {
            const computedStyle = window.getComputedStyle(element);
            
            this.originalColors.set(element, {
                backgroundColor: computedStyle.backgroundColor,
                color: computedStyle.color,
                borderTopColor: computedStyle.borderTopColor,
                borderRightColor: computedStyle.borderRightColor,
                borderBottomColor: computedStyle.borderBottomColor,
                borderLeftColor: computedStyle.borderLeftColor,
                fill: computedStyle.fill,
                stroke: computedStyle.stroke,
                backgroundImage: computedStyle.backgroundImage,
                webkitTextFillColor: computedStyle.webkitTextFillColor || computedStyle.getPropertyValue('-webkit-text-fill-color')
            });
        } catch (e) {
            // Element not accessible, skip
        }
    }

    parseColor(colorString) {
        if (!colorString || colorString === 'transparent' || colorString === 'none') {
            return null;
        }

        colorString = colorString.trim().toLowerCase();

        const rgbMatch = colorString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (rgbMatch) {
            return {
                r: parseInt(rgbMatch[1]),
                g: parseInt(rgbMatch[2]),
                b: parseInt(rgbMatch[3]),
                a: rgbMatch[4] ? parseFloat(rgbMatch[4]) : 1
            };
        }

        if (colorString.startsWith('#')) {
            const hex = colorString.replace('#', '');
            const shortHex = hex.length === 3;
            const r = parseInt(shortHex ? hex[0] + hex[0] : hex.substring(0, 2), 16);
            const g = parseInt(shortHex ? hex[1] + hex[1] : hex.substring(2, 4), 16);
            const b = parseInt(shortHex ? hex[2] + hex[2] : hex.substring(4, 6), 16);
            return { r, g, b, a: 1 };
        }

        return null;
    }

    colorDistance(color1, color2) {
        return Math.sqrt(
            Math.pow(color1.r - color2.r, 2) +
            Math.pow(color1.g - color2.g, 2) +
            Math.pow(color1.b - color2.b, 2)
        );
    }

    findClosestColorIndex(targetColor, colorArray) {
        const target = this.parseColor(targetColor);
        if (!target) return -1;

        let minDistance = Infinity;
        let closestIndex = -1;

        colorArray.forEach((color, index) => {
            const parsed = this.parseColor(color);
            if (parsed) {
                const distance = this.colorDistance(target, parsed);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestIndex = index;
                }
            }
        });

        return closestIndex;
    }

    convertColor(colorString, toDark) {
        const parsed = this.parseColor(colorString);
        if (!parsed) return null;

        const sourceColors = toDark ? this.settings.lightColors : this.settings.darkColors;
        const targetColors = toDark ? this.settings.darkColors : this.settings.lightColors;

        const closestIndex = this.findClosestColorIndex(colorString, sourceColors);
        
        if (closestIndex !== -1) {
            const replacementColor = targetColors[closestIndex];
            
            if (parsed.a < 1) {
                const replacementParsed = this.parseColor(replacementColor);
                if (replacementParsed) {
                    return `rgba(${replacementParsed.r}, ${replacementParsed.g}, ${replacementParsed.b}, ${parsed.a})`;
                }
            }
            
            return replacementColor;
        }

        const brightness = (parsed.r * 0.299 + parsed.g * 0.587 + parsed.b * 0.114);
        
        if (toDark) {
            if (brightness > 230) return targetColors[0];
            if (brightness > 200) return targetColors[1];
            if (brightness > 170) return targetColors[2];
            if (brightness > 140) return targetColors[3];
            if (brightness < 100) return targetColors[4];
            return targetColors[5];
        } else {
            if (brightness < 30) return targetColors[0];
            if (brightness < 60) return targetColors[1];
            if (brightness < 90) return targetColors[2];
            if (brightness < 120) return targetColors[3];
            if (brightness > 200) return targetColors[4];
            return targetColors[5];
        }
    }

    convertGradient(gradientString, toDark) {
        if (!gradientString || !gradientString.includes('gradient')) {
            return gradientString;
        }

        let converted = gradientString.replace(/#[0-9a-f]{3,6}/gi, (match) => {
            return this.convertColor(match, toDark) || match;
        });

        converted = converted.replace(/rgba?\([^)]+\)/gi, (match) => {
            return this.convertColor(match, toDark) || match;
        });

        return converted;
    }

    changeTheme() {
        const isDark = this.settings.currentTheme === 'dark';
        const isDefaultTheme = this.settings.currentTheme === this.defaultTheme;
        const colors = isDark ? this.settings.darkColors : this.settings.lightColors;

        console.log(`🎨 Changing to ${isDark ? 'DARK' : 'LIGHT'} mode`);

        const root = document.documentElement;
        
        colors.forEach((color, index) => {
            root.style.setProperty(`--theme-color-${index + 1}`, color);
        });

        root.style.setProperty('--theme-bg', colors[0]);
        root.style.setProperty('--theme-text', colors[4]);
        root.setAttribute('data-theme', this.settings.currentTheme);

        if (isDefaultTheme) {
            document.body.style.backgroundColor = '';
            document.body.style.color = '';
            
            this.restoreOriginalColors();
            this.restoreAllShadowRoots();
        } else {
            document.body.style.backgroundColor = colors[0];
            document.body.style.color = colors[4];
            document.body.style.transition = 'all 0.3s ease';
            
            this.changeAllColors(isDark);
            this.processAllShadowRoots(isDark);
            this.processAllIframes(isDark);
            this.processWixWidgets(document.body, isDark);
        }
    }

    restoreOriginalColors() {
        console.log('🔄 Restoring original colors (removing inline styles)...');
        
        const allElements = document.querySelectorAll('*');
        let restoredCount = 0;

        allElements.forEach(element => {
            if (element.closest('theme-switcher')) return;

            if (this.originalColors.has(element)) {
                try {
                    element.style.backgroundColor = '';
                    element.style.color = '';
                    element.style.borderTopColor = '';
                    element.style.borderRightColor = '';
                    element.style.borderBottomColor = '';
                    element.style.borderLeftColor = '';
                    element.style.fill = '';
                    element.style.stroke = '';
                    element.style.backgroundImage = '';
                    element.style.webkitTextFillColor = '';
                    element.style.webkitBackgroundClip = '';
                    element.style.backgroundClip = '';
                    restoredCount++;
                } catch (e) {
                    // Element not accessible, skip
                }
            }
        });

        console.log(`✅ Restored ${restoredCount} elements by removing inline styles`);
    }

    restoreAllShadowRoots() {
        console.log('👻 Restoring shadow DOMs...');
        
        const allElements = document.querySelectorAll('*');
        
        allElements.forEach(element => {
            if (element.shadowRoot) {
                const shadowElements = element.shadowRoot.querySelectorAll('*');
                shadowElements.forEach(shadowEl => {
                    if (this.originalColors.has(shadowEl)) {
                        try {
                            shadowEl.style.backgroundColor = '';
                            shadowEl.style.color = '';
                            shadowEl.style.borderTopColor = '';
                            shadowEl.style.borderRightColor = '';
                            shadowEl.style.borderBottomColor = '';
                            shadowEl.style.borderLeftColor = '';
                            shadowEl.style.fill = '';
                            shadowEl.style.stroke = '';
                            shadowEl.style.backgroundImage = '';
                            shadowEl.style.webkitTextFillColor = '';
                            shadowEl.style.webkitBackgroundClip = '';
                            shadowEl.style.backgroundClip = '';
                        } catch (e) {
                            // Element not accessible, skip
                        }
                    }
                });
            }
        });
    }

    changeAllColors(toDark) {
        console.log('🔄 Converting to alternate theme...');
        
        const allElements = document.querySelectorAll('*');
        let changedCount = 0;

        allElements.forEach(element => {
            changedCount += this.processElement(element, toDark);
        });

        console.log(`✅ Converted ${changedCount} elements`);
    }

    processElement(element, toDark) {
        if (element.closest('theme-switcher')) return 0;

        const original = this.originalColors.get(element);
        if (!original) {
            this.storeOriginalColorsForElement(element);
            return 0;
        }

        let changed = 0;

        try {
            const newBg = this.convertColor(original.backgroundColor, toDark);
            if (newBg) {
                element.style.backgroundColor = newBg;
                element.style.transition = 'background-color 0.3s ease';
                changed++;
            }

            const newColor = this.convertColor(original.color, toDark);
            if (newColor) {
                element.style.color = newColor;
                element.style.transition = 'color 0.3s ease';
            }

            const newBorderTop = this.convertColor(original.borderTopColor, toDark);
            if (newBorderTop) element.style.borderTopColor = newBorderTop;

            const newBorderRight = this.convertColor(original.borderRightColor, toDark);
            if (newBorderRight) element.style.borderRightColor = newBorderRight;

            const newBorderBottom = this.convertColor(original.borderBottomColor, toDark);
            if (newBorderBottom) element.style.borderBottomColor = newBorderBottom;

            const newBorderLeft = this.convertColor(original.borderLeftColor, toDark);
            if (newBorderLeft) element.style.borderLeftColor = newBorderLeft;

            if (original.fill && original.fill !== 'none') {
                const newFill = this.convertColor(original.fill, toDark);
                if (newFill) element.style.fill = newFill;
            }

            if (original.stroke && original.stroke !== 'none') {
                const newStroke = this.convertColor(original.stroke, toDark);
                if (newStroke) element.style.stroke = newStroke;
            }

            if (original.backgroundImage && original.backgroundImage !== 'none' && original.backgroundImage.includes('gradient')) {
                const newGradient = this.convertGradient(original.backgroundImage, toDark);
                if (newGradient) {
                    element.style.backgroundImage = newGradient;
                }
            }

            if (original.webkitTextFillColor === 'transparent' && original.backgroundImage && original.backgroundImage.includes('gradient')) {
                const newGradient = this.convertGradient(original.backgroundImage, toDark);
                if (newGradient) {
                    element.style.backgroundImage = newGradient;
                    element.style.webkitBackgroundClip = 'text';
                    element.style.backgroundClip = 'text';
                }
            }

        } catch (e) {
            // Element not accessible, skip
        }

        return changed;
    }

    processAllShadowRoots(toDark) {
        console.log('👻 Processing shadow DOMs...');
        
        const allElements = document.querySelectorAll('*');
        let shadowCount = 0;
        
        allElements.forEach(element => {
            if (element.shadowRoot) {
                this.processShadowRoot(element.shadowRoot, toDark);
                shadowCount++;
            }
        });

        console.log(`✅ Processed ${shadowCount} shadow DOMs`);
    }

    processShadowRoot(shadowRoot, toDark) {
        const shadowElements = shadowRoot.querySelectorAll('*');
        
        shadowElements.forEach(element => {
            this.storeOriginalColorsForElement(element);
            this.processElement(element, toDark);
        });

        shadowElements.forEach(element => {
            if (element.shadowRoot) {
                this.processShadowRoot(element.shadowRoot, toDark);
            }
        });
    }

    processAllIframes(toDark) {
        console.log('🖼️ Processing iframes...');
        
        const iframes = document.querySelectorAll('iframe');
        let processedCount = 0;

        iframes.forEach(iframe => {
            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                
                if (iframeDoc) {
                    const iframeElements = iframeDoc.querySelectorAll('*');
                    iframeElements.forEach(element => {
                        this.storeOriginalColorsForElement(element);
                        this.processElement(element, toDark);
                    });
                    processedCount++;
                }
            } catch (e) {
                // Cross-origin iframe, cannot access
            }
        });

        console.log(`✅ Processed ${processedCount} accessible iframes`);
    }

    processWixWidgets(container, toDark) {
        console.log('🎯 Processing Wix widgets...');
        
        const chatSelectors = [
            '[data-hook*="chat"]', '[class*="chat"]', '#SITE_CHAT',
            '[id*="chat"]', '[aria-label*="chat" i]'
        ];
        
        chatSelectors.forEach(selector => {
            try {
                const widgets = container.querySelectorAll(selector);
                widgets.forEach(widget => {
                    this.deepProcessWidget(widget, toDark);
                });
            } catch (e) {
                // Invalid selector, skip
            }
        });

        const dropdownSelectors = [
            '[role="listbox"]', '[role="combobox"]', '[class*="dropdown"]',
            '[class*="select"]', '[class*="currency"]', 'select'
        ];
        
        dropdownSelectors.forEach(selector => {
            try {
                const dropdowns = container.querySelectorAll(selector);
                dropdowns.forEach(dropdown => {
                    this.deepProcessWidget(dropdown, toDark);
                });
            } catch (e) {
                // Invalid selector, skip
            }
        });

        const cartSelectors = [
            '[data-hook*="cart"]', '[class*="cart"]', '#SITE_CART',
            '[id*="cart"]', '[aria-label*="cart" i]'
        ];
        
        cartSelectors.forEach(selector => {
            try {
                const carts = container.querySelectorAll(selector);
                carts.forEach(cart => {
                    this.deepProcessWidget(cart, toDark);
                });
            } catch (e) {
                // Invalid selector, skip
            }
        });
    }

    deepProcessWidget(widget, toDark) {
        this.storeOriginalColorsForElement(widget);
        this.processElement(widget, toDark);
        
        const descendants = widget.querySelectorAll('*');
        descendants.forEach(el => {
            this.storeOriginalColorsForElement(el);
            this.processElement(el, toDark);
        });
        
        if (widget.shadowRoot) {
            this.processShadowRoot(widget.shadowRoot, toDark);
        }
    }

    disconnectedCallback() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }
}

customElements.define('theme-switcher', ThemeSwitcherElement);

export const STYLE = `
    :host {
        display: flex !important;
        height: 100% !important;
        width: 100% !important;
        justify-content: center !important;
        align-items: center !important;
        background: transparent !important;
    }
`;
