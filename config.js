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
        folder: 'prompt-vault/thumbnails',
        apiKey: '691757121814478',
        apiSecret: 'K0z-8uzeg_YWVMPYHTSpAwXrY6U'
    },
    
    // Monetag Ad Configuration
    monetag: {
        zoneId: '11417937',
        sdkUrl: '//libtl.com/sdk.js'
    },
    
    // All Links
    links: {
        about: 'https://telegra.ph/About-Prompt-Vault-07-27',
        privacy: 'https://telegra.ph/Privacy-Policy-07-27-120',
        terms: 'https://telegra.ph/Terms-of-Service-07-27-12',
        channel: 'https://t.me/+4s4mTS5NRi02M2E1',
        contact: 'https://telegra.ph/Contact-07-27-8',
        telegramGroup: 'https://t.me/+MewA_UWlGpgzNThl'
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