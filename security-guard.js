// ==================== SECURITY GUARD - REPO 1 (GUEST HUB + STAFF) ====================
// Protection adaptée pour les applications clients et staff

(function() {
    'use strict';
    
    const CONFIG = {
        enabled: true,
        logging: true,
        maskSensitiveData: true,
        appType: 'guest_hub_staff', // Identifiant du repo
        protectedPages: ['staff-dashboard.html', 'index.html']
    };
    
    // Détection de la page actuelle
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const isStaffPage = currentPage.includes('staff');
    const isGuestPage = currentPage.includes('index');
    
    // ==================== JOURNALISATION ====================
    function logActivity(action, details = {}) {
        if (!CONFIG.logging) return;
        
        try {
            const logEntry = {
                timestamp: new Date().toISOString(),
                repo: CONFIG.appType,
                page: currentPage,
                pageType: isStaffPage ? 'staff' : 'guest',
                action: action,
                details: details,
                userRole: localStorage.getItem('userRole') || (isStaffPage ? 'staff_unknown' : 'guest'),
                roomNumber: localStorage.getItem('roomNumber') || null
            };
            
            console.log('🔒 Security:', logEntry);
            
            // Stockage local avec rotation
            const logs = JSON.parse(localStorage.getItem('security_logs_repo1') || '[]');
            logs.push(logEntry);
            
            if (logs.length > 200) {
                logs.splice(0, logs.length - 200);
            }
            
            localStorage.setItem('security_logs_repo1', JSON.stringify(logs));
        } catch (e) {
            // Silencieux
        }
    }
    
    // ==================== PROTECTION SPÉCIFIQUE STAFF ====================
    function protectStaffPages() {
        if (!isStaffPage) return;
        
        // Vérifier l'authentification staff (douce)
        const staffSession = sessionStorage.getItem('staffSession');
        const staffRole = localStorage.getItem('userRole');
        
        if (!staffSession && !staffRole) {
            console.log('🔒 Staff non authentifié - mode surveillance');
            logActivity('staff_unauthenticated_access');
            
            // Ne pas bloquer, juste avertir
            // Optionnel : afficher un badge discret
            showDiscreetWarning('Mode surveillance - Staff non authentifié');
        } else {
            logActivity('staff_authenticated', { role: staffRole });
        }
        
        // Protéger les actions sensibles du staff
        document.addEventListener('click', function(e) {
            const target = e.target.closest('[data-staff-action]');
            
            if (target) {
                const action = target.getAttribute('data-staff-action');
                logActivity('staff_action', { 
                    action: action,
                    element: target.textContent.trim()
                });
            }
        });
    }
    
    // ==================== PROTECTION SPÉCIFIQUE GUEST ====================
    function protectGuestPages() {
        if (!isGuestPage) return;
        
        // Vérifier la session guest
        const roomNumber = localStorage.getItem('roomNumber');
        const guestName = localStorage.getItem('guestName');
        
        if (roomNumber && guestName) {
            logActivity('guest_session_active', { 
                room: roomNumber,
                name: guestName
            });
        }
        
        // Protéger les données personnelles
        maskGuestData();
    }
    
    // ==================== MASQUAGE DES DONNÉES ====================
    function maskGuestData() {
        if (!CONFIG.maskSensitiveData) return;
        
        // Masquer les noms complets dans les tableaux staff
        if (isStaffPage) {
            document.querySelectorAll('[data-mask="fullname"]').forEach(el => {
                const name = el.textContent;
                if (name && name.length > 3) {
                    const parts = name.split(' ');
                    if (parts.length > 1) {
                        el.textContent = parts[0] + ' ' + parts[1].charAt(0) + '.';
                    }
                }
            });
        }
        
        // Masquer les emails
        document.querySelectorAll('[data-mask="email"]').forEach(el => {
            const email = el.textContent;
            if (email && email.includes('@')) {
                const [local, domain] = email.split('@');
                if (local.length > 2) {
                    el.textContent = local.slice(0, 2) + '***@' + domain;
                }
            }
        });
        
        // Masquer les téléphones
        document.querySelectorAll('[data-mask="phone"]').forEach(el => {
            const phone = el.textContent;
            if (phone && phone.length > 6) {
                el.textContent = phone.slice(0, -4).replace(/./g, '*') + phone.slice(-4);
            }
        });
    }
    
    // ==================== AVERTISSEMENT DISCRET ====================
    function showDiscreetWarning(message) {
        const warning = document.createElement('div');
        warning.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: rgba(0,0,0,0.8);
            color: #DCA773;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 10px;
            z-index: 9999;
            border: 1px solid #DCA773;
            pointer-events: none;
        `;
        warning.textContent = '🔒 ' + message;
        document.body.appendChild(warning);
        
        setTimeout(() => warning.remove(), 5000);
    }
    
    // ==================== VALIDATION DOUCE ====================
    function setupInputValidation() {
        document.addEventListener('input', function(e) {
            const target = e.target;
            
            // Valider les champs de chambre
            if (target.id === 'lockRoomInput' || target.id === 'guestRoomInput') {
                target.value = target.value.replace(/[<>'"]/g, '').slice(0, 10);
            }
            
            // Valider les champs de nom
            if (target.id === 'lockNameInput' || target.id === 'guestNameInput') {
                target.value = target.value.replace(/[<>'"]/g, '').slice(0, 50);
            }
        });
    }
    
    // ==================== INITIALISATION ====================
    function init() {
        if (!CONFIG.enabled) return;
        
        logActivity('app_loaded');
        
        document.addEventListener('DOMContentLoaded', function() {
            // Protections spécifiques
            protectStaffPages();
            protectGuestPages();
            
            // Masquage initial
            maskGuestData();
            
            // Validation des entrées
            setupInputValidation();
            
            logActivity('dom_ready');
        });
        
        // Observer les changements pour masquer les nouvelles données
        const observer = new MutationObserver(function() {
            if (CONFIG.maskSensitiveData) {
                maskGuestData();
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    init();
    
    // Exposer les fonctions
    window.securityGuard = {
        log: logActivity,
        mask: maskGuestData
    };
    
})();
