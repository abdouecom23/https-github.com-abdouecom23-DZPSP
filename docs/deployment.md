# DinarFlow Deployment & Operations Guide

This guide outlines the procedure for building, containerizing, deploying, and maintaining the DinarFlow micro-transaction and compliance service.

---

## 1. Local Development Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Docker**: v20.10+ (optional, for containerization tests)

### Step-by-Step Installation
1. Clone the repository and navigate to the project directory:
   ```bash
   git clone <repository_url> dinarflow && cd dinarflow
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up the local environment variables. Create a `.env` file at the root:
   ```env
   NODE_ENV=development
   PORT=3000
   GEMINI_API_KEY=your-gemini-api-key-here
   ```
4. Start the application in development mode:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to `http://localhost:3000` to view the running instance.

---

## 2. Production Compilation Build Pipeline

DinarFlow compiles both the React single page application and the backend Express server into a highly optimized bundle.

Run the build script:
```bash
npm run build
```

### Build Process Breakdown
1. **Frontend Compilation**: `vite build` translates React 18 / TypeScript / Tailwind CSS code into static HTML, JS, and CSS files stored in the `/dist` folder.
2. **Backend Bundling**: `esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs` compiles the Express router and core compliance modules into a single, high-performance CommonJS file at `dist/server.cjs`.

To run the production build locally:
```bash
npm run start
```

---

## 3. Docker Containerization

To run DinarFlow in a completely isolated production-ready Docker container, use the supplied Docker configuration.

### Building the Docker Image
```bash
docker build -t dinarflow-app:latest .
```

### Running with Docker Compose
We recommend using Docker Compose to orchestrate the application and guarantee persistent storage for the database:

```bash
docker-compose up -d
```

This command:
- Builds the image if not already created.
- Runs the container as `dinarflow-service` in detached mode.
- Exposes port `3000`.
- Mounts a persistent volume `dinarflow-data` to `/app/data` to ensure the ledger state survives restarts.
- Starts automatic health checks on the application's `/api/health` endpoint.

To stop the container:
```bash
docker-compose down
```

---

## 4. Deploying to Cloud Run

DinarFlow is built to be deployed on stateless container environments such as Google Cloud Run.

### Step 1: Build & Push to Artifact Registry
Set your project ID and register the image:
```bash
export PROJECT_ID="your-gcp-project-id"
export REGION="us-central1"

# Tag the image
docker tag dinarflow-app:latest gcr.io/${PROJECT_ID}/dinarflow-app:latest

# Push to registry
docker push gcr.io/${PROJECT_ID}/dinarflow-app:latest
```

### Step 2: Deploy Container with Persistent Storage
Since Cloud Run containers are stateless by default, you must mount a cloud-hosted persistence layer (such as Google Cloud Storage Fuse or a persistent Filestore volume) to `/app/data` to preserve the ledger file.

```bash
gcloud run deploy dinarflow-service \
  --image gcr.io/${PROJECT_ID}/dinarflow-app:latest \
  --region ${REGION} \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,PORT=3000" \
  --update-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --add-volume=name=db-storage,type=cloud-storage,bucket=dinarflow-ledger-data \
  --add-volume-mount=volume=db-storage,mount-path=/app/data
```

---

## 5. System Health Check & Troubleshooting

- **Logs View**: To inspect real-time server telemetry and AML alerts:
  ```bash
  docker logs -f dinarflow-service
  ```
- **Shell Access**: To enter the container shell for inspection:
  ```bash
  docker exec -it dinarflow-service sh
  ```
- **Local DB Check**: The JSON database can be examined on the host file system in the volume mount (e.g., `/var/lib/docker/volumes/dinarflow_dinarflow-data/_data/db.json`).
