import { supabase } from './supabaseClient.js';
import { protectPrivatePage } from './auth-oauth.js';

// Configuration
const N8N_WEBHOOK_URL = 'https://n8n.webforge.ai/webhook/generate-site'; // URL du webhook n8n

// State Management
let currentStep = 1;
const totalSteps = 5;
let currentUser = null;
let projectConfig = {
    name: '',
    description: '',
    type: '',
    style: '',
    palette: '',
    features: [],
    pages: []
};

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Protection de la page
    currentUser = await protectPrivatePage();
    if (!currentUser) return;

    // 2. Attachement des écouteurs d'événements
    const btnNext = document.getElementById('btn-next');
    const btnPrev = document.getElementById('btn-prev');
    const btnFinish = document.getElementById('btn-finish');
    const form = document.getElementById('wizard-form');

    if (btnNext) btnNext.addEventListener('click', handleNext);
    if (btnPrev) btnPrev.addEventListener('click', handlePrev);
    if (btnFinish) btnFinish.addEventListener('click', handleSubmit);
    if (form) form.addEventListener('submit', (e) => e.preventDefault());

    // 3. Exposition des fonctions de sélection pour le HTML
    window.selectCard = selectCard;
    window.selectPalette = selectPalette;

    // 4. Initialisation UI
    updateUI();
});

// --- Navigation Logic ---

function handleNext() {
    if (validateStep(currentStep)) {
        saveStepData(currentStep);
        if (currentStep < totalSteps) {
            currentStep++;
            updateUI();
        }
    }
}

function handlePrev() {
    if (currentStep > 1) {
        currentStep--;
        updateUI();
    }
}

function updateUI() {
    // 1. Afficher/Masquer les étapes
    document.querySelectorAll('.step-content').forEach(el => {
        el.classList.remove('active');
        if (el.id === `step-${currentStep}`) {
            el.classList.add('active');
        }
    });

    // 2. Mettre à jour la barre de progression
    document.querySelectorAll('.progress-step').forEach(el => {
        const stepNum = parseInt(el.dataset.step);
        el.classList.remove('active', 'completed');
        if (stepNum === currentStep) el.classList.add('active');
        if (stepNum < currentStep) el.classList.add('completed');
    });

    // 3. Visibilité des boutons
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const btnFinish = document.getElementById('btn-finish');

    if (btnPrev) btnPrev.style.visibility = currentStep === 1 ? 'hidden' : 'visible';

    if (currentStep === totalSteps) {
        if (btnNext) btnNext.classList.add('hidden');
        if (btnFinish) btnFinish.classList.remove('hidden');
    } else {
        if (btnNext) btnNext.classList.remove('hidden');
        if (btnFinish) btnFinish.classList.add('hidden');
    }
}

// --- Data Handling & Helper Functions ---

function selectCard(element, category, value) {
    // Mise à jour visuelle
    const container = element.parentElement;
    container.querySelectorAll('.selection-card').forEach(card => card.classList.remove('selected'));
    element.classList.add('selected');

    // Mise à jour de l'input caché
    const inputId = `project-${category}`;
    const input = document.getElementById(inputId);
    if (input) input.value = value;

    // Mise à jour de l'état local
    projectConfig[category] = value;

    // Effets de bord (ex: suggestions de pages selon le type)
    if (category === 'type') {
        updatePagesSuggestion(value);
    }
}

function selectPalette(element, value) {
    const container = element.parentElement;
    container.querySelectorAll('.palette-option').forEach(opt => opt.classList.remove('selected'));
    element.classList.add('selected');

    const input = document.getElementById('project-palette');
    if (input) input.value = value;
    
    projectConfig.palette = value;
}

function updatePagesSuggestion(type) {
    const container = document.getElementById('pages-list');
    if (!container) return;

    let pages = [];
    switch(type) {
        case 'portfolio':
            pages = ['Projects', 'About', 'Contact', 'Resume'];
            break;
        case 'business':
            pages = ['Services', 'About', 'Team', 'Contact', 'Pricing'];
            break;
        case 'ecommerce':
            pages = ['Shop', 'Collections', 'About', 'Contact', 'FAQ'];
            break;
        case 'landing':
            pages = ['Features', 'Testimonials', 'Pricing', 'Contact'];
            break;
        default:
            pages = ['About', 'Contact'];
    }

    let html = `
        <label class="feature-checkbox">
            <input type="checkbox" name="pages" value="home" checked disabled>
            <span>Accueil (Home)</span>
        </label>
    `;

    pages.forEach(page => {
        html += `
            <label class="feature-checkbox">
                <input type="checkbox" name="pages" value="${page.toLowerCase()}" checked>
                <span>${page}</span>
            </label>
        `;
    });

    container.innerHTML = html;
}

function validateStep(step) {
    const stepEl = document.getElementById(`step-${step}`);
    if (!stepEl) return false;

    // Validation des inputs requis
    const requiredInputs = stepEl.querySelectorAll('input[required], textarea[required]');
    let isValid = true;

    requiredInputs.forEach(input => {
        if (!input.value.trim()) {
            isValid = false;
            highlightError(input);
        } else {
            clearError(input);
        }
    });

    // Validation des sélections (Type, Style) via inputs cachés
    if (step === 2) {
        const typeInput = document.getElementById('project-type');
        if (!typeInput || !typeInput.value) {
            isValid = false;
            showToast('Veuillez sélectionner un type de site.', 'warning');
        }
    }

    if (step === 3) {
        const styleInput = document.getElementById('project-style');
        if (!styleInput || !styleInput.value) {
            isValid = false;
            showToast('Veuillez sélectionner un style.', 'warning');
        }
    }

    return isValid;
}

function highlightError(input) {
    input.style.borderColor = '#ef4444';
    // Animation de secousse optionnelle via CSS
}

function clearError(input) {
    input.style.borderColor = '';
}

function saveStepData(step) {
    const formData = new FormData(document.getElementById('wizard-form'));
    
    // Mise à jour de l'objet de configuration
    if (step === 1) {
        projectConfig.name = formData.get('name');
        projectConfig.description = formData.get('description');
    }
    // Les étapes 2 et 3 mettent à jour projectConfig via les fonctions selectCard/selectPalette
    if (step === 4) {
        projectConfig.features = formData.getAll('features');
    }
    if (step === 5) {
        projectConfig.pages = formData.getAll('pages');
    }
}

// --- Submission ---

async function handleSubmit() {
    // Validation finale
    if (!validateStep(currentStep)) return;
    
    // Sauvegarde des dernières données
    saveStepData(currentStep);

    // Affichage du loader
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.style.display = 'flex';

    try {
        // 1. Création du projet dans Supabase
        const { data: project, error: dbError } = await supabase
            .from('projects')
            .insert([
                {
                    user_id: currentUser.id,
                    name: projectConfig.name,
                    type: projectConfig.type,
                    status: 'pending', // Statut initial
                    config_json: projectConfig
                }
            ])
            .select()
            .single();

        if (dbError) throw dbError;

        console.log('Projet créé avec succès:', project.id);

        // 2. Déclenchement du Webhook n8n
        try {
            const webhookResponse = await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    projectId: project.id,
                    userId: currentUser.id,
                    config: projectConfig,
                    timestamp: new Date().toISOString()
                })
            });

            if (!webhookResponse.ok) {
                console.warn('Avertissement Webhook:', await webhookResponse.text());
            }
        } catch (webhookErr) {
            console.error('Erreur appel Webhook:', webhookErr);
            // On ne bloque pas le flux car le projet est créé en base
        }

        // 3. Redirection vers le Dashboard
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);

    } catch (err) {
        console.error('Erreur soumission:', err);
        if (overlay) overlay.style.display = 'none';
        alert('Une erreur est survenue lors de la création du projet. Veuillez réessayer.');
    }
}

// Helper pour les Toasts (utilise script.js si disponible)
function showToast(msg, type) {
    if (window.showToast) {
        window.showToast(msg, type);
    } else {
        alert(msg);
    }
}