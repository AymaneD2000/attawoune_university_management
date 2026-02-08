# Université Attawoune - Système de Gestion Universitaire

Plateforme de gestion universitaire complète pour l'Université Attawoune.

## Technologies

- **Backend**: Django 5.2 + Django REST Framework
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Base de données**: SQLite (développement) / PostgreSQL (production)
- **Authentification**: JWT (JSON Web Tokens)

## Structure du Projet

```
university_management_system/
├── backend/                 # API Django REST Framework
│   ├── apps/
│   │   ├── accounts/        # Gestion des utilisateurs
│   │   ├── university/      # Facultés, départements, programmes
│   │   ├── academics/       # Cours, notes, bulletins
│   │   ├── students/        # Gestion des étudiants
│   │   ├── teachers/        # Gestion des enseignants
│   │   ├── finance/         # Paiements, salaires
│   │   └── scheduling/      # Emplois du temps
│   ├── core/                # Configuration Django
│   └── requirements.txt
├── frontend/                # Application React
│   ├── src/
│   │   ├── components/      # Composants réutilisables
│   │   ├── pages/           # Pages de l'application
│   │   ├── services/        # Services API
│   │   ├── context/         # Contextes React
│   │   └── types/           # Types TypeScript
│   └── package.json
└── README.md
```

## Installation

### Backend

```bash
cd backend

# Créer l'environnement virtuel
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate  # Windows

# Installer les dépendances
pip install -r requirements.txt

# Appliquer les migrations
python manage.py migrate

# Créer un superutilisateur
python manage.py createsuperuser

# Démarrer le serveur
python manage.py runserver
```

### Frontend

```bash
cd frontend

# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm start
```

## Accès

- **Backend API**: http://localhost:8000/api/
- **Documentation API (Swagger)**: http://localhost:8000/api/docs/
- **Admin Django**: http://localhost:8000/admin/
- **Frontend**: http://localhost:3000/

## Comptes par défaut

- **Admin**: admin / admin123

## Fonctionnalités

### Gestion des utilisateurs
- Authentification JWT
- Rôles: Admin, Doyen, Enseignant, Étudiant, Comptable, Secrétaire
- Profils utilisateurs

### Gestion universitaire
- Années académiques et semestres
- Facultés et départements
- Niveaux (L1-L3, M1-M2, D1-D3)
- Programmes/Filières
- Salles de classe

### Gestion des étudiants
- Inscription et matricules
- Suivi des inscriptions par année
- Promotions et redoublements
- Gestion des présences

### Gestion des enseignants
- Profils enseignants
- Affectations aux cours
- Contrats et salaires

### Gestion académique
- Cours et matières
- Examens (partiels, finals, TP, projets)
- Notes et bulletins
- Calcul des moyennes pondérées

### Gestion financière
- Frais de scolarité
- Paiements étudiants
- Salaires des employés
- Suivi des dépenses

### Emplois du temps
- Créneaux horaires
- Planification des cours
- Détection des conflits
- Séances de cours

### Annonces
- Publication d'annonces
- Ciblage par audience
- Épinglage d'annonces importantes

## API Endpoints

| Module | Endpoint |
|--------|----------|
| Auth | `/api/auth/token/` |
| Utilisateurs | `/api/accounts/` |
| Université | `/api/university/` |
| Étudiants | `/api/students/` |
| Enseignants | `/api/teachers/` |
| Académique | `/api/academics/` |
| Finance | `/api/finance/` |
| Emplois du temps | `/api/scheduling/` |

## Licence

Propriétaire - Université Attawoune
