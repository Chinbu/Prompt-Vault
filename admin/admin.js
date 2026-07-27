/* ========================================
   PROMPT VAULT - Admin Panel (FIXED)
   ======================================== */

const supabase = window.supabase.createClient(
    CONFIG.supabase.url,
    CONFIG.supabase.anonKey
);

// DOM References
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const elements = {
    loginScreen: $('#loginScreen'),
    dashboardScreen: $('#dashboardScreen'),
    loginForm: $('#loginForm'),
    loginEmail: $('#loginEmail'),
    loginPassword: $('#loginPassword'),
    loginError: $('#loginError'),
    logoutBtn: $('#logoutBtn'),
    navItems: $$('.nav-item'),
    sections: $$('.section'),
    pageTitle: $('#pageTitle'),
    adminUser: $('#adminUser'),
    totalPrompts: $('#totalPrompts'),
    totalViews: $('#totalViews'),
    totalCopies: $('#totalCopies'),
    totalCategories: $('#totalCategories'),
    promptsTableBody: $('#promptsTableBody'),
    promptSearch: $('#promptSearch'),
    promptForm: $('#promptForm'),
    formTitle: $('#formTitle'),
    formCategory: $('#formCategory'),
    formThumbnail: $('#formThumbnail'),
    formShortDesc: $('#formShortDesc'),
    formPrompt: $('#formPrompt'),
    formFeatured: $('#formFeatured'),
    formStatus: $('#formStatus'),
    uploadArea: $('#uploadArea'),
    fileInput: $('#fileInput'),
    thumbnailPreview: $('#thumbnailPreview'),
    previewImage: $('#previewImage'),
    removeImage: $('#removeImage'),
    categoryForm: $('#categoryForm'),
    categoryName: $('#categoryName'),
    categoriesTableBody: $('#categoriesTableBody'),
};

// ========================================
// Cloudinary Upload
// ========================================
class CloudinaryUploader {
    constructor() {
        this.uploadedUrl = null;
        this.setupUpload();
    }
    
    setupUpload() {
        if (elements.uploadArea) {
            elements.uploadArea.addEventListener('click', () => {
                elements.fileInput.click();
            });
        }
        
        if (elements.fileInput) {
            elements.fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.uploadFile(file);
                }
            });
        }
        
        if (elements.removeImage) {
            elements.removeImage.addEventListener('click', () => {
                this.clearImage();
            });
        }
    }
    
    async uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CONFIG.cloudinary.uploadPreset);
        formData.append('folder', CONFIG.cloudinary.folder);
        
        try {
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${CONFIG.cloudinary.cloudName}/image/upload`,
                {
                    method: 'POST',
                    body: formData,
                }
            );
            
            const data = await response.json();
            
            if (data.secure_url) {
                this.uploadedUrl = data.secure_url;
                elements.formThumbnail.value = data.secure_url;
                this.showPreview(data.secure_url);
                alert('✅ Thumbnail uploaded successfully!');
            } else {
                throw new Error('Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('❌ Upload failed. Please try again.');
        }
    }
    
    showPreview(url) {
        if (elements.previewImage) {
            elements.previewImage.src = url;
        }
        if (elements.thumbnailPreview) {
            elements.thumbnailPreview.style.display = 'block';
        }
        if (elements.uploadArea) {
            elements.uploadArea.style.display = 'none';
        }
    }
    
    clearImage() {
        this.uploadedUrl = null;
        if (elements.formThumbnail) {
            elements.formThumbnail.value = '';
        }
        if (elements.thumbnailPreview) {
            elements.thumbnailPreview.style.display = 'none';
        }
        if (elements.uploadArea) {
            elements.uploadArea.style.display = 'block';
        }
        if (elements.fileInput) {
            elements.fileInput.value = '';
        }
    }
}

// ========================================
// Admin App
// ========================================
class AdminApp {
    constructor() {
        this.uploader = new CloudinaryUploader();
        this.session = null;
        this.prompts = [];
        this.categories = [];
        this.editingId = null;
        
        this.checkSession();
        this.setupLogin();
        this.setupLogout();
        this.setupNavigation();
        this.setupPromptForm();
        this.setupCategoryForm();
        this.setupPromptSearch();
    }
    
    async checkSession() {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                this.session = session;
                this.showDashboard();
                await this.loadData();
            } else {
                this.showLogin();
            }
        } catch (error) {
            console.error('Session check error:', error);
            this.showLogin();
        }
    }
    
    setupLogin() {
        elements.loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = elements.loginEmail.value;
            const password = elements.loginPassword.value;
            
            try {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });
                
                if (error) throw error;
                
                this.session = data.session;
                elements.loginError.textContent = '';
                this.showDashboard();
                await this.loadData();
            } catch (error) {
                elements.loginError.textContent = error.message || 'Login failed.';
            }
        });
    }
    
    setupLogout() {
        elements.logoutBtn.addEventListener('click', async () => {
            await supabase.auth.signOut();
            this.session = null;
            this.showLogin();
        });
    }
    
    showLogin() {
        if (elements.loginScreen) {
            elements.loginScreen.style.display = 'flex';
        }
        if (elements.dashboardScreen) {
            elements.dashboardScreen.style.display = 'none';
        }
    }
    
    showDashboard() {
        if (elements.loginScreen) {
            elements.loginScreen.style.display = 'none';
        }
        if (elements.dashboardScreen) {
            elements.dashboardScreen.style.display = 'flex';
        }
    }
    
    setupNavigation() {
        elements.navItems.forEach(item => {
            item.addEventListener('click', () => {
                const section = item.dataset.section;
                this.showSection(section);
            });
        });
    }
    
    showSection(section) {
        elements.navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.section === section);
        });
        
        elements.sections.forEach(el => {
            el.classList.toggle('active', el.id === `section-${section}`);
        });
        
        const titles = {
            dashboard: 'Dashboard',
            prompts: 'Manage Prompts',
            'add-prompt': 'Add New Prompt',
            categories: 'Manage Categories'
        };
        elements.pageTitle.textContent = titles[section] || 'Dashboard';
        
        if (section === 'categories') {
            this.loadCategories();
        }
        if (section === 'prompts') {
            this.loadPrompts();
        }
        if (section === 'add-prompt') {
            this.loadCategoryOptions();
        }
    }
    
    // ========================================
    // LOAD DATA
    // ========================================
    async loadData() {
        await this.loadDashboardStats();
        await this.loadCategories();
        await this.loadPrompts();
        await this.loadCategoryOptions();
    }
    
    async loadDashboardStats() {
        try {
            const { data: prompts, error: promptsError } = await supabase
                .from('prompts')
                .select('*');
            
            if (promptsError) throw promptsError;
            
            const { data: categories, error: categoriesError } = await supabase
                .from('categories')
                .select('*');
            
            if (categoriesError) throw categoriesError;
            
            const totalViews = prompts?.reduce((sum, p) => sum + (p.views || 0), 0) || 0;
            const totalCopies = prompts?.reduce((sum, p) => sum + (p.copies || 0), 0) || 0;
            
            elements.totalPrompts.textContent = prompts?.length || 0;
            elements.totalViews.textContent = totalViews;
            elements.totalCopies.textContent = totalCopies;
            elements.totalCategories.textContent = categories?.length || 0;
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }
    
    // ========================================
    // CATEGORIES
    // ========================================
    async loadCategories() {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('name');
            
            if (error) throw error;
            
            if (data && data.length > 0) {
                this.categories = data;
                console.log('✅ Categories loaded:', data.length);
            } else {
                console.warn('⚠️ No categories in database');
                this.categories = CONFIG.categories.map(cat => ({
                    id: cat.id,
                    name: cat.name
                }));
            }
            this.renderCategories(this.categories);
        } catch (error) {
            console.error('Error loading categories:', error);
            this.categories = CONFIG.categories.map(cat => ({
                id: cat.id,
                name: cat.name
            }));
            this.renderCategories(this.categories);
        }
    }
    
    renderCategories(categories) {
        if (!categories || categories.length === 0) {
            elements.categoriesTableBody.innerHTML = `
                <tr>
                    <td colspan="3" class="text-center">
                        <div style="padding: 20px;">
                            <i class="fas fa-info-circle" style="font-size: 24px;"></i>
                            <p style="margin-top: 8px;">No categories found. Add your first category below!</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        elements.categoriesTableBody.innerHTML = categories.map(cat => `
            <tr>
                <td><strong>${this.escapeHtml(cat.name)}</strong></td>
                <td><code style="background: var(--bg-primary); padding: 2px 8px; border-radius: 4px; font-size: 12px;">${this.escapeHtml(cat.id)}</code></td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="window.adminApp.deleteCategory('${cat.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }
    
    async deleteCategory(id) {
        if (!confirm('Delete this category?')) return;
        
        try {
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            
            alert('Category deleted!');
            await this.loadCategories();
            await this.loadCategoryOptions();
            await this.loadDashboardStats();
        } catch (error) {
            console.error('Error deleting category:', error);
            alert('Error deleting category: ' + error.message);
        }
    }
    
    setupCategoryForm() {
        elements.categoryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = elements.categoryName.value.trim();
            
            if (!name) {
                alert('Enter category name');
                return;
            }
            
            try {
                const { error } = await supabase
                    .from('categories')
                    .insert([{ name }]);
                
                if (error) throw error;
                
                alert('✅ Category added!');
                elements.categoryName.value = '';
                await this.loadCategories();
                await this.loadCategoryOptions();
                await this.loadDashboardStats();
            } catch (error) {
                console.error('Error adding category:', error);
                alert('Error adding category: ' + error.message);
            }
        });
    }
    
    // ========================================
    // CATEGORY OPTIONS FOR DROPDOWN - FIXED
    // ========================================
    async loadCategoryOptions() {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('name');
            
            if (error) throw error;
            
            const select = elements.formCategory;
            select.innerHTML = '<option value="">-- Select Category --</option>';
            
            if (data && data.length > 0) {
                data.forEach(cat => {
                    const displayName = cat.name.split(' ').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ');
                    select.innerHTML += `<option value="${cat.id}">${this.escapeHtml(displayName)}</option>`;
                });
                console.log('✅ Category options loaded:', data.length);
            } else {
                CONFIG.categories.forEach(cat => {
                    const displayName = cat.name.split(' ').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ');
                    select.innerHTML += `<option value="${cat.id}">${this.escapeHtml(displayName)}</option>`;
                });
                console.warn('⚠️ No categories in database, using defaults');
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            const select = elements.formCategory;
            select.innerHTML = `<option value="" disabled>⚠️ Error loading categories</option>`;
        }
    }
    
    // ========================================
    // PROMPTS - FIXED
    // ========================================
    async loadPrompts() {
        try {
            const { data, error } = await supabase
                .from('prompts')
                .select(`
                    *,
                    categories (
                        id,
                        name
                    )
                `)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            this.prompts = data || [];
            this.renderPrompts(this.prompts);
        } catch (error) {
            console.error('Error loading prompts:', error);
            this.prompts = [];
            this.renderPrompts([]);
        }
    }
    
    renderPrompts(prompts) {
        if (!prompts || prompts.length === 0) {
            elements.promptsTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">
                        <div style="padding: 20px;">
                            <i class="fas fa-file-alt" style="font-size: 24px; color: var(--text-muted);"></i>
                            <p style="margin-top: 8px;">No prompts yet. Add your first prompt!</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        elements.promptsTableBody.innerHTML = prompts.map(p => {
            const categoryName = p.categories?.name || 'Uncategorized';
            const displayCategory = categoryName.split(' ').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
            return `
                <tr>
                    <td><strong>${this.escapeHtml(p.title)}</strong></td>
                    <td><span style="background: var(--chip-bg); padding: 2px 12px; border-radius: 50px; font-size: 12px;">${this.escapeHtml(displayCategory)}</span></td>
                    <td>${p.views || 0}</td>
                    <td>${p.copies || 0}</td>
                    <td>${p.featured ? '⭐' : '-'}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="window.adminApp.editPrompt('${p.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="window.adminApp.deletePrompt('${p.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button class="btn btn-sm ${p.featured ? 'btn-secondary' : 'btn-success'}" onclick="window.adminApp.toggleFeatured('${p.id}')">
                            <i class="fas fa-star"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    setupPromptSearch() {
        elements.promptSearch.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = this.prompts.filter(p => 
                p.title.toLowerCase().includes(query) ||
                (p.short_description || '').toLowerCase().includes(query)
            );
            this.renderPrompts(filtered);
        });
    }
    
    // ========================================
    // ADD/EDIT PROMPT - FIXED
    // ========================================
    setupPromptForm() {
        elements.promptForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (this.editingId) {
                await this.updatePrompt();
            } else {
                await this.addPrompt();
            }
        });
    }
    
    async addPrompt() {
        const data = {
            title: elements.formTitle.value.trim(),
            category_id: elements.formCategory.value,  // Using category_id instead of category
            thumbnail: elements.formThumbnail.value.trim(),
            short_description: elements.formShortDesc.value.trim(),
            prompt: elements.formPrompt.value.trim(),
            featured: elements.formFeatured.checked,
            status: elements.formStatus.checked ? 'published' : 'draft',
        };
        
        if (!data.title || !data.category_id || !data.short_description || !data.prompt) {
            alert('Please fill all required fields');
            return;
        }
        
        try {
            const { error } = await supabase
                .from('prompts')
                .insert([data]);
            
            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }
            
            alert('✅ Prompt added!');
            this.resetForm();
            await this.loadPrompts();
            await this.loadDashboardStats();
        } catch (error) {
            console.error('Error adding prompt:', error);
            alert('Error adding prompt: ' + error.message);
        }
    }
    
    async editPrompt(id) {
        try {
            const { data, error } = await supabase
                .from('prompts')
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) throw error;
            
            this.editingId = id;
            elements.formTitle.value = data.title;
            elements.formCategory.value = data.category_id || '';  // Using category_id
            
            if (data.thumbnail) {
                this.uploader.showPreview(data.thumbnail);
                elements.formThumbnail.value = data.thumbnail;
            }
            
            elements.formShortDesc.value = data.short_description || '';
            elements.formPrompt.value = data.prompt;
            elements.formFeatured.checked = data.featured || false;
            elements.formStatus.checked = data.status === 'published';
            
            const submitBtn = elements.promptForm.querySelector('button[type="submit"]');
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Prompt';
            
            this.showSection('add-prompt');
            alert('Editing: ' + data.title);
        } catch (error) {
            console.error('Error loading prompt:', error);
            alert('Error loading prompt: ' + error.message);
        }
    }
    
    async updatePrompt() {
        const data = {
            title: elements.formTitle.value.trim(),
            category_id: elements.formCategory.value,  // Using category_id
            thumbnail: elements.formThumbnail.value.trim(),
            short_description: elements.formShortDesc.value.trim(),
            prompt: elements.formPrompt.value.trim(),
            featured: elements.formFeatured.checked,
            status: elements.formStatus.checked ? 'published' : 'draft',
            updated_at: new Date().toISOString(),
        };
        
        try {
            const { error } = await supabase
                .from('prompts')
                .update(data)
                .eq('id', this.editingId);
            
            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }
            
            alert('✅ Prompt updated!');
            this.resetForm();
            this.editingId = null;
            await this.loadPrompts();
            await this.loadDashboardStats();
        } catch (error) {
            console.error('Error updating prompt:', error);
            alert('Error updating prompt: ' + error.message);
        }
    }
    
    async deletePrompt(id) {
        if (!confirm('Delete this prompt?')) return;
        
        try {
            const { error } = await supabase
                .from('prompts')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            
            alert('Prompt deleted');
            await this.loadPrompts();
            await this.loadDashboardStats();
        } catch (error) {
            console.error('Error deleting prompt:', error);
            alert('Error deleting prompt: ' + error.message);
        }
    }
    
    async toggleFeatured(id) {
        try {
            const prompt = this.prompts.find(p => p.id === id);
            if (!prompt) return;
            
            const { error } = await supabase
                .from('prompts')
                .update({ featured: !prompt.featured })
                .eq('id', id);
            
            if (error) throw error;
            
            await this.loadPrompts();
        } catch (error) {
            console.error('Error toggling featured:', error);
            alert('Error toggling featured: ' + error.message);
        }
    }
    
    resetForm() {
        elements.promptForm.reset();
        this.uploader.clearImage();
        elements.formThumbnail.value = '';
        const submitBtn = elements.promptForm.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-plus"></i> Add Prompt';
        this.editingId = null;
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
    const admin = new AdminApp();
    window.adminApp = admin;
    console.log('🚀 Prompt Vault Admin initialized');
});