# Intégration Onramp - Guide d'utilisation

## Vue d'ensemble

Le contenu du dossier `onramp` a été intégré avec l'application principale `upcent-live-app`. Le **Tracker USDC** est intégré dans l'app principale, tandis que le **Simulateur Onramp** fonctionne comme une application séparée qui communique via le serveur backend.

## Architecture

```
upcent-live-app/
├── src/OnrampViewer.tsx     # Tracker USDC (intégré dans l'app)
└── onramp/
    ├── server-app/          # Serveur backend (port 3001)
    └── client-app/          # Simulateur séparé (port 3000 ou autre)
```

## Composants

### 1. OnrampViewer.tsx (Intégré)
- **Fonction** : Tracker d'économies USDC
- **Description** : Affiche le total des économies et les transactions récentes
- **Localisation** : `src/OnrampViewer.tsx` 
- **Styles** : `src/OnrampViewer.css`
- **Accès** : Via l'application principale

### 2. Simulateur Onramp (Séparé)
- **Fonction** : Interface pour ajouter des dépenses
- **Localisation** : `onramp/` (racine)
- **Lancement** : `cd onramp && npm start`
- **Communication** : Via serveur backend sur port 3001

## Navigation

Depuis la page d'accueil de l'app principale :

1. **Plateforme d'épargne** (fonctionnalité existante)
   - Accès aux plateformes Aave et Morpho

2. **Tracker USDC** (intégré)
   - Visualiser les économies totales
   - Voir les transactions récentes avec actualisation automatique

## Utilisation

### 1. Lancement de l'application principale
```bash
# Lance automatiquement le serveur backend + l'app principale
yarn start
```

### 2. Lancement du simulateur onramp (séparé)
```bash
# Dans un terminal séparé
cd onramp
npm start
```

## Workflow complet

1. **Démarrez l'app principale** : `yarn start`
   - Serveur backend démarre sur port 3001
   - App principale sur port 3000
   - Tracker USDC accessible via l'interface

2. **Démarrez le simulateur** (optionnel) :
   - Ouvrez un nouveau terminal
   - `cd onramp && npm start`
   - Interface séparée pour ajouter des dépenses

3. **Testez la communication** :
   - Ajoutez des dépenses via le simulateur
   - Observez les mises à jour en temps réel dans le Tracker USDC

## Ports utilisés

- **3000** : Application principale React
- **3001** : Serveur backend API (automatique)
- **3002+** : Simulateur onramp (si lancé séparément)

## API Backend

Le serveur backend (port 3001) expose :
- `GET /api/expenses` - Liste des dépenses + total des économies
- `POST /api/expenses` - Ajouter une dépense (génère automatiquement les économies onramp)

## Avantages de cette architecture

✅ **Flexibilité** : Simulateur optionnel et séparé
✅ **Performance** : App principale plus légère  
✅ **Développement** : Possibilité de développer/tester les composants séparément
✅ **Communication** : Données partagées via le serveur backend
✅ **Ports** : Pas de conflit, chaque app sur son port
