/* ========================================
   PROMPT VAULT - Main Application
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
    webviewModal: $('#webviewModal'),
    webviewIframe: $('#webviewIframe'),
    webviewClose: $('#webviewClose'),
    toast: $('#toast'),
    floatingTelegram: $('#floatingTelegram'),
    adOverlay: $('#adOverlay'),
    adProgress: $('#adProgress'),
    adTimer: $('#adTimer'),
    adSkipBtn: $('#adSkipBtn'),
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
// Ad Manager
// ========================================
class AdManager {
    constructor() {
        this.isReady = false;
        this.adInProgress = false;
        this.lastAdTime = 0;
        this.adCooldown = CONFIG.app.adCooldown || 30000;
        this.setupAutoAds();
        this.initAd();
    }
    
    initAd() {
        if (typeof show_11417937 === 'function') {
            this.isReady = true;
            console.log('✅ Monetag SDK loaded');
        } else {
            console.warn('⚠️ Monetag SDK not loaded');
        }
    }
    
    setupAutoAds() {
        setInterval(() => {
            this.showAutoAd();
        }, CONFIG.app.autoAdInterval || 120000);
    }
    
    async showAutoAd() {
        const now = Date.now();
        if (now - this.lastAdTime < this.adCooldown || this.adInProgress) return;
        
        try {
            this.adInProgress = true;
            if (typeof show_11417937 === 'function') {
                await show_11417937({
                    type: 'inApp',
                    inAppSettings: {
                        frequency: 2,
                        capping: 0.1,
                        interval: 30,
                        timeout: 5,
                        everyPage: false
                    }
                });
                this.lastAdTime = Date.now();
                if (window.app?.toast) {
                    window.app.toast.show('Thanks for watching!', 'success');
                }
            }
        } catch (error) {
            console.error('Auto ad error:', error);
        } finally {
            this.adInProgress = false;
        }
    }
    
    async showRewardedAd() {
        return new Promise(async (resolve) => {
            try {
                this.adInProgress = true;
                this.lastAdTime = Date.now();
                
                if (typeof show_11417937 === 'function') {
                    await show_11417937();
                    resolve(true);
                } else {
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
    
    showFakeAd(callback) {
        const overlay = elements.adOverlay;
        const progress = elements.adProgress;
        const timer = elements.adTimer;
        const skipBtn = elements.adSkipBtn;
        
        overlay.classList.add('active');
        progress.style.width = '0%';
        timer.textContent = '0s';
        
        let elapsed = 0;
        const duration = 5;
        const interval = setInterval(() => {
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
        
        skipBtn.onclick = () => {
            clearInterval(interval);
            overlay.classList.remove('active');
            callback(true);
        };
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
        const count = Math.min(60, Math.floor(window.innerWidth / 10));
        this.particles = [];
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2.5 + 0.5,
                speedX: (Math.random() - 0.5) * 0.3,
                speedY: (Math.random() - 0.5) * 0.3 - 0.1,
                opacity: Math.random() * 0.4 + 0.1,
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
                p.speedX = (Math.random() - 0.5) * 0.3;
                p.speedY = (Math.random() * 0.2 + 0.05);
                p.size = Math.random() * 2.5 + 0.5;
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
        
        // Modal
        elements.modalClose.addEventListener('click', () => {
            elements.promptModal.classList.remove('active');
        });
        
        elements.promptModal.addEventListener('click', (e) => {
            if (e.target === elements.promptModal) {
                elements.promptModal.classList.remove('active');
            }
        });
        
        // WebView Modal
        elements.webviewClose.addEventListener('click', () => {
            elements.webviewModal.classList.remove('active');
        });
        
        elements.webviewModal.addEventListener('click', (e) => {
            if (e.target === elements.webviewModal) {
                elements.webviewModal.classList.remove('active');
            }
        });
        
        // ========================================
        // IN-APP LINK HANDLER - FIXED
        // ========================================
        document.querySelectorAll('.footer-links a[data-link]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const key = link.dataset.link;
                const url = CONFIG.links[key];
                if (url) {
                    this.openInApp(url);
                }
            });
        });
        
        // Telegram - Floating Button
        elements.floatingTelegram.addEventListener('click', () => {
            window.open(CONFIG.links.telegramGroup, '_blank');
        });
    }
    
    // ========================================
    // OPEN LINK IN APP (In-App WebView)
    // ========================================
    openInApp(url) {
        // Check if it's a Telegram link
        if (url.includes('t.me')) {
            // Open Telegram links in external browser (Telegram app handles it)
            window.open(url, '_blank');
            return;
        }
        
        // For Telegra.ph and other web links - open in in-app WebView
        const iframe = elements.webviewIframe;
        iframe.src = url;
        elements.webviewModal.classList.add('active');
        
        // Show toast
        this.toast.show('Loading...', 'info', 1500);
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
        
        // All chip
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
        
        // Category chips
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
    // MODAL
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
});