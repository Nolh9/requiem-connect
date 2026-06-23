# Requiem Connect — Text Only Backend Edition

Plateforme de communication textuelle inspirée Discord/Slack, direction artistique Japan Horror, sans vocal et sans bots.

## Stack

- Frontend HTML/CSS/JavaScript
- Backend Node.js + Express
- Authentification JWT
- Mots de passe hachés avec bcrypt
- Base SQLite persistante
- Docker Compose

## Lancement rapide

```bash
docker compose up --build
```

Puis ouvrir :

- Frontend Nginx : http://localhost:8080
- Backend + frontend servi par Node : http://localhost:3000
- Healthcheck API : http://localhost:3000/api/health

## Fonctionnel

- inscription
- connexion
- session JWT
- profil utilisateur modifiable
- salons textuels
- création de salon textuel
- messages persistés côté backend
- recherche dans le salon actif
- suppression des messages utilisateurs d’un salon
- liste des membres

## Retiré volontairement

- vocal
- appels audio/visio
- salons vocaux
- bots
- commandes automatisées

## Données

La base SQLite est stockée dans `backend/data/requiem.sqlite` ou dans le volume Docker `requiem_data`.
