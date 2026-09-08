// ==================== SECURITY GUARD - REPO 2 (PMS + LAUNDRY VALET) ====================
// Protection adaptée pour l'import PMS et le service laundry

(function() {
    'use strict';
    
    const CONFIG = {
        enabled: true,
        logging: true,
        maskSensitiveData: true,
        appType: 'pms_laundry_valet',
        maxFileSize: 5 * 1024 * 1024, // 5 MB
        allowedFileTypes: ['.csv', '.xlsx', '.xls']
    };
    
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const isPMSPage = currentPage.includes('mass') || currentPage.includes('pms') || currentPage.includes('entry');
    const isLaundryValet = currentPage.includes('laundry') || currentPage.includes('valet');
    
    // ==================== JOURNALISATION ====================
    function logActivity(action, details = {}) {
        if (!CONFIG.logging) return;
        
        try {
            const logEntry = {
                timestamp: new Date().toISOString(),
                repo: CONFIG.appType,
                page: currentPage,
                pageType: isPMSPage ? 'pms_entry' : 'laundry_valet',
                action: action,
                details: details,
                userRole: localStorage.getItem('userRole') || 'unknown'
            };
            
            console.log('🔒 Security:', logEntry);
            
            const logs = JSON.parse(localStorage.getItem('security_logs_repo2') || '[]');
            logs.push(logEntry);
            
            if (logs.length > 200) {
                logs.splice(0, logs.length - 200);
            }
            
            localStorage.setItem('security_logs_repo2', JSON.stringify(logs));
        } catch (e) {}
    }
    
    // ==================== PROTECTION PMS ENTRY ====================
    function protectPMSEntry() {
        if (!isPMSPage) return;
        
        logActivity('pms_page_accessed');
        
        // Protéger l'upload de fichiers
        document.addEventListener('change', function(e) {
            const target = e.target;
            
            if (target.type === 'file') {
                const file = target.files[0];
                
                if (file) {
                    // Vérifier la taille
                    if (file.size > CONFIG.maxFileSize) {
                        logActivity('pms_file_too_large', { 
                            fileName: file.name,
                            size: file.size 
                        });
                        alert('⚠️ Fichier trop volumineux (max 5 MB)');
                        target.value = '';
                        return;
                    }
                    
                    // Vérifier le type
                    const extension = '.' + file.name.split('.').pop().toLowerCase();
                    if (!CONFIG.allowedFileTypes.includes(extension)) {
                        logActivity('pms_file_invalid_type', { 
                            fileName: file.name,
                            extension: extension 
                        });
                        alert('⚠️ Format non supporté. Utilisez CSV ou Excel');
                        target.value = '';
                        return;
                    }
                    
                    logActivity('pms_file_uploaded', { 
                        fileName: file.name,
                        size: file.size 
                    });
                }
            }
        });
    }
    
    // ==================== PROTECTION LAUNDRY VALET ====================
    function protectLaundryValet() {
        if (!isLaundryValet) return;
        
        logActivity('laundry_valet_accessed');
        
        // Vérifier la session partagée
        const guestSession = localStorage.getItem('guestHub_session');
        if (guestSession) {
            logActivity('shared_session_active');
        }
        
        // Protéger les prix (empêcher la modification)
        document.addEventListener('input', function(e) {
            const target = e.target;
            
            if (target.classList.contains('price-field') || 
                target.id.includes('price')) {
                // Ne pas permettre la modification des prix
                target.readOnly = true;
                logActivity('price_modification_blocked');
            }
        });
    }
    
    // ==================== MASQUAGE DES DONNÉES CLIENTS ====================
    function maskClientData() {
        if (!CONFIG.maskSensitiveData) return;
        
        // Dans le PMS Entry, masquer les données sensibles affichées
        document.querySelectorAll('[data-mask="guest-name"]').forEach(el => {
            const name = el.textContent;
            if (name && name.length > 3) {
                const parts = name.split(' ');
                if (parts.length > 1) {
                    el.textContent = parts[0] + ' ' + parts[1].charAt(0) + '.';
                }
            }
        });
    }
    
    // ==================== INITIALISATION ====================
    function init() {
        if (!CONFIG.enabled) return;
        
        logActivity('app_loaded');
        
        document.addEventListener('DOMContentLoaded', function() {
            protectPMSEntry();
            protectLaundryValet();
            maskClientData();
            logActivity('dom_ready');
        });
        
        const observer = new MutationObserver(function() {
            maskClientData();
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    init();
    
    window.securityGuard = {
        log: logActivity,
        mask: maskClientData
    };
    
})();
