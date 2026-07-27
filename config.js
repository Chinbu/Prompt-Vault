// ========================================
// PROMPT VAULT - Configuration
// ========================================

const CONFIG = {
    // Supabase Configuration
    supabase: {
        url: 'https://lbwkvkawmfjeyerwhrcv.supabase.co',
        anonKey: 'sb_publishable_gmazfjkeAqRkWm5239pJSg_zPnKk5zE'
    },
    
    // Cloudinary Configuration
    cloudinary: {
        cloudName: 'wxttzmyi',
        uploadPreset: 'prompt_vault_uploads',
        folder: 'prompt-vault/thumbnails'
    },
    
    // Monetag Ad Configuration
    monetag: {
        zoneId: '11417937',
        sdkUrl: '//libtl.com/sdk.js'
    },
    
    // All Pages Content
    pages: {
        about: {
            title: 'About Prompt Vault',
            content: `
                <h1>About Prompt Vault</h1>
                <p>Welcome to Prompt Vault, a Telegram Mini App designed to help creators discover and use high-quality AI image prompts.</p>
                <p>Our platform offers a growing collection of prompts across different styles and categories, making it easy to find inspiration for your creative projects.</p>
                <p>We regularly update our library with new prompts and features to provide a smooth and enjoyable experience.</p>
                <p>Thank you for being a part of the Prompt Vault community.</p>
            `
        },
        privacy: {
            title: 'Privacy Policy',
            content: `
                <h1>Privacy Policy</h1>
                <p>At Prompt Vault, we respect your privacy.</p>
                <p>We do not collect, store, sell, or share your personal information. Prompt Vault does not request sensitive personal data such as your phone number, email address, passwords, payment information, or private messages.</p>
                <p>Basic, non-personal usage statistics, such as prompt views and copy activity, may be recorded solely to improve the Mini App and enhance the user experience. This information is not used to personally identify you.</p>
                <p>Prompt Vault may display advertisements and external links. Any interaction with third-party websites, advertisements, or services is entirely at your own discretion and subject to their respective policies.</p>
                <p>We may update this Privacy Policy from time to time. By continuing to use Prompt Vault, you acknowledge that you have read and agreed to this Privacy Policy.</p>
            `
        },
        terms: {
            title: 'Terms of Service',
            content: `
                <h1>Terms of Service</h1>
                <p>By accessing or using Prompt Vault, you agree to comply with these Terms of Service.</p>
                
                <h3>Use of the Platform</h3>
                <ul>
                    <li>Prompt Vault is provided for personal, educational, and creative purposes only.</li>
                    <li>You agree not to misuse, abuse, disrupt, or attempt to gain unauthorized access to the Mini App or its services.</li>
                </ul>
                
                <h3>Content Disclaimer</h3>
                <p>Prompt Vault is a prompt discovery platform. Images, thumbnails, titles, prompt ideas, and other publicly available content displayed within the Mini App may originate from publicly accessible sources on the internet.</p>
                <p>We do not intentionally claim ownership of third-party content unless explicitly stated. If any content belongs to its respective owner, all rights remain with the original owner.</p>
                <p>If you believe that any content displayed on Prompt Vault infringes your copyright or intellectual property rights, please contact us with the relevant details. We will review the request and, where appropriate, remove the content promptly.</p>
                
                <h3>User Responsibility</h3>
                <p>You are solely responsible for how you use any prompts, images, or information available through Prompt Vault.</p>
                <p>Any content generated using AI prompts is created through third-party AI services, and you are responsible for ensuring your use complies with the terms, policies, and applicable laws related to those services.</p>
                
                <h3>Limitation of Liability</h3>
                <p>Prompt Vault is provided on an "as is" and "as available" basis without any warranties of any kind.</p>
                <p>By using this Mini App, you acknowledge and agree that you use Prompt Vault entirely at your own risk.</p>
                <p>Prompt Vault, its developers, owners, and administrators shall not be held responsible or liable for:</p>
                <ul>
                    <li>Any loss, damage, or inconvenience resulting from the use of the Mini App.</li>
                    <li>Any misuse of prompts or generated content by users.</li>
                    <li>Any copyright, trademark, or intellectual property disputes arising from user actions.</li>
                    <li>Any issues related to third-party websites, AI platforms, advertisements, or external links.</li>
                </ul>
                
                <h3>Changes to the Service</h3>
                <p>We reserve the right to modify, suspend, or discontinue any part of Prompt Vault, including its content and features, at any time without prior notice.</p>
                
                <h3>Acceptance</h3>
                <p>By continuing to use Prompt Vault, you acknowledge that you have read, understood, and agreed to these Terms of Service.</p>
            `
        },
        contact: {
            title: 'Contact Us',
            content: `
                <h1>📬 Contact Us</h1>
                
                <p>Need help, have a suggestion, or want to report an issue? We're here to help.</p>
                
                <p>You can contact the Prompt Vault support team by messaging our official Telegram support bot:</p>
                
                <div style="
                    background: var(--bg-input);
                    border-radius: 12px;
                    padding: 16px 20px;
                    margin: 12px 0;
                    border: 1px solid var(--border-color);
                ">
                    <strong style="color: var(--text-primary);">🤖 Telegram Support:</strong><br>
                    <a href="https://t.me/ad_minn_bot" target="_blank" style="
                        display: inline-block;
                        background: linear-gradient(135deg, #0088cc, #00a2e8);
                        color: #ffffff;
                        padding: 10px 20px;
                        border-radius: 50px;
                        text-decoration: none;
                        font-weight: 600;
                        margin-top: 8px;
                        transition: all 0.3s ease;
                    " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                        <i class="fab fa-telegram"></i> Contact Us Here
                    </a>
                </div>
                
                <p>To help us respond faster, please start your message with one of the following tags:</p>
                
                <ul>
                    <li><strong>#problem</strong> – Report a bug, error, or technical issue.</li>
                    <li><strong>#request</strong> – Request a new feature, category, or prompt.</li>
                </ul>
                
                <div style="
                    background: var(--bg-input);
                    border-radius: 12px;
                    padding: 12px 16px;
                    margin: 12px 0;
                    border-left: 4px solid var(--accent-color);
                ">
                    <strong>📝 Examples:</strong><br>
                    <code style="
                        display: block;
                        padding: 6px 0;
                        font-family: monospace;
                        font-size: 14px;
                        color: var(--text-secondary);
                    ">#problem Copy button is not working.</code>
                    <code style="
                        display: block;
                        padding: 6px 0;
                        font-family: monospace;
                        font-size: 14px;
                        color: var(--text-secondary);
                    ">#request Please add more FLUX image prompts.</code>
                </div>
                
                <p style="
                    margin-top: 12px;
                    padding: 12px;
                    border-radius: 8px;
                    background: var(--chip-bg);
                    text-align: center;
                    color: var(--text-secondary);
                ">
                    <i class="fas fa-heart" style="color: #ff6b6b;"></i>
                    We appreciate your feedback and will do our best to review and respond as soon as possible.
                </p>
            `
        }
    },
    
    // Social Links
    social: {
        channel: 'https://t.me/+4s4mTS5NRi02M2E1',
        telegramGroup: 'https://t.me/+MewA_UWlGpgzNThl',
        whatsapp: 'https://www.whatsapp.com/channel/0029Vb6Uy0dCRs1phBNPrq0a',
        supportBot: 'https://t.me/ad_minn_bot'
    },
    
    // App Settings
    app: {
        name: 'Prompt Vault',
        version: '1.0.0',
        autoAdInterval: 120000,
        adCooldown: 30000,
        maxUnlockAds: 2
    },
    
    // Categories
    categories: [
        { id: 'art_styles', name: 'art styles' },
        { id: 'realistic', name: 'realistic' },
        { id: 'characters', name: 'characters' },
        { id: 'fashion', name: 'fashion' },
        { id: 'environment', name: 'environment' },
        { id: 'architecture', name: 'architecture' },
        { id: 'vehicles', name: 'vehicles' },
        { id: 'animals', name: 'animals' },
        { id: 'fantasy_sci_fi', name: 'fantasy & sci-fi' },
        { id: 'gaming', name: 'gaming' },
        { id: 'social_media', name: 'social media' },
        { id: 'business', name: 'business' },
        { id: 'occasions', name: 'occasions' },
        { id: 'ai_model', name: 'ai model' }
    ]
};
