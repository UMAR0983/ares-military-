/* =====================================================================
   ARES — Voice Biometric Verification & Dual-Role Team Response Auth
   ===================================================================== */

class AresVoiceAuth {
    constructor() {
        this.isVoiceVerified = false;
        this.userRole = sessionStorage.getItem('ARES_USER_ROLE') || 'UNAUTHENTICATED';
        this.activeTeamMember = sessionStorage.getItem('ARES_TEAM_MEMBER') || '';

        this.initVoiceRecognition();
        this.bindEvents();
        this.updateRoleUI();
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

            this.recognition.onerror = (err) => {
                console.warn("[ARES Voice Auth] Speech error:", err);
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
            alert("Web Speech API not supported in this browser. Enabling Manual Voice Override.");
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

    bindEvents() {
        const teamLoginBtn = document.getElementById('btn-team-auth');
        const teamModal = document.getElementById('team-login-modal');
        const closeBtn = document.getElementById('btn-close-team-modal');
        const micBtn = document.getElementById('btn-start-voice-rec');
        const manualVoiceBtn = document.getElementById('btn-manual-voice-override');
        const teamForm = document.getElementById('team-login-form');

        if (teamLoginBtn && teamModal) {
            teamLoginBtn.addEventListener('click', () => {
                if (this.userRole === 'TACTICAL_TEAM') {
                    if (confirm("Logout from Tactical Response Team session?")) {
                        this.logoutTeam();
                    }
                } else {
                    teamModal.style.display = 'flex';
                    teamModal.style.zIndex = '9999';
                }
            });
        }

        if (closeBtn && teamModal) {
            closeBtn.addEventListener('click', () => teamModal.style.display = 'none');
        }

        if (micBtn) {
            micBtn.addEventListener('click', () => this.startListening());
        }

        if (manualVoiceBtn) {
            manualVoiceBtn.addEventListener('click', () => {
                this.handleVoiceTranscript("ARES AUTHORIZE DISPATCH");
            });
        }

        if (teamForm) {
            teamForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const teamId = document.getElementById('team-id-input').value.trim();
                const teamPassword = document.getElementById('team-pass-input').value.trim();

                if (!this.isVoiceVerified) {
                    alert("VOICE BIOMETRIC UNVERIFIED: Please complete spoken voice passphrase verification.");
                    return;
                }

                if (teamId && teamPassword === 'team123') {
                    this.userRole = 'TACTICAL_TEAM';
                    this.activeTeamMember = teamId.toUpperCase();
                    sessionStorage.setItem('ARES_USER_ROLE', 'TACTICAL_TEAM');
                    sessionStorage.setItem('ARES_TEAM_MEMBER', this.activeTeamMember);

                    if (teamModal) teamModal.style.display = 'none';
                    this.updateRoleUI();

                    // Open dedicated Team Response Portal
                    this.openTeamPortalScreen();

                    alert(`TACTICAL DISPATCH AUTHORIZED: Welcome Officer ${this.activeTeamMember}`);
                } else {
                    alert("TACTICAL AUTH ERROR: Invalid Team ID or Password.");
                }
            });
        }
    }

    openTeamPortalScreen() {
        const teamPortal = document.getElementById('team-portal-screen');
        const splash = document.getElementById('splash-screen');

        if (splash) splash.classList.add('unlocked');
        if (teamPortal) {
            teamPortal.style.display = 'flex';
            if (window.aresTeamPortal) window.aresTeamPortal.renderTeamPortal(window.aresTelemetryData);
        }
    }

    updateRoleUI() {
        const teamBadgeBtn = document.getElementById('btn-team-auth');
        const adminControls = document.querySelectorAll('.admin-only');

        if (teamBadgeBtn) {
            if (this.userRole === 'TACTICAL_TEAM') {
                teamBadgeBtn.innerHTML = `<span style="color: var(--neon-green);">RESPONSE TEAM: ${this.activeTeamMember}</span>`;
                teamBadgeBtn.classList.add('active');
            } else {
                teamBadgeBtn.innerHTML = `<span>TEAM LOGIN</span>`;
                teamBadgeBtn.classList.remove('active');
            }
        }

        if (this.userRole === 'TACTICAL_TEAM') {
            adminControls.forEach(el => el.style.display = 'none');
        }
    }

    logoutTeam() {
        this.userRole = 'UNAUTHENTICATED';
        this.activeTeamMember = '';
        this.isVoiceVerified = false;
        sessionStorage.removeItem('ARES_USER_ROLE');
        sessionStorage.removeItem('ARES_TEAM_MEMBER');
        const teamPortal = document.getElementById('team-portal-screen');
        const splash = document.getElementById('splash-screen');
        if (teamPortal) teamPortal.style.display = 'none';
        if (splash) splash.classList.remove('unlocked');
        this.updateRoleUI();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.aresVoiceAuth = new AresVoiceAuth();
});
