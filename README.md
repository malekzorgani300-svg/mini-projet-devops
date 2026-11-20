# TaskBoard – Mini-projet DevOps 2026/2027

Application web de gestion de tâches, entièrement conteneurisée avec Docker Compose.

| Composant | Technologie | Port |
|-----------|-------------|------|
| Frontend  | React (Vite) servi par Nginx | 8080 |
| Backend   | Node.js / Express (API REST CRUD) | 3000 |
| Base de données | PostgreSQL 16 (image officielle) | interne (5432) |
| Monitoring (bonus) | Prometheus / Grafana | 9090 / 3001 |

## Architecture

```
Navigateur ──> frontend (Nginx :80) ──/api──> backend (Express :3000) ──> db (PostgreSQL :5432)
                                                     │
                                          /metrics ──┴──> Prometheus ──> Grafana
```

Les trois services partagent le réseau Docker `appnet`. Les données PostgreSQL sont
persistées dans le volume nommé `pgdata`.

## Lancement

Prérequis : Docker et Docker Compose (Docker Desktop avec intégration WSL2, ou Docker Engine dans Ubuntu).

```bash
docker compose up -d
```

- Application : http://localhost:8080
- API : http://localhost:3000/api/tasks
- Santé de l'API et de la base : http://localhost:3000/api/health/db

### Vérifications utiles

```bash
docker compose ps                 # état des conteneurs
docker compose logs -f backend    # logs du backend
docker network ls                 # réseau appnet
docker volume ls                  # volume pgdata
docker exec -it taskboard-db psql -U appuser -d appdb -c "SELECT * FROM tasks;"
curl http://localhost:3000/api/tasks
```

Test de persistance : `docker compose down` puis `docker compose up -d` conserve les tâches.
Pour repartir de zéro : `docker compose down -v`.

## API REST

| Méthode | Route | Description |
|---------|-------|-------------|
| POST    | /api/tasks     | Créer une tâche |
| GET     | /api/tasks     | Lister les tâches |
| GET     | /api/tasks/:id | Lire une tâche |
| PUT     | /api/tasks/:id | Modifier (titre et/ou état) |
| DELETE  | /api/tasks/:id | Supprimer |

## Bonus

### CI/CD (GitHub Actions)
Le workflow `.github/workflows/ci.yml` exécute les tests du backend, construit le frontend,
puis (sur `main`) construit et publie les deux images sur Docker Hub.
Ajouter dans *Settings > Secrets and variables > Actions* : `DOCKERHUB_USERNAME` et `DOCKERHUB_TOKEN`.

### Monitoring (Prometheus + Grafana)

```bash
docker compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d
```

- Prometheus : http://localhost:9090 (cibles : *Status > Targets*)
- Grafana : http://localhost:3001 (admin / admin par défaut), source de données Prometheus déjà configurée.
- Exemples de requêtes : `rate(http_request_duration_seconds_count[1m])`, `process_resident_memory_bytes`.

## Développement local (sans Docker)

```bash
# Backend (nécessite un PostgreSQL local avec le schéma db/init.sql)
cd backend && npm install && npm start
# Frontend
cd frontend && npm install && npm run dev      # http://localhost:5173
# Tests
cd backend && npm test
```

## Workflow Git (pour les deux membres du binôme)

```bash
git clone git@github.com:<utilisateur>/<repo>.git && cd <repo>
git checkout -b feature/backend-api        # une branche par fonctionnalité
git add . && git commit -m "feat: API CRUD des tâches"
git push -u origin feature/backend-api     # puis ouvrir une Pull Request sur GitHub
git checkout main && git pull              # après fusion de la PR
```

Répartition suggérée : membre A = backend + base de données ; membre B = frontend + Dockerfile frontend ;
Docker Compose, CI/CD et monitoring en commun (via Pull Requests relues par l'autre membre).
