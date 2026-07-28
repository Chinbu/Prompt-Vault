/* ========================================
   PROMPT VAULT - Main Application (Mobile Ad Fixed)
   ======================================== */

// Supabase Client
const supabase = window.supabase.createClient(
    CONFIG.supabase.url,
    CONFIG.supabase.anonKey
);

// Telegram Mini App
const tg = window.Telegram?.WebApp;
if (tg) {
    tg.ready();
    tg.expand();
}

// Detect mobile
const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;

// State
const state = {
    prompts: [],
    categories: [],
    currentTab: 'home',
    currentCategory: null,
    searchQuery: '',
    unlockedPrompts: new Set(),
    viewedPrompts: new Set(),
    theme: localStorage.getItem('theme') || 'light',
    adInProgress: false,
    adTimer: null,
    adWatchCount: 0,
    isAdWatching: false,
    isMobile: isMobile,
    monetagReady: false,
    adRetryCount: 0,
    maxAdRetries: 3,
};

// DOM References
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const elements = {
    canvas: $('#particleCanvas'),
    themeToggle: $('#themeToggle'),
    searchToggle: $('#searchToggle'),
    searchContainer: $('#searchContainer'),
    searchInput: $('#searchInput'),
    clearSearch: $('#clearSearch'),
    navTabs: $$('.nav-tab'),
    categoryChips: $('#categoryChips'),
    promptsGrid: $('#promptsGrid'),
    promptModal: $('#promptModal'),
    modalBody: $('#modalBody'),
    modalClose: $('#modalClose'),
    pageModal: $('#pageModal'),
    pageContent: $('#pageContent'),
    pageModalClose: $('#pageModalClose'),
    toast: $('#toast'),
    floatingTelegram: $('#floatingTelegram'),
    adOverlay: $('#adOverlay'),
    adProgress: $('#adProgress'),
    adTimer: $('#adTimer'),
    adSkipBtn: $('#adSkipBtn'),
    adRetryBtn: $('#adRetryBtn'),
    adMessage: $('#adMessage'),
};

// ========================================
// Data Service
// ========================================
class DataService {
    static async getPrompts(options = {}) {
        let query = supabase
            .from('prompts')
            .select(`
                *,
                categories (
                    id,
                    name
                )
            `)
            .eq('status', 'published');
        
        if (options.category) {
            query = query.eq('category_id', options.category);
        }
        
        if (options.featured) {
            query = query.eq('featured', true);
        }
        
        if (options.search) {
            query = query.or(`title.ilike.%${options.search}%,short_description.ilike.%${options.search}%`);
        }
        
        if (options.sortBy === 'views') {
            query = query.order('views', { ascending: false });
        } else if (options.sortBy === 'copies') {
            query = query.order('copies', { ascending: false });
        } else {
            query = query.order('created_at', { ascending: false });
        }
        
        const { data, error } = await query;
        if (error) {
            console.error('❌ Error in getPrompts:', error);
            throw error;
        }
        return data;
    }
    
    static async getCategories() {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('name');
        if (error) {
            console.error('❌ Error in getCategories:', error);
            throw error;
        }
        return data;
    }
    
    static async incrementView(promptId) {
        try {
            const { error } = await supabase.rpc('increment_prompt_view', { prompt_id: promptId });
            if (error) {
                const { data } = await supabase
                    .from('prompts')
                    .select('views')
                    .eq('id', promptId)
                    .single();
                await supabase
                    .from('prompts')
                    .update({ views: (data?.views || 0) + 1 })
                    .eq('id', promptId);
            }
        } catch (error) {
            console.error('Error incrementing view:', error);
        }
    }
    
    static async incrementCopy(promptId) {
        try {
            const { error } = await supabase.rpc('increment_prompt_copy', { prompt_id: promptId });
            if (error) {
                const { data } = await supabase
                    .from('prompts')
                    .select('copies')
                    .eq('id', promptId)
                    .single();
                await supabase
                    .from('prompts')
                    .update({ copies: (data?.copies || 0) + 1 })
                    .eq('id', promptId);
            }
        } catch (error) {
            console.error('Error incrementing copy:', error);
        }
    }
    
    static async getPromptById(id) {
        const { data, error } = await supabase
            .from('prompts')
            .select(`
                *,
                categories (
                    id,
                    name
                )
            `)
            .eq('id', id)
            .single();
        if (error) {
            console.error('❌ Error in getPromptById:', error);
            throw error;
        }
        return data;
    }
}

// ========================================
// Toast System
// ========================================
class Toast {
    constructor(element) {
        this.element = element;
        this.timeout = null;
    }
    
    show(message, type = 'info', duration = 3000) {
        this.element.textContent = message;
        this.element.className = `toast ${type}`;
        this.element.classList.add('show');
        clearTimeout(this.timeout);
        this.timeout = setTimeout(() => {
            this.element.classList.remove('show');
        }, duration);
    }
}

// ========================================
// Theme Manager
// ========================================
class ThemeManager {
    constructor() {
        this.currentTheme = state.theme;
        this.applyTheme(this.currentTheme);
        this.setupToggle();
        this.detectSystemTheme();
    }
    
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.currentTheme = theme;
        localStorage.setItem('theme', theme);
        const icon = elements.themeToggle.querySelector('i');
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
    
    toggle() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
    }
    
    setupToggle() {
        elements.themeToggle.addEventListener('click', () => this.toggle());
    }
    
    detectSystemTheme() {
        if (!localStorage.getItem('theme')) {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.applyTheme(prefersDark ? 'dark' : 'light');
        }
    }
}

// ========================================
// Ad Manager - Mobile Optimized
// ========================================
class AdManager {
    constructor() {
        this.isReady = false;
        this.adInProgress = false;
        this.lastAdTime = 0;
        this.adCooldown = CONFIG.app.adCooldown || 30000;
        this.isMobile = state.isMobile;
        this.retryCount = 0;
        this.maxRetries = 5;
        this.callback = null;
        this.adShown = false;
        this.initAd();
        this.setupAutoAds();
    }
    
    initAd() {
        console.log('📢 Initializing Ad Manager...');
        console.log('📱 Is Mobile:', this.isMobile);
        console.log('🌐 User Agent:', navigator.userAgent);
        
        // Check if Monetag is already loaded
        if (typeof show_11417937 === 'function') {
            this.isReady = true;
            state.monetagReady = true;
            console.log('✅ Monetag SDK already loaded');
            this.testAd();
            return;
        }
        
        // Check if window.monetagReady is set
        if (window.monetagReady && typeof show_11417937 === 'function') {
            this.isReady = true;
            state.monetagReady = true;
            console.log('✅ Monetag SDK ready via window variable');
            this.testAd();
            return;
        }
        
        // Try to load SDK
        console.log('🔄 Loading Monetag SDK...');
        this.loadSDK();
        
        // Also check again after a delay
        setTimeout(() => {
            if (typeof show_11417937 === 'function') {
                this.isReady = true;
                state.monetagReady = true;
                console.log('✅ Monetag SDK loaded after delay check');
                this.testAd();
            }
        }, 3000);
    }
    
    loadSDK() {
        if (this.retryCount >= this.maxRetries) {
            console.warn('⚠️ Monetag SDK failed to load after', this.maxRetries, 'attempts');
            return;
        }
        
        this.retryCount++;
        console.log('🔄 Attempting to load Monetag SDK (attempt', this.retryCount, ')');
        
        // Remove existing script
        const existingScript = document.querySelector('script[data-zone="11417937"]');
        if (existingScript) {
            existingScript.remove();
        }
        
        // Create new script with proper attributes
        const script = document.createElement('script');
        script.src = '//libtl.com/sdk.js';
        script.setAttribute('data-zone', '11417937');
        script.setAttribute('data-sdk', 'show_11417937');
        script.async = true;
        script.crossOrigin = 'anonymous';
        
        script.onload = () => {
            console.log('✅ Monetag SDK script loaded');
            setTimeout(() => {
                if (typeof show_11417937 === 'function') {
                    this.isReady = true;
                    state.monetagReady = true;
                    console.log('✅ Monetag SDK ready after load');
                    this.testAd();
                } else {
                    console.warn('⚠️ show_11417937 not available after script load');
                    // Try again
                    if (this.retryCount < this.maxRetries) {
                        setTimeout(() => this.loadSDK(), 2000);
                    }
                }
            }, 500);
        };
        
        script.onerror = () => {
            console.warn('⚠️ Failed to load Monetag SDK, retrying...');
            if (this.retryCount < this.maxRetries) {
                setTimeout(() => this.loadSDK(), 2000);
            }
        };
        
        document.head.appendChild(script);
    }
    
    testAd() {
        if (!this.isReady) return;
        
        try {
            // Test if ads work on mobile
            const settings = CONFIG.monetag.adSettings;
            show_11417937({
                type: 'inApp',
                inAppSettings: settings
            }).then(() => {
                console.log('✅ Test ad successful');
            }).catch((e) => {
                console.warn('⚠️ Test ad failed:', e.message || e);
            });
        } catch (e) {
            console.warn('⚠️ Test ad error:', e.message || e);
        }
    }
    
    setupAutoAds() {
        // Auto ad every 2 minutes
        setInterval(() => {
            this.showAutoAd();
        }, CONFIG.app.autoAdInterval || 120000);
        
        // On mobile, also show ad on scroll to bottom
        if (this.isMobile) {
            let scrollTimeout;
            let lastScrollCheck = 0;
            window.addEventListener('scroll', () => {
                const now = Date.now();
                if (now - lastScrollCheck < 5000) return;
                lastScrollCheck = now;
                
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    if (this.isNearBottom()) {
                        this.showAutoAd();
                    }
                }, 1000);
            });
        }
    }
    
    isNearBottom() {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        return (scrollTop + windowHeight) >= (documentHeight - 300);
    }
    
    async showAutoAd() {
        const now = Date.now();
        if (now - this.lastAdTime < this.adCooldown || this.adInProgress) {
            return;
        }
        
        // Check if ad is available
        if (typeof show_11417937 !== 'function') {
            console.warn('⚠️ Monetag not available for auto ad');
            this.loadSDK();
            return;
        }
        
        try {
            this.adInProgress = true;
            console.log('📢 Showing auto ad...');
            
            const settings = CONFIG.monetag.adSettings;
            await show_11417937({
                type: 'inApp',
                inAppSettings: settings
            });
            
            this.lastAdTime = Date.now();
            if (window.app?.toast) {
                window.app.toast.show('Thanks for watching!', 'success');
            }
            console.log('✅ Auto ad completed');
        } catch (error) {
            console.error('Auto ad error:', error);
            // Try to reload SDK on error
            if (this.retryCount < this.maxRetries) {
                this.loadSDK();
            }
        } finally {
            this.adInProgress = false;
        }
    }
    
    async showRewardedAd() {
        return new Promise(async (resolve) => {
            try {
                this.adInProgress = true;
                this.lastAdTime = Date.now();
                this.callback = resolve;
                
                // Try to ensure SDK is loaded
                if (typeof show_11417937 !== 'function') {
                    console.warn('⚠️ Monetag not available, attempting to load...');
                    await this.waitForSDK();
                }
                
                if (typeof show_11417937 === 'function') {
                    console.log('📢 Showing rewarded ad...');
                    await show_11417937();
                    resolve(true);
                } else {
                    console.warn('⚠️ Monetag still not available, using fallback');
                    this.showFakeAd(resolve);
                }
            } catch (error) {
                console.error('Rewarded ad error:', error);
                this.showFakeAd(resolve);
            } finally {
                this.adInProgress = false;
            }
        });
    }
    
    waitForSDK() {
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 10;
            const checkInterval = setInterval(() => {
                attempts++;
                if (typeof show_11417937 === 'function') {
                    clearInterval(checkInterval);
                    resolve(true);
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    resolve(false);
                }
            }, 500);
            
            // Also try loading again
            this.loadSDK();
        });
    }
    
    showFakeAd(callback) {
        const overlay = elements.adOverlay;
        const progress = elements.adProgress;
        const timer = elements.adTimer;
        const skipBtn = elements.adSkipBtn;
        const retryBtn = elements.adRetryBtn;
        const message = elements.adMessage;
        
        // Reset UI
        overlay.classList.add('active');
        progress.style.width = '0%';
        timer.textContent = '0s';
        retryBtn.style.display = 'none';
        message.textContent = 'Please watch this short ad to access the full prompt.';
        skipBtn.style.display = 'block';
        
        let elapsed = 0;
        const duration = this.isMobile ? 3 : 5;
        let interval = setInterval(() => {
            elapsed++;
            const percent = (elapsed / duration) * 100;
            progress.style.width = Math.min(percent, 100) + '%';
            timer.textContent = `${elapsed}s`;
            
            if (elapsed >= duration) {
                clearInterval(interval);
                overlay.classList.remove('active');
                callback(true);
            }
        }, 1000);
        
        // Skip button
        skipBtn.onclick = () => {
            clearInterval(interval);
            overlay.classList.remove('active');
            callback(true);
        };
        
        // Auto-close after duration + buffer
        setTimeout(() => {
            if (overlay.classList.contains('active')) {
                clearInterval(interval);
                overlay.classList.remove('active');
                callback(true);
            }
        }, (duration + 3) * 1000);
    }
}

// ========================================
// Particle Background
// ========================================
class ParticleBackground {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.resize();
        this.initParticles();
        this.animate();
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    initParticles() {
        const isMobile = window.innerWidth < 768;
        const count = isMobile ? 25 : 50;
        this.particles = [];
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * (isMobile ? 1.5 : 2.5) + 0.5,
                speedX: (Math.random() - 0.5) * (isMobile ? 0.15 : 0.3),
                speedY: (Math.random() - 0.5) * (isMobile ? 0.15 : 0.3) - 0.05,
                opacity: Math.random() * 0.3 + 0.1,
                color: this.getRandomColor(),
                life: Math.random() * 100 + 50,
            });
        }
    }
    
    getRandomColor() {
        const colors = ['108, 92, 231', '0, 206, 201', '253, 121, 168', '255, 159, 67', '72, 219, 251'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.particles.forEach(p => {
            p.x += p.speedX;
            p.y += p.speedY;
            p.life -= 0.1;
            
            if (p.life <= 0 || p.x < 0 || p.x > this.canvas.width || p.y < 0 || p.y > this.canvas.height) {
                p.x = Math.random() * this.canvas.width;
                p.y = -10;
                p.life = Math.random() * 100 + 50;
                p.speedX = (Math.random() - 0.5) * (window.innerWidth < 768 ? 0.15 : 0.3);
                p.speedY = (Math.random() * 0.15 + 0.05);
                p.size = Math.random() * (window.innerWidth < 768 ? 1.5 : 2.5) + 0.5;
                p.color = this.getRandomColor();
            }
            
            const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
            gradient.addColorStop(0, `rgba(${p.color}, ${p.opacity})`);
            gradient.addColorStop(1, `rgba(${p.color}, 0)`);
            
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
            
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(${p.color}, ${p.opacity * 0.8})`;
            this.ctx.fill();
        });
        requestAnimationFrame(() => this.animate());
    }
}

// ========================================
// Main Application
// ========================================
class AppController {
    constructor() {
        this.theme = new ThemeManager();
        this.toast = new Toast(elements.toast);
        this.adManager = new AdManager();
        this.particles = new ParticleBackground(elements.canvas);
        this.init();
    }
    
    async init() {
        this.setupEventListeners();
        await this.loadCategories();
        await this.loadPrompts();
        console.log('🚀 Prompt Vault initialized');
        console.log('📱 Mobile mode:', state.isMobile);
        console.log('📢 Monetag ready:', state.monetagReady);
    }
    
    setupEventListeners() {
        // Search
        elements.searchToggle.addEventListener('click', () => {
            elements.searchContainer.classList.toggle('active');
            if (elements.searchContainer.classList.contains('active')) {
                elements.searchInput.focus();
            }
        });
        
        elements.searchInput.addEventListener('input', (e) => {
            state.searchQuery = e.target.value;
            elements.clearSearch.classList.toggle('visible', e.target.value.length > 0);
            this.loadPrompts();
        });
        
        elements.clearSearch.addEventListener('click', () => {
            elements.searchInput.value = '';
            state.searchQuery = '';
            elements.clearSearch.classList.remove('visible');
            this.loadPrompts();
        });
        
        // Navigation
        elements.navTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                elements.navTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                state.currentTab = tab.dataset.tab;
                state.currentCategory = null;
                document.querySelectorAll('.chip.active').forEach(c => c.classList.remove('active'));
                this.loadPrompts();
            });
        });
        
        // Prompt Modal
        elements.modalClose.addEventListener('click', () => {
            elements.promptModal.classList.remove('active');
        });
        
        elements.promptModal.addEventListener('click', (e) => {
            if (e.target === elements.promptModal) {
                elements.promptModal.classList.remove('active');
            }
        });
        
        // Page Modal
        elements.pageModalClose.addEventListener('click', () => {
            elements.pageModal.classList.remove('active');
        });
        
        elements.pageModal.addEventListener('click', (e) => {
            if (e.target === elements.pageModal) {
                elements.pageModal.classList.remove('active');
            }
        });
        
        // Page Links
        document.querySelectorAll('.footer-links a[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                this.openPage(page);
            });
        });
        
        // Telegram Floating Button
        elements.floatingTelegram.addEventListener('click', () => {
            window.open(CONFIG.social.telegramGroup, '_blank');
        });
    }
    
    openPage(pageKey) {
        const pageData = CONFIG.pages[pageKey];
        if (!pageData) {
            this.toast.show('Page not found', 'error');
            return;
        }
        
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#e8e8ff' : '#1a1a2e';
        const bgColor = isDark ? '#14142e' : '#ffffff';
        const borderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
        
        let content = pageData.content;
        if (pageKey === 'contact') {
            content = content.replace(
                /<a href="(https:\/\/t\.me\/[^"]+)"[^>]*>/g,
                '<a href="$1" target="_blank" style="display:inline-block; background:linear-gradient(135deg, #0088cc, #00a2e8); color:#ffffff; padding:10px 20px; border-radius:50px; text-decoration:none; font-weight:600; margin-top:8px; transition:all 0.3s ease;" onmouseover="this.style.transform=\'scale(1.05)\'" onmouseout="this.style.transform=\'scale(1)\'">'
            );
        }
        
        elements.pageContent.innerHTML = `
            <div style="
                padding: 8px 4px 20px;
                color: ${textColor};
                font-size: 15px;
                line-height: 1.8;
            ">
                <div style="
                    font-size: 22px;
                    font-weight: 700;
                    margin-bottom: 16px;
                    background: linear-gradient(135deg, #6c5ce7, #00cec9);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                ">${pageData.title}</div>
                <div style="
                    background: ${bgColor};
                    border-radius: 12px;
                    padding: 16px;
                    border: 1px solid ${borderColor};
                ">
                    ${content}
                </div>
                <div style="
                    margin-top: 16px;
                    text-align: center;
                    font-size: 13px;
                    color: var(--text-muted);
                    opacity: 0.7;
                ">
                    <i class="fas fa-arrow-left"></i> Tap outside to close
                </div>
            </div>
        `;
        
        elements.pageModal.classList.add('active');
    }
    
    // ========================================
    // CATEGORIES
    // ========================================
    async loadCategories() {
        try {
            const categories = await DataService.getCategories();
            
            if (categories && categories.length > 0) {
                state.categories = categories;
                console.log('✅ Categories loaded:', categories.length);
            } else {
                console.warn('⚠️ No categories in database, using defaults');
                state.categories = CONFIG.categories.map(cat => ({
                    id: cat.id,
                    name: cat.name
                }));
            }
            this.renderCategories();
        } catch (error) {
            console.error('❌ Error loading categories:', error);
            state.categories = CONFIG.categories.map(cat => ({
                id: cat.id,
                name: cat.name
            }));
            this.renderCategories();
            this.toast.show('Using default categories', 'info');
        }
    }
    
    renderCategories() {
        const container = elements.categoryChips;
        container.innerHTML = '';
        
        const allChip = document.createElement('button');
        allChip.className = 'chip active';
        allChip.dataset.category = 'all';
        allChip.textContent = 'All';
        allChip.addEventListener('click', () => {
            document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            allChip.classList.add('active');
            state.currentCategory = null;
            this.loadPrompts();
        });
        container.appendChild(allChip);
        
        if (state.categories && state.categories.length > 0) {
            state.categories.forEach(cat => {
                const chip = document.createElement('button');
                chip.className = 'chip';
                chip.dataset.category = cat.id;
                const displayName = cat.name.split(' ').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ');
                chip.textContent = displayName;
                chip.addEventListener('click', () => {
                    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
                    chip.classList.add('active');
                    state.currentCategory = cat.id;
                    this.loadPrompts();
                });
                container.appendChild(chip);
            });
        } else {
            container.innerHTML = '<div class="chip-loading">No categories available</div>';
        }
    }
    
    // ========================================
    // PROMPTS
    // ========================================
    async loadPrompts() {
        elements.promptsGrid.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading prompts...</p>
            </div>
        `;
        
        try {
            const options = { search: state.searchQuery };
            
            if (state.currentCategory && state.currentCategory !== 'all') {
                options.category = state.currentCategory;
            }
            
            if (state.currentTab === 'trending') {
                options.sortBy = 'views';
            } else if (state.currentTab === 'featured') {
                options.featured = true;
            }
            
            const prompts = await DataService.getPrompts(options);
            state.prompts = prompts;
            this.renderPrompts(prompts);
        } catch (error) {
            console.error('Error loading prompts:', error);
            this.renderPrompts([]);
            this.toast.show('Error loading prompts', 'error');
        }
    }
    
    renderPrompts(prompts) {
        const container = elements.promptsGrid;
        
        if (!prompts || prompts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>No prompts found</h3>
                    <p>Try adjusting your search or filters.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = '';
        
        prompts.forEach((prompt, index) => {
            const card = document.createElement('div');
            card.className = 'prompt-card';
            card.style.animationDelay = `${index * 0.05}s`;
            
            const categoryName = prompt.categories?.name || 'Uncategorized';
            const displayCategory = categoryName.split(' ').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
            
            card.innerHTML = `
                <div class="prompt-thumbnail">
                    ${prompt.thumbnail ? `<img src="${prompt.thumbnail}" alt="${prompt.title}" loading="lazy">` : `
                        <div class="thumbnail-placeholder">
                            <i class="fas fa-image"></i>
                        </div>
                    `}
                    ${prompt.featured ? '<span class="prompt-badge featured"><i class="fas fa-star"></i> Featured</span>' : ''}
                </div>
                <div class="prompt-category">${displayCategory}</div>
                <div class="prompt-title">${this.escapeHtml(prompt.title)}</div>
                <div class="prompt-description">${this.escapeHtml(prompt.short_description || '')}</div>
                <div class="prompt-stats">
                    <span><i class="fas fa-eye"></i> ${prompt.views || 0}</span>
                    <span><i class="fas fa-copy"></i> ${prompt.copies || 0}</span>
                </div>
            `;
            
            card.addEventListener('click', () => {
                this.openPromptModal(prompt.id);
            });
            
            container.appendChild(card);
        });
    }
    
    // ========================================
    // PROMPT MODAL
    // ========================================
    async openPromptModal(promptId) {
        try {
            const prompt = await DataService.getPromptById(promptId);
            if (!prompt) {
                this.toast.show('Prompt not found', 'error');
                return;
            }
            
            if (!state.viewedPrompts.has(promptId)) {
                state.viewedPrompts.add(promptId);
                await DataService.incrementView(promptId);
                prompt.views = (prompt.views || 0) + 1;
            }
            
            const isUnlocked = state.unlockedPrompts.has(promptId);
            const categoryName = prompt.categories?.name || 'Uncategorized';
            const displayCategory = categoryName.split(' ').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
            
            elements.modalBody.innerHTML = `
                <div class="modal-prompt-thumbnail">
                    ${prompt.thumbnail ? `<img src="${prompt.thumbnail}" alt="${prompt.title}" loading="lazy">` : `
                        <div class="thumbnail-placeholder" style="height:100%;">
                            <i class="fas fa-image"></i>
                        </div>
                    `}
                </div>
                <div class="modal-prompt-title">${this.escapeHtml(prompt.title)}</div>
                <div class="modal-prompt-category">${displayCategory}</div>
                <div class="modal-prompt-description">${this.escapeHtml(prompt.short_description || '')}</div>
                
                <div class="modal-prompt-content ${isUnlocked ? '' : 'locked'}">
                    ${isUnlocked ? this.escapeHtml(prompt.prompt) : 'masterpiece, best quality, 1girl, cyberpunk...'}
                    ${!isUnlocked ? `
                        <div class="lock-overlay">
                            <i class="fas fa-lock"></i>
                            <span>Watch ad to unlock</span>
                        </div>
                    ` : ''}
                </div>
                
                <div class="modal-actions">
                    ${!isUnlocked ? `
                        <button class="btn btn-primary" id="unlockPromptBtn">
                            <i class="fas fa-play"></i> Watch Ad to Unlock
                        </button>
                    ` : `
                        <button class="btn btn-success" id="copyPromptBtn">
                            <i class="fas fa-copy"></i> Copy Prompt
                        </button>
                    `}
                    <button class="btn btn-secondary" id="closeModalBtn">
                        <i class="fas fa-times"></i> Close
                    </button>
                </div>
            `;
            
            elements.promptModal.classList.add('active');
            
            const unlockBtn = document.getElementById('unlockPromptBtn');
            if (unlockBtn) {
                unlockBtn.addEventListener('click', () => {
                    this.handleUnlockPrompt(prompt);
                });
            }
            
            const copyBtn = document.getElementById('copyPromptBtn');
            if (copyBtn) {
                copyBtn.addEventListener('click', () => {
                    this.handleCopyPrompt(prompt);
                });
            }
            
            document.getElementById('closeModalBtn').addEventListener('click', () => {
                elements.promptModal.classList.remove('active');
            });
            
        } catch (error) {
            console.error('Error opening prompt:', error);
            this.toast.show('Error loading prompt details', 'error');
        }
    }
    
    async handleUnlockPrompt(prompt) {
        if (state.isAdWatching) {
            this.toast.show('Ad is already playing', 'info');
            return;
        }
        
        state.isAdWatching = true;
        
        try {
            const success = await this.adManager.showRewardedAd();
            
            if (success) {
                state.unlockedPrompts.add(prompt.id);
                this.toast.show('🎉 Prompt unlocked!', 'success');
                await this.openPromptModal(prompt.id);
            } else {
                this.toast.show('Ad failed. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Ad error:', error);
            this.toast.show('Error showing ad. Please try again.', 'error');
        } finally {
            state.isAdWatching = false;
        }
    }
    
    handleCopyPrompt(prompt) {
        if (!state.unlockedPrompts.has(prompt.id)) {
            this.toast.show('Please unlock the prompt first', 'error');
            return;
        }
        
        navigator.clipboard.writeText(prompt.prompt).then(() => {
            this.toast.show('📋 Prompt copied!', 'success');
            DataService.incrementCopy(prompt.id);
            prompt.copies = (prompt.copies || 0) + 1;
        }).catch(() => {
            const textarea = document.createElement('textarea');
            textarea.value = prompt.prompt;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            this.toast.show('📋 Prompt copied!', 'success');
            DataService.incrementCopy(prompt.id);
        });
    }
    
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// ========================================
// INITIALIZE
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    const app = new AppController();
    window.app = app;
    console.log('🚀 Prompt Vault initialized');
});
