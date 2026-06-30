# DinarFlow Backup & Disaster Recovery Procedures

To ensure financial ledger persistence and guarantee business continuity, DinarFlow uses automated backup schedules, point-in-time state captures, and structured disaster recovery runbooks.

---

## 1. Backup Strategy Overview

DinarFlow persists all customer states, AML logs, and transaction details in `/app/data/db.json`. Therefore, backing up DinarFlow simply involves taking consistent, transactionally safe copies of the `db.json` file.

| Backup Type | Frequency | Storage Location | Retention Policy | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Hourly Snapshot** | Every 60 minutes | Local server scratch disk | 48 Hours | Rapid recovery from recent operational errors. |
| **Daily Snapshot** | Every 24 hours | Encrypted Cloud Bucket (`dinarflow-backups`) | 30 Days | Disaster recovery from container failover. |
| **Monthly Archive** | 1st of every month | Cold storage Archive bucket | 7 Years | Regulatory compliance auditing and historical archives. |

---

## 2. Programmatic Backup Script

Below is the bash script (`scripts/backup-database.sh`) executed via cron task to back up the active ledger file securely.

```bash
#!/usr/bin/env bash
set -eo pipefail

# Configurations
DB_SOURCE_PATH="/app/data/db.json"
BACKUP_DIR="/app/data/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILENAME="dinarflow_ledger_${TIMESTAMP}.json.gz"
GCP_BUCKET_NAME="dinarflow-backups-bucket"

# 1. Create local backup directory if missing
mkdir -p "${BACKUP_DIR}"

# 2. Extract and compress database under GZIP to minimize size and network costs
echo "Compressing ledger file..."
gzip -c "${DB_SOURCE_PATH}" > "${BACKUP_DIR}/${BACKUP_FILENAME}"

# 3. Upload to GCP Artifact bucket (if gsutil command exists in runtime container)
if command -v gsutil &> /dev/null; then
  echo "Uploading compressed ledger to Google Cloud Storage..."
  gsutil cp "${BACKUP_DIR}/${BACKUP_FILENAME}" "gs://${GCP_BUCKET_NAME}/daily/${BACKUP_FILENAME}"
else
  echo "GCP CLI not installed. Backup saved locally."
fi

# 4. Enforce local 7-day retention limit
echo "Cleaning up local backups older than 7 days..."
find "${BACKUP_DIR}" -name "dinarflow_ledger_*.json.gz" -mtime +7 -delete

echo "Backup complete: ${BACKUP_FILENAME}"
```

---

## 3. Disaster Recovery Runbooks

### Scenario A: Corruption of Active Ledger File
If the container crashes or the `db.json` file is corrupted (e.g., empty or malformed JSON), follow this checklist:

1. **Pause Server Ingress**: Direct load balancers to a static maintenance page to avoid processing new transactions.
2. **Access the Container Shell**:
   ```bash
   docker exec -it dinarflow-service sh
   ```
3. **Verify the Integrity**: Look at the active database file size and properties:
   ```bash
   ls -la /app/data/
   ```
4. **Locate the Most Recent Valid Snapshot**:
   ```bash
   ls -lat /app/data/backups/
   ```
5. **Restore the Snapshot**:
   - Delete the corrupted database file:
     ```bash
     rm /app/data/db.json
     ```
   - Decompress the latest snapshot:
     ```bash
     gunzip -c /app/data/backups/dinarflow_ledger_YYYYMMDD_HHMMSS.json.gz > /app/data/db.json
     ```
6. **Reboot the Server**: Restart the container to reload the verified ledger state.
   ```bash
   docker-compose restart
   ```
7. **Perform Post-Recovery Checks**: Compare user balance counts and cross-check the Reconciliation Tab to ensure the cantonment remains balanced.

---

### Scenario B: Complete Hardware/Container Loss
If the physical virtual machine or host server hosting DinarFlow fails completely:

1. **Provision a Fresh Runner**: Spin up a new Cloud Run or VM instance.
2. **Pull the Docker Image**:
   ```bash
   docker pull gcr.io/your-project/dinarflow-app:latest
   ```
3. **Download the Cloud Storage Backup**: Download the most recent daily backup snapshot from your secure storage bucket:
   ```bash
   gsutil cp gs://dinarflow-backups-bucket/daily/dinarflow_ledger_LATEST.json.gz ./
   gunzip dinarflow_ledger_LATEST.json.gz
   ```
4. **Launch the Container with the Recovered State**: Mount the recovered directory:
   ```bash
   docker run -d \
     -p 3000:3000 \
     -v $(pwd)/dinarflow_ledger_LATEST.json:/app/data/db.json \
     --name dinarflow-service \
     gcr.io/your-project/dinarflow-app:latest
   ```
5. **Verify System Telemetry**: View the logs to confirm the V8 server is running smoothly on port 3000:
   ```bash
   docker logs -f dinarflow-service
   ```
