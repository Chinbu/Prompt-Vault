/* Rotating ad-gate system */

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
        let win = window.open(url1, '_blank', 'noopener,noreferrer');

        if (!win) {
            const url2 = this.networks[this.index % this.networks.length];
            this.index++;
            win = window.open(url2, '_blank', 'noopener,noreferrer');
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
            action();
        } else {
            this.rotator.next();
            this.progress[key] = shown + 1;
            if (this.onProgress) this.onProgress(key, this.progress[key], needed);
        }
    }
}

window.adRotator = new AdRotator(CONFIG.ads.networks);
window.adGate = new AdGate(window.adRotator);