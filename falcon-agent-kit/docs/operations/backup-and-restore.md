# Backup and Disaster Recovery Procedures — Falcon 3D Prints

> Procedures for automated backups, on-demand snapshots, point-in-time recovery (PITR), and disaster recovery rehearsals.

## Recovery Time & Point Objectives

- **RPO (Recovery Point Objective)**: <= 1 hour (maximum data loss acceptable in catastrophic failure).
- **RTO (Recovery Time Objective)**: <= 4 hours (maximum downtime until service restoration).

---

## 1. Automated Backup Configuration

### 1.1 Database Backups (Supabase)
- **Daily Automated Backups**: Retained for 30 days via Supabase Pro/Team managed infrastructure.
- **Continuous Write-Ahead Logging (WAL) / PITR**: Enabled on production database allowing point-in-time recovery to any minute within the retention window.
- **Scheduled Logical Dump**: Weekly automated encrypted export to cold storage (e.g. AWS S3 / Cloudflare R2 bucket in Mumbai region) using `pg_dump`:
  ```bash
  pg_dump -h db.your-project.supabase.co -U postgres -d postgres --format=custom -f backup-$(date +%Y%m%d).dump
  ```

### 1.2 Storage Asset Backups
- Customer uploaded custom STL files and product imagery in Supabase Storage buckets configured with versioning and cross-region replication.

---

## 2. Disaster Recovery & Restoration Procedures

### 2.1 Rehearsal Restoration Protocol (Quarterly)
1. Provision a clean, isolated restoration database instance.
2. Download latest backup archive or select PITR target timestamp.
3. Restore schema, tables, and data:
   ```bash
   pg_restore -h db.test-restore.supabase.co -U postgres -d postgres --clean --no-acl --no-owner backup.dump
   ```
4. Execute validation suite:
   - Verify table row counts (`orders`, `products`, `customers`, `order_items`).
   - Validate checksum of latest completed order.
   - Verify RLS policies and role grants remain intact.
5. Record rehearsal results and elapsed recovery time in operational log.

### 2.2 Live Recovery Emergency Runbook
In case of catastrophic production database corruption or accidental deletion:
1. **Declare Incident**: Notify business owner and activate incident channel.
2. **Put Site into Maintenance Mode**: Serve static maintenance page (`503 Service Unavailable`) via CDN edge routing to prevent ongoing conflicting writes.
3. **Restore Database via PITR**: Select timestamp immediately preceding corruption event in Supabase Management Console.
4. **Reconcile Payments**:
   - Query Razorpay API for all payments captured between PITR timestamp and current time.
   - Re-insert corresponding order confirmation records via reconciliation script.
5. **Verify Data Integrity**: Confirm all active orders accounted for.
6. **Disable Maintenance Mode**: Resume traffic and monitor error logs for 60 minutes.
