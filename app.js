/* ============================================================
   PROMPT VAULT - Complete App (ImgBB Edition)
   ------------------------------------------------------------
   ✅ Cloudinary fully removed
   ✅ ImgBB with 2 API keys — automatic fallback
   ✅ Admin list shows views + copies + date
   ✅ Public prompt text truncated to 9 words + ......
   ✅ Copy button copies FULL prompt
   ✅ All event listeners defensive (no crashes)
   ============================================================ */

// ============================================================
// AD ROTATOR + GATE
// ============================================================
class AdRotator {
    constructor(networks) {
        this.networks = networks || [];
        this.index = 0;
        this.lastOpened = 0;
        this.cooldown = 3000;
    }
    next() {
        if (!this.networks.length) return false;
        const now = Date.now();
        if (now - this.lastOpened < this.cooldown) return false;
        this.lastOpened = now;
        const url1 = this.networks[this.index % this.networks.length];
        this.index++;
        let win = null;
        try { win = window.open(url1, '_blank', 'noopener,noreferrer'); } catch(e) {}
        if (!win) {
            const url2 = this.networks[this.index % this.networks.length];
            this.index++;
            try { win = window.open(url2, '_blank', 'noopener,noreferrer'); } catch(e) {}
        }
        return true;
    }
}

class AdGate {
    constructor(rotator) {
        this.rotator = rotator;
        this.progress = {};
        this.onProgress = null;
    }
    trigger(key, needed, action) {
        const shown = this.progress[key] || 0;
        if (shown >= needed) {
            this.progress[key] = 0;
            try { action(); } catch(e) { console.error('Action error:', e); }
        } else {
            this.rotator.next();
            this.progress[key] = shown + 1;
            if (this.onProgress) this.onProgress(key, this.progress[key], needed);
        }
    }
}

// ============================================================
// BOOTSTRAP
// ============================================================
(function bootstrap() {
    if (typeof CONFIG === 'undefined') {
        console.error('❌ config.js not loaded');
        return;
    }
    if (!window.supabase || !window.supabase.createClient) {
        console.error('❌ Supabase SDK not loaded');
        return;
    }
})();

const supabase = window.supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);
const adRotator = new AdRotator(CONFIG.ads.networks);
const adGate = new AdGate(adRotator);

// ============================================================
// STATE
// ============================================================
const state = {
    prompts: [],
    categories: [],
    currentTab: 'home',
    currentCategory: null,
    searchQuery: '',
    viewedPrompts: new Set(),
    theme: localStorage.getItem('theme') || 'light'
};

const el = (id) => document.getElementById(id);
const $$ = (s) => document.querySelectorAll(s);

// ============================================================
// TOAST
// ============================================================
const toastEl = el('toast');
let toastTimer = null;
function showToast(msg, type = 'info', dur = 3500) {
    if (!toastEl) { console.log('[toast]', msg); return; }
    toastEl.textContent = msg;
    toastEl.className = `toast ${type} show`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), dur);
}

// ============================================================
// HELPERS
// ============================================================
function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

function capitalize(s) {
    return (s || '').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function truncateWords(text, count = 9) {
    if (!text) return '';
    const clean = String(text).trim().replace(/\s+/g, ' ');
    const words = clean.split(' ');
    if (words.length <= count) return clean;
    return words.slice(0, count).join(' ') + ' ......';
}

// ============================================================
// THEME
// ============================================================
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    state.theme = theme;
    localStorage.setItem('theme', theme);
    const btn = el('themeToggle');
    if (btn) {
        const icon = btn.querySelector('i');
        if (icon) icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

function initTheme() {
    const saved = localStorage.getItem('theme');
    if (saved) applyTheme(saved);
    else {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyTheme(prefersDark ? 'dark' : 'light');
    }
    const btn = el('themeToggle');
    if (btn) btn.addEventListener('click', () => {
        applyTheme(state.theme === 'dark' ? 'light' : 'dark');
    });
}

// ============================================================
// PARTICLES
// ============================================================
class ParticleBackground {
    constructor(canvas) {
        if (!canvas) return;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.resize();
        this.init();
        window.addEventListener('resize', () => this.resize());
        this.animate();
    }
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    getColor() {
        const c = ['108,92,231','0,206,201','253,121,168','255,159,67','72,219,251'];
        return c[Math.floor(Math.random() * c.length)];
    }
    init() {
        const isM = window.innerWidth < 768;
        const n = isM ? 25 : 50;
        for (let i = 0; i < n; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * (isM ? 1.5 : 2.5) + 0.5,
                speedX: (Math.random() - 0.5) * (isM ? 0.15 : 0.3),
                speedY: (Math.random() - 0.5) * (isM ? 0.15 : 0.3) - 0.05,
                opacity: Math.random() * 0.3 + 0.1,
                color: this.getColor(),
                life: Math.random() * 100 + 50
            });
        }
    }
    animate() {
        if (!this.ctx) return;
        const isM = window.innerWidth < 768;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.particles.forEach(p => {
            p.x += p.speedX;
            p.y += p.speedY;
            p.life -= 0.1;
            if (p.life <= 0 || p.x < 0 || p.x > this.canvas.width || p.y < 0 || p.y > this.canvas.height) {
                p.x = Math.random() * this.canvas.width;
                p.y = -10;
                p.life = Math.random() * 100 + 50;
                p.speedX = (Math.random() - 0.5) * (isM ? 0.15 : 0.3);
                p.speedY = Math.random() * 0.15 + 0.05;
                p.size = Math.random() * (isM ? 1.5 : 2.5) + 0.5;
                p.color = this.getColor();
            }
            const g = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
            g.addColorStop(0, `rgba(${p.color},${p.opacity})`);
            g.addColorStop(1, `rgba(${p.color},0)`);
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
            this.ctx.fillStyle = g;
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(${p.color},${p.opacity * 0.8})`;
            this.ctx.fill();
        });
        requestAnimationFrame(() => this.animate());
    }
}

// ============================================================
// DATA SERVICE
// ============================================================
const DataService = {
    async getPrompts(opts = {}) {
        let q = supabase.from('prompts').select('*, categories(id,name)').eq('status', 'published');
        if (opts.category) q = q.eq('category_id', opts.category);
        if (opts.featured) q = q.eq('featured', true);
        if (opts.search) q = q.or(`title.ilike.%${opts.search}%,short_description.ilike.%${opts.search}%`);
        if (opts.sortBy === 'views') q = q.order('views', { ascending: false });
        else if (opts.sortBy === 'copies') q = q.order('copies', { ascending: false });
        else q = q.order('created_at', { ascending: false });
        const { data, error } = await q;
        if (error) throw error;
        return data || [];
    },
    async getCategories() {
        const { data, error } = await supabase.from('categories').select('*').order('name');
        if (error) throw error;
        return data || [];
    },
    async getPromptById(id) {
        const { data, error } = await supabase.from('prompts').select('*, categories(id,name)').eq('id', id).single();
        if (error) throw error;
        return data;
    },
    async incrementView(id) {
        try { await supabase.rpc('increment_prompt_view', { prompt_id: id }); } catch(e) { console.warn(e); }
    },
    async incrementCopy(id) {
        try { await supabase.rpc('increment_prompt_copy', { prompt_id: id }); } catch(e) { console.warn(e); }
    }
};

// ============================================================
// CATEGORIES
// ============================================================
async function loadCategories() {
    try {
        const cats = await DataService.getCategories();
        state.categories = (cats && cats.length) ? cats : CONFIG.categories;
    } catch(e) {
        console.error('Categories error:', e);
        state.categories = CONFIG.categories;
    }
    renderCategories();
}

function renderCategories() {
    const container = el('categoryChips');
    if (!container) return;
    container.innerHTML = '';

    const allChip = document.createElement('button');
    allChip.className = 'chip active';
    allChip.textContent = 'All';
    allChip.addEventListener('click', () => {
        adGate.trigger('chip-all', CONFIG.ads.requiredAds.default, () => {
            $$('.chip').forEach(x => x.classList.remove('active'));
            allChip.classList.add('active');
            state.currentCategory = null;
            loadPrompts();
        });
    });
    container.appendChild(allChip);

    state.categories.forEach(cat => {
        const chip = document.createElement('button');
        chip.className = 'chip';
        chip.textContent = capitalize(cat.name);
        chip.addEventListener('click', () => {
            adGate.trigger('chip-' + cat.id, CONFIG.ads.requiredAds.default, () => {
                $$('.chip').forEach(x => x.classList.remove('active'));
                chip.classList.add('active');
                state.currentCategory = cat.id;
                loadPrompts();
            });
        });
        container.appendChild(chip);
    });
}

// ============================================================
// PROMPTS
// ============================================================
async function loadPrompts() {
    const grid = el('promptsGrid');
    if (!grid) return;
    grid.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i><p>Loading prompts...</p></div>';
    try {
        const opts = { search: state.searchQuery };
        if (state.currentCategory && state.currentCategory !== 'all') opts.category = state.currentCategory;
        if (state.currentTab === 'trending') opts.sortBy = 'views';
        else if (state.currentTab === 'featured') opts.featured = true;

        const prompts = await DataService.getPrompts(opts);
        state.prompts = prompts;
        renderPrompts(prompts);
    } catch(e) {
        console.error('Load prompts error:', e);
        renderPrompts([]);
        showToast('Error loading prompts', 'error');
    }
}

function renderPrompts(prompts) {
    const container = el('promptsGrid');
    if (!container) return;
    if (!prompts || !prompts.length) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><h3>No prompts found</h3><p>Try adjusting your search or filters.</p></div>';
        return;
    }
    container.innerHTML = '';
    prompts.forEach((p, i) => {
        const card = document.createElement('div');
        card.className = 'prompt-card';
        card.style.animationDelay = (i * 0.05) + 's';
        const catName = (p.categories && p.categories.name) ? capitalize(p.categories.name) : 'Uncategorized';
        card.innerHTML = `
            <div class="prompt-thumbnail">
                ${p.thumbnail
                    ? `<img src="${p.thumbnail}" alt="${escapeHtml(p.title)}" loading="lazy">`
                    : `<div class="thumbnail-placeholder"><i class="fas fa-image"></i></div>`}
                ${p.featured ? '<span class="prompt-badge featured"><i class="fas fa-star"></i> Featured</span>' : ''}
            </div>
            <div class="prompt-category">${catName}</div>
            <div class="prompt-title">${escapeHtml(p.title)}</div>
            <div class="prompt-description">${escapeHtml(p.short_description || '')}</div>
        `;
        card.addEventListener('click', () => {
            adGate.trigger('card-' + p.id, CONFIG.ads.requiredAds.default, () => {
                openPromptModal(p.id);
            });
        });
        container.appendChild(card);
    });
}

// ============================================================
// PROMPT MODAL (public — truncated prompt)
// ============================================================
async function openPromptModal(id) {
    try {
        const p = await DataService.getPromptById(id);
        if (!p) { showToast('Prompt not found', 'error'); return; }

        if (!state.viewedPrompts.has(id)) {
            state.viewedPrompts.add(id);
            DataService.incrementView(id);
        }

        const catName = (p.categories && p.categories.name) ? capitalize(p.categories.name) : 'Uncategorized';
        const modalBody = el('modalBody');
        const modal = el('promptModal');
        if (!modalBody || !modal) return;

        const displayedPrompt = truncateWords(p.prompt, 9);

        modalBody.innerHTML = `
            <div class="modal-prompt-thumbnail">
                ${p.thumbnail
                    ? `<img src="${p.thumbnail}" alt="${escapeHtml(p.title)}" loading="lazy">`
                    : `<div class="thumbnail-placeholder" style="height:100%;"><i class="fas fa-image"></i></div>`}
            </div>
            <div class="modal-prompt-title">${escapeHtml(p.title)}</div>
            <div class="modal-prompt-category">${catName}</div>
            <div class="modal-prompt-description">${escapeHtml(p.short_description || '')}</div>
            <div class="modal-prompt-content">${escapeHtml(displayedPrompt)}</div>
            <div class="modal-actions">
                <button class="btn btn-success" id="copyPromptBtn"><i class="fas fa-copy"></i> Copy Prompt</button>
                <button class="btn btn-share" id="sharePromptBtn"><i class="fas fa-share-alt"></i> Share</button>
                <button class="btn btn-secondary" id="closeModalBtn"><i class="fas fa-times"></i> Close</button>
            </div>
        `;
        modal.classList.add('active');

        el('copyPromptBtn').addEventListener('click', () => {
            adGate.trigger('copy-' + p.id, CONFIG.ads.requiredAds.copyPrompt, () => doCopyPrompt(p));
        });
        el('sharePromptBtn').addEventListener('click', () => {
            adGate.trigger('share-' + p.id, CONFIG.ads.requiredAds.default, () => doSharePrompt(p));
        });
        el('closeModalBtn').addEventListener('click', () => {
            modal.classList.remove('active');
        });
    } catch(e) {
        console.error('Open prompt error:', e);
        showToast('Error loading prompt', 'error');
    }
}

function doCopyPrompt(p) {
    const onOk = () => {
        showToast('📋 Prompt copied!', 'success');
        DataService.incrementCopy(p.id);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(p.prompt).then(onOk).catch(() => {
            legacyCopy(p.prompt); onOk();
        });
    } else {
        legacyCopy(p.prompt); onOk();
    }
}

function legacyCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch(e) {}
    document.body.removeChild(ta);
}

function shareUrlFor(p) {
    const u = new URL(window.location.href);
    u.search = ''; u.hash = '';
    u.searchParams.set('prompt', p.id);
    return u.toString();
}

function doSharePrompt(p) {
    const url = shareUrlFor(p);
    if (navigator.share) {
        navigator.share({ title: p.title, text: `Check out: ${p.title}`, url })
            .then(() => showToast('🔗 Shared!', 'success'))
            .catch(err => { if (!err || err.name !== 'AbortError') copyShareLink(url); });
    } else {
        copyShareLink(url);
    }
}

function copyShareLink(url) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(url)
            .then(() => showToast('🔗 Link copied!', 'success'))
            .catch(() => { legacyCopy(url); showToast('🔗 Link copied!', 'success'); });
    } else {
        legacyCopy(url);
        showToast('🔗 Link copied!', 'success');
    }
}

// ============================================================
// PAGE MODAL
// ============================================================
function openPage(key) {
    const pd = CONFIG.pages[key];
    if (!pd) { showToast('Page not found', 'error'); return; }
    const pc = el('pageContent');
    const pm = el('pageModal');
    if (!pc || !pm) return;
    pc.innerHTML = pd.content;
    pm.classList.add('active');
}

// ============================================================
// ADMIN STATE
// ============================================================
const adminState = {
    user: null,
    tab: 'list',
    editingId: null,
    checkedSession: false
};

// ============================================================
// ADMIN OPEN / CLOSE
// ============================================================
async function openAdmin() {
    const overlay = el('adminOverlay');
    if (!overlay) { console.error('adminOverlay missing'); return; }
    overlay.classList.add('active');
    if (!adminState.checkedSession) {
        adminState.checkedSession = true;
        try {
            const { data } = await supabase.auth.getSession();
            if (data && data.session) adminState.user = data.session.user;
        } catch(e) { console.warn(e); }
    }
    await renderAdmin();
}

function closeAdmin() {
    const overlay = el('adminOverlay');
    if (overlay) overlay.classList.remove('active');
    adminState.tab = 'list';
    adminState.editingId = null;
}

// ============================================================
// ADMIN RENDER
// ============================================================
async function renderAdmin() {
    const c = el('adminContent');
    if (!c) return;

    if (!adminState.user) {
        c.innerHTML = `
            <div class="admin-login">
                <h2>Admin Login</h2>
                <p>Sign in with your admin credentials</p>
                <div class="admin-form">
                    <div><label>Email</label><input type="email" id="adminEmail" placeholder="admin@example.com"></div>
                    <div><label>Password</label><input type="password" id="adminPass" placeholder="••••••••"></div>
                    <button class="btn btn-primary" id="adminLoginBtn" style="width:100%;">
                        <i class="fas fa-sign-in-alt"></i> Sign In
                    </button>
                    <div class="admin-hint">Only users in Supabase Auth can access.</div>
                </div>
            </div>
        `;
        el('adminLoginBtn').addEventListener('click', adminLogin);
        el('adminPass').addEventListener('keydown', e => { if (e.key === 'Enter') adminLogin(); });
        return;
    }

    c.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px;">
            <div style="font-size:13px;color:var(--text-secondary);">
                <i class="fas fa-user-circle"></i> ${escapeHtml(adminState.user.email)}
            </div>
            <button class="btn btn-secondary" id="adminLogoutBtn" style="flex:0;padding:6px 14px;min-height:32px;font-size:12px;">
                <i class="fas fa-sign-out-alt"></i> Logout
            </button>
        </div>
        <div class="admin-tabs">
            <button class="admin-tab ${adminState.tab === 'list' ? 'active' : ''}" data-atab="list"><i class="fas fa-list"></i> Prompts</button>
            <button class="admin-tab ${adminState.tab === 'new' ? 'active' : ''}" data-atab="new"><i class="fas fa-plus"></i> ${adminState.editingId ? 'Edit' : 'New'}</button>
            <button class="admin-tab ${adminState.tab === 'cats' ? 'active' : ''}" data-atab="cats"><i class="fas fa-tags"></i> Categories</button>
        </div>
        <div id="adminTabBody"></div>
    `;

    el('adminLogoutBtn').addEventListener('click', async () => {
        await supabase.auth.signOut();
        adminState.user = null;
        adminState.checkedSession = false;
        renderAdmin();
    });

    document.querySelectorAll('.admin-tab').forEach(t => {
        t.addEventListener('click', () => {
            adminState.tab = t.dataset.atab;
            if (t.dataset.atab !== 'new') adminState.editingId = null;
            renderAdmin();
        });
    });

    const body = el('adminTabBody');
    if (adminState.tab === 'list') await renderAdminList(body);
    else if (adminState.tab === 'new') await renderAdminForm(body);
    else if (adminState.tab === 'cats') await renderAdminCats(body);
}

// ============================================================
// ADMIN LOGIN
// ============================================================
async function adminLogin() {
    const email = el('adminEmail').value.trim();
    const pass = el('adminPass').value;
    if (!email || !pass) { showToast('Enter email and password', 'error'); return; }

    const btn = el('adminLoginBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';

    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) {
        showToast(error.message, 'error');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
        return;
    }
    adminState.user = data.user;
    adminState.checkedSession = true;
    showToast('Welcome!', 'success');
    renderAdmin();
}

// ============================================================
// ADMIN LIST (with views / copies / date)
// ============================================================
async function renderAdminList(body) {
    body.innerHTML = '<div class="loading-spinner" style="padding:20px;"><i class="fas fa-spinner fa-spin"></i></div>';

    const { data, error } = await supabase
        .from('prompts')
        .select('id, title, status, featured, created_at, views, copies')
        .order('created_at', { ascending: false });

    if (error) {
        body.innerHTML = `<p style="color:#e17055;">${escapeHtml(error.message)}</p>`;
        return;
    }
    const items = data || [];
    if (!items.length) {
        body.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px;">No prompts yet.</p>';
        return;
    }

    body.innerHTML = items.map(p => `
        <div class="admin-list-item">
            <div class="admin-list-item-info">
                <strong>
                    ${escapeHtml(p.title)}
                    <span class="admin-badge ${p.status === 'published' ? 'published' : 'draft'}">${p.status}</span>
                    ${p.featured ? '<span class="admin-badge featured">★</span>' : ''}
                </strong>
                <small class="admin-stats">
                    <i class="fas fa-eye"></i> ${p.views || 0}
                    &nbsp;·&nbsp;
                    <i class="fas fa-copy"></i> ${p.copies || 0}
                    &nbsp;·&nbsp;
                    <i class="fas fa-calendar"></i> ${new Date(p.created_at).toLocaleDateString()}
                </small>
            </div>
            <div class="admin-item-actions">
                <button class="admin-icon-btn edit" data-edit="${p.id}" title="Edit"><i class="fas fa-pen"></i></button>
                <button class="admin-icon-btn del" data-del="${p.id}" title="Delete"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');

    body.querySelectorAll('[data-edit]').forEach(b => {
        b.addEventListener('click', () => {
            adminState.editingId = b.dataset.edit;
            adminState.tab = 'new';
            renderAdmin();
        });
    });
    body.querySelectorAll('[data-del]').forEach(b => {
        b.addEventListener('click', async () => {
            if (!confirm('Delete this prompt? Cannot be undone.')) return;
            const { error } = await supabase.from('prompts').delete().eq('id', b.dataset.del);
            if (error) showToast(error.message, 'error');
            else { showToast('Deleted', 'success'); renderAdmin(); }
        });
    });
}

// ============================================================
// ADMIN CATEGORIES
// ============================================================
async function renderAdminCats(body) {
    body.innerHTML = '<div class="loading-spinner" style="padding:20px;"><i class="fas fa-spinner fa-spin"></i></div>';
    const { data: items } = await supabase.from('categories').select('*').order('name');

    body.innerHTML = `
        <div class="admin-form" style="margin-bottom:16px;">
            <div><label>New Category Name</label><input type="text" id="newCatName" placeholder="e.g. anime"></div>
            <button class="btn btn-primary" id="addCatBtn" style="width:100%;"><i class="fas fa-plus"></i> Add Category</button>
        </div>
        <div>
            ${(items || []).map(c => `
                <div class="admin-list-item">
                    <div class="admin-list-item-info">
                        <strong>${escapeHtml(c.name)}</strong>
                        <small>ID: ${escapeHtml(c.id)}</small>
                    </div>
                    <div class="admin-item-actions">
                        <button class="admin-icon-btn del" data-delcat="${c.id}"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    el('addCatBtn').addEventListener('click', async () => {
        const name = el('newCatName').value.trim();
        if (!name) { showToast('Enter a name', 'error'); return; }
        const slug = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        const { error } = await supabase.from('categories').insert({ id: slug, name });
        if (error) showToast(error.message, 'error');
        else { showToast('Category added', 'success'); renderAdmin(); }
    });

    body.querySelectorAll('[data-delcat]').forEach(b => {
        b.addEventListener('click', async () => {
            if (!confirm('Delete category?')) return;
            const { error } = await supabase.from('categories').delete().eq('id', b.dataset.delcat);
            if (error) showToast(error.message, 'error');
            else { showToast('Deleted', 'success'); renderAdmin(); }
        });
    });
}

// ============================================================
// ADMIN FORM (Add / Edit prompt)
// ============================================================
async function renderAdminForm(body) {
    let existing = {};
    if (adminState.editingId) {
        body.innerHTML = '<div class="loading-spinner" style="padding:20px;"><i class="fas fa-spinner fa-spin"></i></div>';
        const { data, error } = await supabase.from('prompts').select('*').eq('id', adminState.editingId).single();
        if (error) { body.innerHTML = `<p style="color:#e17055;">${escapeHtml(error.message)}</p>`; return; }
        existing = data || {};
    }

    const { data: cats } = await supabase.from('categories').select('*').order('name');
    const catOpts = '<option value="">-- Select --</option>' +
        (cats || []).map(c => `<option value="${c.id}" ${existing.category_id === c.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('');

    body.innerHTML = `
        <div class="admin-form">
            <div><label>Title *</label><input type="text" id="fTitle" value="${escapeHtml(existing.title || '')}"></div>
            <div><label>Short Description</label><textarea id="fDesc" style="min-height:60px;font-family:inherit;">${escapeHtml(existing.short_description || '')}</textarea></div>
            <div><label>Prompt Text *</label><textarea id="fPrompt">${escapeHtml(existing.prompt || '')}</textarea></div>
            <div><label>Category</label><select id="fCat">${catOpts}</select></div>

            <div>
                <label>Thumbnail</label>
                <button id="uploadBtn" type="button">
                    <i class="fas fa-cloud-upload-alt"></i> Upload Image to ImgBB
                </button>
                <input type="text" id="fThumb" value="${escapeHtml(existing.thumbnail || '')}" placeholder="Or paste image URL here..." style="margin-top:8px;">
                <img id="thumbPreview" src="${existing.thumbnail || ''}" ${existing.thumbnail ? 'style="display:block;"' : ''} alt="">
            </div>

            <div>
                <label style="display:flex;align-items:center;gap:8px;font-weight:500;cursor:pointer;">
                    <input type="checkbox" id="fFeatured" ${existing.featured ? 'checked' : ''} style="width:auto;"> Mark as Featured
                </label>
            </div>

            <div>
                <label>Status</label>
                <select id="fStatus">
                    <option value="published" ${existing.status === 'published' || !existing.status ? 'selected' : ''}>Published</option>
                    <option value="draft" ${existing.status === 'draft' ? 'selected' : ''}>Draft</option>
                </select>
            </div>

            <div class="admin-btn-row">
                <button class="btn btn-primary" id="saveBtn" style="flex:2;"><i class="fas fa-save"></i> ${adminState.editingId ? 'Update' : 'Create'}</button>
                <button class="btn btn-secondary" id="cancelBtn"><i class="fas fa-times"></i> Cancel</button>
            </div>
        </div>
    `;

    el('cancelBtn').addEventListener('click', () => {
        adminState.editingId = null;
        adminState.tab = 'list';
        renderAdmin();
    });

    el('fThumb').addEventListener('input', e => {
        const prev = el('thumbPreview');
        if (e.target.value) { prev.src = e.target.value; prev.style.display = 'block'; }
        else { prev.style.display = 'none'; }
    });

    el('uploadBtn').addEventListener('click', openImgBBUpload);

    el('saveBtn').addEventListener('click', savePrompt);
}

// ============================================================
// IMGBB UPLOAD — 2 API keys with automatic fallback
// ============================================================
function openImgBBUpload() {
    console.log('📷 Opening ImgBB upload...');

    // Config check
    const keys = CONFIG.imgbb && Array.isArray(CONFIG.imgbb.apiKeys) ? CONFIG.imgbb.apiKeys : [];
    if (!keys.length) {
        showToast('ImgBB API keys missing in config.js', 'error');
        return;
    }

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';

    fileInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) {
            if (fileInput.parentNode) document.body.removeChild(fileInput);
            return;
        }

        // Size check (ImgBB max 32MB)
        if (file.size > 32 * 1024 * 1024) {
            showToast('Image 32MB se choti honi chahiye', 'error');
            if (fileInput.parentNode) document.body.removeChild(fileInput);
            return;
        }

        showToast('📤 Uploading... please wait', 'info', 15000);

        // Try each API key in order — fallback on failure
        let imageUrl = null;
        let lastError = null;

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            console.log(`📷 Trying ImgBB key ${i + 1}/${keys.length} (${key.substring(0, 8)}...)`);

            try {
                const formData = new FormData();
                formData.append('image', file);

                const response = await fetch(`https://api.imgbb.com/1/upload?key=${key}`, {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                if (!response.ok || !result.success) {
                    throw new Error(result.error?.message || `HTTP ${response.status}`);
                }

                imageUrl = result.data.url;
                console.log(`✅ ImgBB key ${i + 1} worked! URL:`, imageUrl);
                break;

            } catch (err) {
                lastError = err;
                console.warn(`❌ ImgBB key ${i + 1} failed:`, err.message);
                // Try next key
            }
        }

        // Cleanup file input
        if (fileInput.parentNode) document.body.removeChild(fileInput);

        // If all keys failed
        if (!imageUrl) {
            console.error('❌ All ImgBB API keys failed. Last error:', lastError);
            showToast('Upload fail: ' + (lastError?.message || 'All API keys failed'), 'error');
            return;
        }

        // Success — update UI
        const thumbInput = el('fThumb');
        const preview = el('thumbPreview');
        if (thumbInput) thumbInput.value = imageUrl;
        if (preview) {
            preview.src = imageUrl;
            preview.style.display = 'block';
        }

        showToast('✅ Image uploaded!', 'success');
    });

    document.body.appendChild(fileInput);
    fileInput.click();
}

// ============================================================
// SAVE PROMPT
// ============================================================
async function savePrompt() {
    const title = el('fTitle').value.trim();
    const prompt = el('fPrompt').value.trim();
    if (!title || !prompt) { showToast('Title and Prompt are required', 'error'); return; }

    const payload = {
        title,
        short_description: el('fDesc').value.trim(),
        prompt,
        category_id: el('fCat').value || null,
        thumbnail: el('fThumb').value.trim() || null,
        featured: el('fFeatured').checked,
        status: el('fStatus').value
    };

    const btn = el('saveBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    let result;
    if (adminState.editingId) {
        result = await supabase.from('prompts').update(payload).eq('id', adminState.editingId);
    } else {
        result = await supabase.from('prompts').insert(payload);
    }

    if (result.error) {
        showToast(result.error.message, 'error');
        btn.disabled = false;
        btn.innerHTML = `<i class="fas fa-save"></i> ${adminState.editingId ? 'Update' : 'Create'}`;
        return;
    }

    showToast(adminState.editingId ? 'Updated!' : 'Created!', 'success');
    adminState.editingId = null;
    adminState.tab = 'list';
    renderAdmin();
}

// ============================================================
// EVENT WIRING
// ============================================================
function setupEvents() {
    const searchToggle = el('searchToggle');
    if (searchToggle) {
        searchToggle.addEventListener('click', () => {
            adGate.trigger('searchToggle', CONFIG.ads.requiredAds.default, () => {
                const sc = el('searchContainer');
                if (!sc) return;
                sc.classList.toggle('active');
                if (sc.classList.contains('active')) el('searchInput').focus();
            });
        });
    }

    const searchInput = el('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', e => {
            state.searchQuery = e.target.value;
            const cs = el('clearSearch');
            if (cs) cs.classList.toggle('visible', e.target.value.length > 0);
            loadPrompts();
        });
    }

    const clearSearch = el('clearSearch');
    if (clearSearch) {
        clearSearch.addEventListener('click', () => {
            el('searchInput').value = '';
            state.searchQuery = '';
            clearSearch.classList.remove('visible');
            loadPrompts();
        });
    }

    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            adGate.trigger('nav-' + tab.dataset.tab, CONFIG.ads.requiredAds.default, () => {
                document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                state.currentTab = tab.dataset.tab;
                state.currentCategory = null;
                document.querySelectorAll('.chip.active').forEach(c => c.classList.remove('active'));
                const firstChip = document.querySelector('.chip');
                if (firstChip) firstChip.classList.add('active');
                loadPrompts();
            });
        });
    });

    const modalClose = el('modalClose');
    if (modalClose) modalClose.addEventListener('click', () => el('promptModal').classList.remove('active'));
    const promptModal = el('promptModal');
    if (promptModal) promptModal.addEventListener('click', e => { if (e.target === promptModal) promptModal.classList.remove('active'); });

    const pageModalClose = el('pageModalClose');
    if (pageModalClose) pageModalClose.addEventListener('click', () => el('pageModal').classList.remove('active'));
    const pageModal = el('pageModal');
    if (pageModal) pageModal.addEventListener('click', e => { if (e.target === pageModal) pageModal.classList.remove('active'); });

    document.querySelectorAll('.footer-links a[data-page]').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const page = link.dataset.page;
            adGate.trigger('footer-' + page, CONFIG.ads.requiredAds.default, () => openPage(page));
        });
    });

    const footerChannelLink = el('footerChannelLink');
    if (footerChannelLink) {
        footerChannelLink.addEventListener('click', e => {
            e.preventDefault();
            const url = footerChannelLink.getAttribute('href');
            adGate.trigger('footer-channel', CONFIG.ads.requiredAds.default, () => {
                window.open(url, '_blank', 'noopener');
            });
        });
    }

    const promoTelegramBtn = el('promoTelegramBtn');
    if (promoTelegramBtn) {
        promoTelegramBtn.addEventListener('click', e => {
            e.preventDefault();
            const url = promoTelegramBtn.getAttribute('href');
            adGate.trigger('promo-telegram', CONFIG.ads.requiredAds.default, () => {
                window.open(url, '_blank', 'noopener');
            });
        });
    }
    const promoWhatsappBtn = el('promoWhatsappBtn');
    if (promoWhatsappBtn) {
        promoWhatsappBtn.addEventListener('click', e => {
            e.preventDefault();
            const url = promoWhatsappBtn.getAttribute('href');
            adGate.trigger('promo-whatsapp', CONFIG.ads.requiredAds.default, () => {
                window.open(url, '_blank', 'noopener');
            });
        });
    }

    const floatingTelegram = el('floatingTelegram');
    if (floatingTelegram) {
        floatingTelegram.addEventListener('click', e => {
            e.preventDefault();
            const url = floatingTelegram.getAttribute('href');
            adGate.trigger('floatingTelegram', CONFIG.ads.requiredAds.default, () => {
                window.open(url, '_blank', 'noopener');
            });
        });
    }

    const adminClose = el('adminClose');
    if (adminClose) adminClose.addEventListener('click', closeAdmin);
    const adminOverlay = el('adminOverlay');
    if (adminOverlay) adminOverlay.addEventListener('click', e => {
        if (e.target === adminOverlay) closeAdmin();
    });

    const logoBtn = el('logoBtn');
    if (logoBtn) {
        let tapCount = 0;
        let tapTimer = null;
        logoBtn.addEventListener('click', () => {
            tapCount++;
            clearTimeout(tapTimer);
            if (tapCount >= CONFIG.admin.logoClicksRequired) {
                tapCount = 0;
                if (CONFIG.admin.enabled) openAdmin();
            } else {
                tapTimer = setTimeout(() => { tapCount = 0; }, CONFIG.admin.clickWindowMs);
            }
        });
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === '1' && CONFIG.admin.enabled) {
        setTimeout(openAdmin, 400);
    }

    adGate.onProgress = (key, shown, needed) => {
        const remaining = needed - shown;
        if (remaining > 0) showToast(`📢 Ad opened! Click ${remaining} more time(s)`, 'info');
        else showToast('📢 Ad opened! Click again to continue', 'info');
    };
}

// ============================================================
// INIT
// ============================================================
async function init() {
    console.log('🚀 Prompt Vault booting...');

    initTheme();
    new ParticleBackground(el('particleCanvas'));

    try {
        setupEvents();
        console.log('✅ Events wired');
    } catch(e) {
        console.error('❌ setupEvents failed:', e);
    }

    const params = new URLSearchParams(window.location.search);
    const sharedId = params.get('prompt');

    await loadCategories();
    await loadPrompts();

    if (sharedId) openPromptModal(sharedId);

    console.log('🚀 Prompt Vault ready');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}