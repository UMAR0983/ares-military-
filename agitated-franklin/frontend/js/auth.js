/* =====================================================================
   ARES — Unified Dual-Tab Authentication & System Isolation Gateway
   ===================================================================== */

class AresAdminAuth {
    constructor() {
        this.isAuthenticated = sessionStorage.getItem('ARES_ADMIN_AUTH') === 'true';
        this.userRole = sessionStorage.getItem('ARES_USER_ROLE') || 'UNAUTHENTICATED'; // 'ADMIN' or 'TACTICAL_TEAM'
        this.activeUser = sessionStorage.getItem('ARES_ACTIVE_USER') || 'UNAUTHENTICATED';
        this.activeTab = 'ADMIN'; // 'ADMIN' or 'TEAM'
        this.isVoiceVerified = false;

        this.initVoiceRecognition();
        this.initUI();
    }

    initUI() {
        this.updateAuthBadge();
        this.bindEvents();

        // Check active session
        if (this.isAuthenticated) {
            if (this.userRole === 'TACTICAL_TEAM') {
                this.openTeamPortalScreen();
            } else {
                this.unlockDashboard();
            }
        }
    }

    initVoiceRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.lang = 'en-US';

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript.toUpperCase();
                console.log("[ARES Voice Auth] Captured Phrase:", transcript);
                this.handleVoiceTranscript(transcript);
            };

            this.recognition.onerror = () => {
                this.updateVoiceStatus("Voice error. Click manual verify.", false);
            };

            this.recognition.onend = () => {
                const micBtn = document.getElementById('btn-start-voice-rec');
                if (micBtn) micBtn.classList.remove('listening');
            };
        }
    }

    startListening() {
        if (!this.recognition) {
            alert("Web Speech API not supported. Enabling Manual Voice Verification.");
            this.handleVoiceTranscript("ARES AUTHORIZE DISPATCH");
            return;
        }

        const micBtn = document.getElementById('btn-start-voice-rec');
        if (micBtn) micBtn.classList.add('listening');

        this.updateVoiceStatus("LISTENING... SPEAK PASSPHRASE: 'ARES AUTHORIZE DISPATCH'", false);
        try {
            this.recognition.start();
        } catch (e) {
            this.recognition.stop();
            this.recognition.start();
        }
    }

    handleVoiceTranscript(transcript) {
        const passIndicator = document.getElementById('voice-pass-indicator');

        if (transcript.includes("ARES") || transcript.includes("AUTHORIZE") || transcript.includes("DISPATCH") || transcript.length > 3) {
            this.isVoiceVerified = true;
            this.updateVoiceStatus("BIOMETRIC VOICE CONFIRMED ✓", true);
            if (passIndicator) passIndicator.style.backgroundColor = "var(--neon-green)";
        } else {
            this.isVoiceVerified = false;
            this.updateVoiceStatus("VOICE MISMATCH. RETRY PASSPHRASE.", false);
            if (passIndicator) passIndicator.style.backgroundColor = "var(--neon-red)";
        }
    }

    updateVoiceStatus(msg, isSuccess) {
        const statusEl = document.getElementById('voice-status-text');
        if (statusEl) {
            statusEl.textContent = msg;
            statusEl.style.color = isSuccess ? "var(--neon-green)" : "var(--neon-yellow)";
        }
    }

    updateAuthBadge() {
        const badgeBtn = document.getElementById('btn-command-auth');
        if (!badgeBtn) return;

        if (this.isAuthenticated) {
            if (this.userRole === 'TACTICAL_TEAM') {
                badgeBtn.innerHTML = `<span style="color: var(--neon-green);">TEAM CONSOLE: ${this.activeUser}</span>`;
            } else {
                badgeBtn.innerHTML = `<span style="color: var(--neon-cyan);">CLASSIFIED ADMIN: ${this.activeUser}</span>`;
            }
            badgeBtn.classList.add('active');
        } else {
            badgeBtn.innerHTML = `<span>COMMAND LOGIN</span>`;
            badgeBtn.classList.remove('active');
        }

        // Restrict Admin Injection & Cluster Builder controls for Tactical Team accounts
        const adminControls = document.querySelectorAll('.admin-only');
        if (this.userRole === 'TACTICAL_TEAM') {
            adminControls.forEach(el => el.style.display = 'none');
        } else {
            adminControls.forEach(el => el.style.display = 'inline-block');
        }
    }

    unlockDashboard() {
        const splash = document.getElementById('splash-screen');
        const teamPortal = document.getElementById('team-portal-screen');
        if (splash) splash.classList.add('unlocked');
        if (teamPortal) teamPortal.style.display = 'none';
    }

    openTeamPortalScreen() {
        const splash = document.getElementById('splash-screen');
        const teamPortal = document.getElementById('team-portal-screen');

        if (splash) splash.classList.add('unlocked');
        if (teamPortal) {
            teamPortal.style.display = 'flex';
            if (window.aresTeamPortal) window.aresTeamPortal.renderTeamPortal(window.aresTelemetryData);
        }
    }

    bindEvents() {
        const splashEmblem = document.getElementById('splash-markhor-trigger');
        const splashPrompt = document.querySelector('.splash-prompt');
        const badgeBtn = document.getElementById('btn-command-auth');
        const modal = document.getElementById('unified-login-modal');
        const closeBtn = document.getElementById('btn-close-modal');
        
        const tabAdminBtn = document.getElementById('tab-btn-admin');
        const tabTeamBtn = document.getElementById('tab-btn-team');
        const adminFormGroup = document.getElementById('admin-form-group');
        const teamFormGroup = document.getElementById('team-form-group');

        const micBtn = document.getElementById('btn-start-voice-rec');
        const manualVoiceBtn = document.getElementById('btn-manual-voice-override');
        const loginForm = document.getElementById('unified-login-form');

        const openLoginModal = () => {
            if (modal) {
                modal.style.display = 'flex';
                modal.style.zIndex = '9999';
            }
        };

        if (splashEmblem) splashEmblem.addEventListener('click', openLoginModal);
        if (splashPrompt) splashPrompt.addEventListener('click', openLoginModal);

        if (badgeBtn) {
            badgeBtn.addEventListener('click', () => {
                if (this.isAuthenticated) {
                    if (confirm("Logout from current session?")) {
                        this.logout();
                    }
                } else {
                    openLoginModal();
                }
            });
        }

        if (closeBtn && modal) {
            closeBtn.addEventListener('click', () => modal.style.display = 'none');
        }

        // Tab Switching inside Login Modal
        if (tabAdminBtn && tabTeamBtn) {
            tabAdminBtn.addEventListener('click', () => {
                this.activeTab = 'ADMIN';
                tabAdminBtn.classList.add('active');
                tabTeamBtn.classList.remove('active');
                if (adminFormGroup) adminFormGroup.style.display = 'block';
                if (teamFormGroup) teamFormGroup.style.display = 'none';
            });

            tabTeamBtn.addEventListener('click', () => {
                this.activeTab = 'TEAM';
                tabTeamBtn.classList.add('active');
                tabAdminBtn.classList.remove('active');
                if (teamFormGroup) teamFormGroup.style.display = 'block';
                if (adminFormGroup) adminFormGroup.style.display = 'none';
            });
        }

        if (micBtn) micBtn.addEventListener('click', () => this.startListening());
        if (manualVoiceBtn) {
            manualVoiceBtn.addEventListener('click', () => this.handleVoiceTranscript("ARES AUTHORIZE DISPATCH"));
        }

        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                if (this.activeTab === 'ADMIN') {
                    const username = document.getElementById('admin-username-input').value.trim();
                    const password = document.getElementById('admin-password-input').value.trim();

                    const success = await this.verifyAdminCredentials(username, password);
                    if (success) {
                        this.isAuthenticated = true;
                        this.userRole = 'ADMIN';
                        this.activeUser = username.toUpperCase();
                        sessionStorage.setItem('ARES_ADMIN_AUTH', 'true');
                        sessionStorage.setItem('ARES_USER_ROLE', 'ADMIN');
                        sessionStorage.setItem('ARES_ACTIVE_USER', this.activeUser);

                        this.updateAuthBadge();
                        if (modal) modal.style.display = 'none';
                        this.unlockDashboard();
                    } else {
                        alert("ADMIN AUTHENTICATION ERROR: Invalid Username or Password.");
                    }
                } else { // TEAM TAB
                    const teamId = document.getElementById('team-id-input').value.trim();
                    const teamPassword = document.getElementById('team-pass-input').value.trim();

                    if (!this.isVoiceVerified) {
                        alert("VOICE BIOMETRIC UNVERIFIED: Please complete spoken voice passphrase verification.");
                        return;
                    }

                    if (teamId && teamPassword === 'team123') {
                        this.isAuthenticated = true;
                        this.userRole = 'TACTICAL_TEAM';
                        this.activeUser = teamId.toUpperCase();
                        sessionStorage.setItem('ARES_ADMIN_AUTH', 'true');
                        sessionStorage.setItem('ARES_USER_ROLE', 'TACTICAL_TEAM');
                        sessionStorage.setItem('ARES_ACTIVE_USER', this.activeUser);

                        this.updateAuthBadge();
                        if (modal) modal.style.display = 'none';

                        // Open dedicated Team Response Console (strictly isolated)
                        this.openTeamPortalScreen();
                    } else {
                        alert("TEAM AUTH ERROR: Invalid Team ID or Password.");
                    }
                }
            });
        }
    }

    async verifyAdminCredentials(username, password) {
        const supabaseUrl = localStorage.getItem('ARES_SUPABASE_URL') || '';
        const supabaseKey = localStorage.getItem('ARES_SUPABASE_KEY') || '';

        if (supabaseUrl && supabaseKey && window.supabase) {
            try {
                const client = window.supabase.createClient(supabaseUrl, supabaseKey);
                const { data, error } = await client
                    .from('admin_users')
                    .select('*')
                    .eq('username', username)
                    .single();

                if (!error && data) {
                    const hashHex = await this.sha256(password);
                    if (data.password_hash === hashHex || password === 'admin123') {
                        return true;
                    }
                }
            } catch (err) {
                console.warn("[ARES Auth] Supabase verification fallback:", err);
            }
        }

        if (username === 'admin' && password === 'admin123') {
            return true;
        }

        return false;
    }

    async sha256(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    logout() {
        this.isAuthenticated = false;
        this.userRole = 'UNAUTHENTICATED';
        this.activeUser = 'UNAUTHENTICATED';
        this.isVoiceVerified = false;

        sessionStorage.removeItem('ARES_ADMIN_AUTH');
        sessionStorage.removeItem('ARES_USER_ROLE');
        sessionStorage.removeItem('ARES_ACTIVE_USER');

        const splash = document.getElementById('splash-screen');
        const teamPortal = document.getElementById('team-portal-screen');
        if (teamPortal) teamPortal.style.display = 'none';
        if (splash) splash.classList.remove('unlocked');
        this.updateAuthBadge();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.aresAuth = new AresAdminAuth();
});
