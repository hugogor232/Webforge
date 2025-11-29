# WebForge AI - Générateur de Sites Web par IA

WebForge AI est une plateforme SaaS Serverless permettant de générer des sites web complets (HTML/CSS/JS) à partir d'une simple description textuelle via l'intelligence artificielle.

## 🚀 Fonctionnalités

- **Authentification Complète** : Email/Mot de passe et OAuth (Google, GitHub) via Supabase Auth.
- **Dashboard Temps Réel** : Suivi de la génération des sites via Supabase Realtime (WebSockets).
- **Wizard de Configuration** : Formulaire en 5 étapes pour définir le besoin (Type, Style, Contenu).
- **Sécurité RLS** : Isolation stricte des données (Row Level Security) garantissant la confidentialité des projets.
- **Architecture Serverless** : Frontend statique hébergé, Backend via Supabase, Logique métier via n8n.

## 🛠 Stack Technique

- **Frontend** : HTML5, CSS3 (Variables, Flexbox/Grid), Vanilla JavaScript (ES Modules).
- **Backend & Auth** : Supabase (PostgreSQL).
- **Automation** : n8n (Webhook pour la génération IA).
- **Paiement** : Stripe (Intégration UI factice prête pour l'API).

## 📦 Installation & Configuration

### 1. Prérequis

- Un compte [Supabase](https://supabase.com).
- Un serveur web local (ex: Live Server pour VS Code, Python SimpleHTTPServer, etc.).

### 2. Configuration Supabase

#### A. Création du projet
Créez un nouveau projet sur Supabase. Notez votre `Project URL` et `anon public key`.

#### B. Base de données (SQL)
Allez dans l'éditeur SQL de Supabase et exécutez le script contenu dans le fichier `schema.sql`. Ce script va :
1. Créer les tables (`profiles`, `projects`, `subscriptions`, `support_tickets`, `showcase_projects`).
2. Configurer les types ENUM (`project_status`, etc.).
3. Activer la sécurité RLS (Row Level Security).
4. Créer les politiques de sécurité pour isoler les données utilisateurs.
5. Mettre en place les triggers pour la création automatique de profil à l'inscription.
6. Activer le Realtime sur la table `projects`.

#### C. Authentification
1. Allez dans **Authentication > Providers**.
2. Activez **Email/Password**.
3. (Optionnel) Activez **Google** et **GitHub** en fournissant vos Client ID / Secret.
4. Allez dans **Authentication > URL Configuration**.
5. Définissez l'URL du site (ex: `http://localhost:5500`).
6. Ajoutez les URLs de redirection :
   - `http://localhost:5500/dashboard.html`
   - `http://localhost:5500/auth/callback`

#### D. Stockage (Storage)
1. Allez dans **Storage**.
2. Créez un nouveau bucket public nommé `avatars`.
3. Ajoutez une politique permettant l'upload et la lecture aux utilisateurs authentifiés.

### 3. Configuration du Code

#### A. Variables d'environnement
Ouvrez le fichier `supabaseClient.js` et remplacez les valeurs par les vôtres :

```javascript
const SUPABASE_URL = 'VOTRE_URL_SUPABASE'
const SUPABASE_ANON_KEY = 'VOTRE_CLE_ANON_PUBLIC'
```

#### B. Webhook n8n (Génération IA)
Ouvrez le fichier `wizard-logic.js` et configurez l'URL de votre webhook n8n (ou backend de génération) :

```javascript
const N8N_WEBHOOK_URL = 'VOTRE_URL_WEBHOOK_N8N';
```

### 4. Lancement

Lancez simplement un serveur HTTP à la racine du projet.

```bash
# Avec Python 3
python -m http.server 5500

# Avec Node (http-server)
npx http-server .
```

Accédez à `http://localhost:5500`.

## 🔒 Sécurité (RLS)

Ce projet utilise massivement les politiques RLS de PostgreSQL. 
Exemple de politique pour les projets :

```sql
CREATE POLICY "Users can view own projects" 
    ON public.projects FOR SELECT USING (auth.uid() = user_id);
```

Cela garantit que même si un utilisateur malveillant tente d'accéder à l'API Supabase directement, il ne pourra voir et modifier que ses propres données.

## 📂 Structure des fichiers

- `index.html` : Landing page publique.
- `dashboard.html` : Tableau de bord principal (Privé).
- `create-wizard.html` : Assistant de création de site (Privé).
- `project-workspace.html` : Éditeur/Prévisualisation d'un projet (Privé).
- `auth-oauth.js` : Gestion centralisée de l'authentification.
- `supabaseClient.js` : Initialisation du client Supabase.
- `schema.sql` : Structure de la base de données.
- `style.css` : Styles globaux et thème.

## 🤝 Contribution

Les Pull Requests sont les bienvenues. Pour les changements majeurs, veuillez d'abord ouvrir une issue pour discuter de ce que vous souhaitez changer.

## 📄 Licence

MIT