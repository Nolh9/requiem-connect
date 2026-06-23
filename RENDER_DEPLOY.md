# Déploiement Render

Paramètres Render :

- Language : Docker
- Branch : main
- Root Directory : vide
- Dockerfile Path : backend/Dockerfile
- Instance Type : Free

Variables d'environnement :

```env
NODE_ENV=production
PORT=10000
JWT_SECRET=requiem_connect_secret_2026_change_me
DB_PATH=./data/requiem.sqlite
```

Après le déploiement, tester :

```txt
https://TON-URL-RENDER.onrender.com/api/health
```

Réponse attendue :

```json
{"status":"ok","product":"requiem-connect","mode":"text-only"}
```
