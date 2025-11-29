import { supabase } from './supabaseClient.js'

/**
 * Connexion avec Email et Mot de passe
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<{data: any, error: any}>}
 */
export async function loginWithEmail(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    })
    return { data, error }
}

/**
 * Inscription avec Email et Mot de passe
 * @param {string} email 
 * @param {string} password 
 * @param {object} metaData - Données supplémentaires (ex: full_name)
 * @returns {Promise<{data: any, error: any}>}
 */
export async function registerWithEmail(email, password, metaData = {}) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: metaData
        }
    })
    return { data, error }
}

/**
 * Connexion via OAuth (Google, GitHub, etc.)
 * @param {string} provider - 'google' | 'github'
 */
export async function loginWithOAuth(provider) {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
            redirectTo: window.location.origin + '/dashboard.html'
        }
    })
    
    if (error) {
        console.error('OAuth Error:', error)
    }
    
    return { data, error }
}

/**
 * Déconnexion de l'utilisateur
 */
export async function logout() {
    const { error } = await supabase.auth.signOut()
    if (error) {
        console.error('Logout Error:', error)
    } else {
        window.location.href = 'index.html'
    }
}

/**
 * Vérifie la session active sans rediriger
 * Utile pour les pages publiques adaptatives (Navbar)
 * @returns {Promise<object|null>} Session object or null
 */
export async function checkSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
        console.error('Session Check Error:', error)
        return null
    }
    
    return session
}

/**
 * Protège une page privée
 * Redirige vers login.html si l'utilisateur n'est pas connecté
 * @returns {Promise<object|null>} User object if connected
 */
export async function protectPrivatePage() {
    const session = await checkSession()
    
    if (!session) {
        // Sauvegarde l'URL actuelle pour redirection après login (optionnel)
        // sessionStorage.setItem('redirect_to', window.location.href)
        window.location.href = 'login.html'
        return null
    }
    
    return session.user
}

/**
 * Réinitialisation du mot de passe
 * @param {string} email 
 * @returns {Promise<{data: any, error: any}>}
 */
export async function resetPassword(email) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/update-password.html',
    })
    return { data, error }
}

// Écouteur global des changements d'état d'authentification
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
        // Nettoyage optionnel ou redirection si sur une page privée
        const isPrivatePage = ['dashboard', 'profile', 'billing', 'create-wizard', 'project-workspace'].some(path => window.location.pathname.includes(path));
        if (isPrivatePage) {
            window.location.href = 'login.html';
        }
    }
})