## Run with Docker

Use the development stack while building the app. Source files are mounted
into the containers, so frontend and backend changes reload without rebuilding.
The development frontend uses the workspace `frontend/node_modules` directory;
install dependencies once on the host before starting it:

```sh
cd frontend && pnpm install && cd ..
docker compose -f docker-compose.dev.yml up --build
```

Open `http://localhost:5173`.

Rebuild only when dependencies or a Dockerfile change:

```sh
docker compose -f docker-compose.dev.yml up --build
```

Use the production stack in `docker-compose.yml` to serve the compiled frontend with Nginx:

```sh
docker compose up --build -d
```

Open `http://localhost:5173`. Stop either stack with:

```sh
docker compose -f docker-compose.dev.yml down
docker compose down
```
