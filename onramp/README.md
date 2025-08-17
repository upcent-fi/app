# Coinbase Onramp Simulator - Dual App System with Blockchain Integration

Un système de deux applications séparées qui simule le comportement d'onramp Coinbase avec un suivi des économies en USDC ET une intégration blockchain automatique.

## 🏗️ Architecture

**Port 3000** : Serveur des dépenses (`server-app/`) + Blockchain
- Interface web pour ajouter des dépenses
- API REST pour gérer les données
- **Intégration blockchain** : Envoie automatiquement 2 USDC sur Base Sepolia
- Calcul automatique des onramps Coinbase

**Port 3001** : Client USDC Tracker (`client-app/`)
- Application React qui "scrape" les données de l'API
- Affichage des économies en USDC
- Mise à jour automatique toutes les 5 secondes
- Interface moderne et responsive

## 🔗 **Fonctionnalité Blockchain**

### **Automatique à chaque onramp saving :**
- **Détection** : Quand une dépense génère un onramp > 0
- **Transaction** : Envoi automatique du montant exact de l'onramp en USDC
- **Destination** : `0x3DC29f7394Bd83fC99058e018426eB8724629fC6`
- **Chaîne** : Base Sepolia (testnet)
- **Token** : USDC officiel

### **Configuration blockchain :**
```javascript
ADMIN_PRIVATE_KEY=02af70c426a04bd1c0baa164e850b1bf92d643b891d865d0ade165f3646aef02
DESTINATION_ADDRESS=0x3DC29f7394Bd83fC99058e018426eB8724629fC6
BASE_SEPOLIA_RPC=https://sepolia.base.org
USDC_CONTRACT=0x036CbD53842c5426634e7929541eC2318f3dCF7c
```

## 📁 Structure du projet

```
base-on-ramp/
├── server-app/              # Serveur des dépenses + Blockchain (port 3000)
│   ├── package.json         # Dépendances du serveur
│   ├── server.js            # Serveur Express + API + Blockchain
│   ├── blockchain.js        # Gestionnaire blockchain
│   └── env.config           # Configuration blockchain
├── client-app/              # Client USDC Tracker (port 3001)
│   ├── package.json         # Dépendances du client
│   ├── src/
│   │   ├── App.js          # Composant principal
│   │   ├── App.css         # Styles
│   │   └── index.js        # Point d'entrée
│   └── public/
│       └── index.html      # Template HTML
├── start-apps.sh            # Script de démarrage automatique
└── README.md                # Ce fichier
```

## 🚀 Démarrage rapide

### Option 1 : Script automatique (recommandé)
```bash
./start-apps.sh
```

### Option 2 : Démarrage manuel

**Terminal 1 - Serveur des dépenses + Blockchain (port 3000)**
```bash
cd server-app
npm start
```

**Terminal 2 - Client USDC Tracker (port 3001)**
```bash
cd client-app
npm start
```

## 📱 Utilisation

### 1. Serveur des dépenses + Blockchain (localhost:3000)
- **Interface web intégrée** pour ajouter des dépenses
- **Deux champs** : raison + montant
- **Calcul automatique** des onramps Coinbase
- **Blockchain automatique** : 2 USDC envoyés à chaque onramp
- **Statut blockchain** : Solde admin, destination, transactions

**Exemple :**
- Dépense : "Café" - $3.50
- Onramp : $6.50 (10 - 3.50 = 6.50)
- **Blockchain** : 2 USDC envoyés automatiquement sur Base Sepolia

### 2. Client USDC Tracker (localhost:3001)
- **Scrape automatiquement** les données de l'API
- **Affiche toutes les dépenses** et onramps
- **Calcule les économies totales** en USDC
- **Mise à jour en temps réel** toutes les 5 secondes

## 🔧 Fonctionnalités

### API Endpoints (port 3000)
- `GET /api/expenses` - Récupère toutes les dépenses
- `POST /api/expenses` - Ajoute une nouvelle dépense + déclenche blockchain
- `GET /api/blockchain-status` - Statut blockchain (soldes, transactions)

### Calcul des économies
- **Formule** : `(dizaine supérieure) - montant dépense`
- **Exemple** : Dépense $7.80 → Onramp $2.20 (10 - 7.80)
- **Blockchain** : 2 USDC envoyés automatiquement

### Intégration blockchain
- **Détection automatique** des onramps > 0
- **Transaction USDC** sur Base Sepolia
- **Confirmation** et suivi des transactions
- **Gestion d'erreurs** et retry automatique

## 🎯 Cas d'usage

1. **Ajoutez une dépense** sur localhost:3000
2. **Le serveur calcule** automatiquement l'onramp
3. **Si onramp > 0** : 2 USDC envoyés automatiquement sur Base Sepolia
4. **Le client scrape** les données toutes les 5 secondes
5. **Voyez vos économies USDC** s'accumuler en temps réel
6. **Suivez les transactions blockchain** dans l'interface

## 🛠️ Technologies

- **Serveur** : Node.js + Express (port 3000)
- **Client** : React 18 (port 3001)
- **Blockchain** : Ethers.js + Base Sepolia
- **Communication** : HTTP API entre les deux apps
- **Scraping** : Fetch API avec polling automatique
- **Interface** : HTML/CSS intégré + React moderne

## 🔄 Flux de données

```
[Port 3000] Serveur des dépenses
    ↓ (Calcul onramp)
[Blockchain] Base Sepolia - 2 USDC
    ↓ (API REST)
[Port 3001] Client USDC Tracker
    ↓ (Scraping toutes les 5s)
Affichage des économies USDC
```

## 🌐 Ports

- **Port 3000** : Serveur des dépenses + API + Blockchain + Interface web
- **Port 3001** : Client React qui scrape l'API

## 🚨 Avantages de cette architecture

- **Séparation claire** des responsabilités
- **Serveur autonome** avec interface intégrée + blockchain
- **Client indépendant** qui peut être déployé séparément
- **API REST** accessible à d'autres clients
- **Intégration blockchain** automatique et transparente
- **Scraping automatique** pour la synchronisation

## ⚠️ **Sécurité et configuration**

- **Clé privée** stockée dans `env.config`
- **Base Sepolia** : réseau de test uniquement
- **USDC officiel** : contrat vérifié
- **Gestion d'erreurs** robuste pour les transactions blockchain

L'application simule parfaitement le comportement d'onramp Coinbase avec une architecture claire, modulaire ET une intégration blockchain automatique ! 🚀💰🔗
