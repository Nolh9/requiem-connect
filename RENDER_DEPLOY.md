# Déploiement Render

Paramètres Render :

- Language : Docker
- Branch : main
- Root Directory : laisser vide
- Dockerfile Path : `backend/Dockerfile`
- Instance Type : Free
- Region : Frankfurt

Variables d'environnement :

```env
NODE_ENV=production
PORT=10000
JWT_SECRET=requiem_connect_secret_2026_change_me
DB_PATH=./data/requiem.sqlite
```

Important :
- Le frontend doit appeler l'API en `/api/...`.
- Il ne doit pas appeler `localhost`.
- Le backend doit écouter sur `0.0.0.0`.
- SQLite suffit pour une démonstration, mais les données peuvent être perdues au redémarrage sur une instance gratuite.
