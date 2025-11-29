/*
 * WebForge AI - Global UI Logic
 * Handles navigation, animations, toasts, and utility functions.
 */

document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initSmoothScroll();
    initScrollAnimations();
    initFormValidation();
    initSidebarToggle(); // Pour le dashboard
});

/* --- 1. Navigation & Mobile Menu --- */
function initMobileMenu() {
    const burger = document.getElementById('burger-menu');
    const nav = document.querySelector('.main-nav');
    const body = document.body;

    if (burger && nav) {
        burger.addEventListener('click', (e) => {
            e.stopPropagation();
            nav.classList.toggle('menu-open');
            burger.classList.toggle('active');
            
            // Empêcher le scroll quand le menu est ouvert
            if (nav.classList.contains('menu-open')) {
                body.style.overflow = 'hidden';
            } else {
                body.style.overflow = '';
            }
        });

        // Fermer le menu en cliquant sur un lien
        const links = nav.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('menu-open');
                burger.classList.remove('active');
                body.style.overflow = '';
            });
        });

        // Fermer en cliquant en dehors
        document.addEventListener('click', (e) => {
            if (nav.classList.contains('menu-open') && !nav.contains(e.target) && !burger.contains(e.target)) {
                nav.classList.remove('menu-open');
                burger.classList.remove('active');
                body.style.overflow = '';
            }
        });
    }
}

function initSidebarToggle() {
    // Logique spécifique au Dashboard pour mobile
    const sidebar = document.getElementById('sidebar');
    // Création dynamique du bouton toggle si on est sur une page dashboard et qu'il n'existe pas
    if (sidebar && !document.getElementById('mobile-sidebar-toggle')) {
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'mobile-sidebar-toggle';
        toggleBtn.className = 'btn-icon mobile-toggle';
        toggleBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
        toggleBtn.style.position = 'fixed';
        toggleBtn.style.bottom = '20px';
        toggleBtn.style.right = '20px';
        toggleBtn.style.zIndex = '200';
        toggleBtn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
        toggleBtn.style.display = 'none'; // Géré par CSS media queries normalement, mais forcé ici pour JS logic

        // Afficher seulement sur mobile via JS si besoin, ou laisser CSS gérer
        if (window.innerWidth <= 768) {
            toggleBtn.style.display = 'flex';
        }

        document.body.appendChild(toggleBtn);

        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });

        // Fermer la sidebar en cliquant sur le contenu principal
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.addEventListener('click', () => {
                if (sidebar.classList.contains('active')) {
                    sidebar.classList.remove('active');
                }
            });
        }
    }
}

/* --- 2. Smooth Scroll --- */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            
            if (href === '#') return;

            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/* --- 3. Scroll Animations (Intersection Observer) --- */
function initScrollAnimations() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optionnel : arrêter d'observer une fois animé
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Éléments à animer
    const animatedElements = document.querySelectorAll('.card, .stat-card, .step-card, .hero-content, .feature-content');
    
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(el);
    });

    // Classe CSS injectée dynamiquement pour l'état visible
    const style = document.createElement('style');
    style.innerHTML = `
        .visible {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);
}

/* --- 4. Form Validation --- */
function initFormValidation() {
    const forms = document.querySelectorAll('form');

    forms.forEach(form => {
        const inputs = form.querySelectorAll('input, textarea, select');

        inputs.forEach(input => {
            // Validation en temps réel lors de la perte de focus
            input.addEventListener('blur', () => {
                validateInput(input);
            });

            // Nettoyer l'erreur lors de la saisie
            input.addEventListener('input', () => {
                if (input.classList.contains('error')) {
                    input.classList.remove('error');
                    const errorMsg = input.parentElement.querySelector('.error-msg');
                    if (errorMsg) errorMsg.remove();
                }
            });
        });
    });
}

function validateInput(input) {
    if (input.hasAttribute('required') && !input.value.trim()) {
        showInputError(input, 'Ce champ est requis.');
        return false;
    }

    if (input.type === 'email' && input.value.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(input.value)) {
            showInputError(input, 'Adresse email invalide.');
            return false;
        }
    }

    if (input.type === 'password' && input.value.trim()) {
        if (input.value.length < 6) {
            showInputError(input, 'Le mot de passe doit contenir au moins 6 caractères.');
            return false;
        }
    }

    return true;
}

function showInputError(input, message) {
    // Éviter les doublons
    if (input.parentElement.querySelector('.error-msg')) return;

    input.classList.add('error');
    input.style.borderColor = '#ef4444';

    const msg = document.createElement('span');
    msg.className = 'error-msg';
    msg.style.color = '#ef4444';
    msg.style.fontSize = '0.75rem';
    msg.style.marginTop = '0.25rem';
    msg.style.display = 'block';
    msg.textContent = message;

    input.parentElement.appendChild(msg);
}

/* --- 5. Toast Notifications --- */
window.showToast = function(message, type = 'info') {
    // Créer le conteneur s'il n'existe pas
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.position = 'fixed';
        container.style.bottom = '20px';
        container.style.right = '20px';
        container.style.zIndex = '9999';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '10px';
        document.body.appendChild(container);
    }

    // Créer le toast
    const toast = document.createElement('div');
    
    // Styles de base
    toast.style.padding = '1rem 1.5rem';
    toast.style.borderRadius = '8px';
    toast.style.color = '#fff';
    toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    toast.style.minWidth = '300px';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'all 0.3s ease';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.gap = '10px';

    // Couleurs selon le type
    let icon = '';
    switch (type) {
        case 'success':
            toast.style.background = '#22c55e';
            icon = '<i class="fa-solid fa-check-circle"></i>';
            break;
        case 'error':
            toast.style.background = '#ef4444';
            icon = '<i class="fa-solid fa-circle-exclamation"></i>';
            break;
        case 'warning':
            toast.style.background = '#f59e0b';
            icon = '<i class="fa-solid fa-triangle-exclamation"></i>';
            break;
        default:
            toast.style.background = '#3b82f6';
            icon = '<i class="fa-solid fa-circle-info"></i>';
    }

    toast.innerHTML = `${icon} <span>${message}</span>`;
    container.appendChild(toast);

    // Animation d'entrée
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
    });

    // Suppression automatique
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        setTimeout(() => {
            toast.remove();
            if (container.children.length === 0) {
                container.remove();
            }
        }, 300);
    }, 4000);
};

/* --- 6. Utility Functions --- */

// Debounce : Limite la fréquence d'appel d'une fonction
window.debounce = function(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Formatage de date
window.formatDate = function(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
};

// Formatage de nombre (monétaire)
window.formatCurrency = function(amount, currency = 'EUR') {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currency
    }).format(amount);
};

// Copier dans le presse-papier
window.copyToClipboard = async function(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('Copié dans le presse-papier !', 'success');
    } catch (err) {
        console.error('Erreur copie:', err);
        showToast('Erreur lors de la copie.', 'error');
    }
};