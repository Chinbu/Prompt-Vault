// ============================================================
// PROMPT VAULT - Configuration
// ============================================================

const CONFIG = {
    supabase: {
        url: 'https://lbwkvkawmfjeyerwhrcv.supabase.co',
        anonKey: 'sb_publishable_gmazfjkeAqRkWm5239pJSg_zPnKk5zE'
    },

    // ⭐ ImgBB — 2 API keys with automatic fallback
    imgbb: {
        apiKeys: [
            '122af555b20f19576ccc38e1719a0e4f',
            'd5b5d8ca4f3a3c0a1e2248d121111692'
        ]
    },

    ads: {
        networks: [
            'https://omg10.com/4/11251409',
            'https://omg10.com/4/9965491'
        ],
        requiredAds: {
            default: 1,
            copyPrompt: 3
        }
    },

    admin: {
        enabled: true,
        logoClicksRequired: 5,
        clickWindowMs: 2000
    },

    pages: {
        about: {
            title: 'About',
            content: `
                <h1>About Prompt Vault</h1>
                <p>Welcome to Prompt Vault, a platform designed to help creators discover and use high-quality AI image prompts.</p>
                <p>Our platform offers a growing collection of prompts across different styles and categories.</p>
                <p>We regularly update our library with new prompts and features.</p>
                <p>Thank you for being part of the Prompt Vault community.</p>`
        },
        privacy: {
            title: 'Privacy',
            content: `
                <h1>Privacy Policy</h1>
                <p>At Prompt Vault, we respect your privacy.</p>
                <p>We do not collect, store, sell, or share your personal information.</p>
                <p>Basic non-personal usage stats may be recorded solely to improve the platform.</p>
                <p>We may display advertisements and external links. Interaction with third-party services is at your own discretion.</p>`
        },
        terms: {
            title: 'Terms',
            content: `
                <h1>Terms of Service</h1>
                <p>By accessing Prompt Vault, you agree to comply with these Terms.</p>
                <h3>Use of the Platform</h3>
                <ul><li>For personal, educational, and creative purposes only.</li><li>Do not misuse or disrupt the platform.</li></ul>
                <h3>Content Disclaimer</h3>
                <p>Images and content may originate from publicly accessible sources. If you believe content infringes your rights, contact us for removal.</p>
                <h3>Limitation of Liability</h3>
                <p>Provided on an "as is" basis without warranties. Use at your own risk.</p>`
        },
        contact: {
            title: 'Contact',
            content: `
                <h1>📬 Contact Us</h1>
                <p>Need help, have a suggestion, or want to report an issue?</p>
                <div style="background:var(--bg-input);border-radius:12px;padding:16px;margin:12px 0;border:1px solid var(--border-color);">
                    <strong>🤖 Telegram Support:</strong><br>
                    <a href="https://t.me/ad_minn_bot" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#0088cc,#00a2e8);color:#fff;padding:10px 20px;border-radius:50px;text-decoration:none;font-weight:600;margin-top:8px;">
                        <i class="fab fa-telegram"></i> Contact Us Here
                    </a>
                </div>
                <p>Please start your message with <strong>#problem</strong> or <strong>#request</strong>.</p>`
        }
    },

    social: {
        channel: 'https://t.me/+4s4mTS5NRi02M2E1',
        telegramGroup: 'https://t.me/+MewA_UWlGpgzNThl',
        whatsapp: 'https://www.whatsapp.com/channel/0029Vb6Uy0dCRs1phBNPrq0a',
        supportBot: 'https://t.me/ad_minn_bot'
    },

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