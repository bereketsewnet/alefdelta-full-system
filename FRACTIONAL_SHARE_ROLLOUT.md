# Fractional Share Capital — Production Rollout

This rollout is intentionally SACCO-only. It does not restart or modify the ERP or Afri-Logistics stacks. Do not use `docker compose down`, `db:reset`, a seed command, or a destructive down-migration.

## 1. Build without changing live containers

```bash
cd "/PRODUCTION PROJECTS/ALEF DELTA/alefdelta"

SHARE_ROLLOUT_STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
SHARE_ROLLOUT_DIR="backups/fractional-shares-${SHARE_ROLLOUT_STAMP}"
mkdir -p "$SHARE_ROLLOUT_DIR"
chmod 700 "$SHARE_ROLLOUT_DIR"

docker inspect -f '{{.Config.Image}}' alefdelta_api > "$SHARE_ROLLOUT_DIR/api-image.txt"
docker inspect -f '{{.Config.Image}}' alefdelta_frontend > "$SHARE_ROLLOUT_DIR/frontend-image.txt"
docker inspect -f '{{.Config.Image}}' alefdelta_member_portal > "$SHARE_ROLLOUT_DIR/member-image.txt"

docker image tag "$(docker inspect -f '{{.Image}}' alefdelta_api)" "alefdelta-api-pre-fractional:${SHARE_ROLLOUT_STAMP}"
docker image tag "$(docker inspect -f '{{.Image}}' alefdelta_frontend)" "alefdelta-frontend-pre-fractional:${SHARE_ROLLOUT_STAMP}"
docker image tag "$(docker inspect -f '{{.Image}}' alefdelta_member_portal)" "alefdelta-member-pre-fractional:${SHARE_ROLLOUT_STAMP}"

docker compose build api frontend member_portal
```

## 2. Read-only preflight

This command returns exit code `2` if it finds duplicate active share accounts, a misconfigured `SHR_CAP` product, a missing product after migration, or any non-zero legacy `SHR_CAP` balance that lacks a share-unit ledger. A missing product before migration is reported as a warning because migration 49 creates the canonical zero-balance product; no ownership or money is inferred. Never infer legacy balances into units.

```bash
docker compose run --rm --no-deps \
  -v "$PWD/$SHARE_ROLLOUT_DIR:/rollout" \
  --entrypoint node api \
  scripts/fractional_share_rollout_snapshot.js \
  --assert-ready --output=/rollout/before-live-stop.json
```

Open `before-live-stop.json` and record `share_capital.missing_account_count`. That exact number is required by the bootstrap command.

## 3. Short maintenance window and backups

Stop only the SACCO API so no balance, transaction, request, or attachment can change between the backup and migration. The other VPS projects remain untouched.

```bash
docker compose stop api

docker exec alefdelta_mysql sh -c \
  'exec mysqldump --single-transaction --quick --routines --triggers --events -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"' \
  > "$SHARE_ROLLOUT_DIR/database.sql"

tar -C alef_delta_sacco_backend -czf "$SHARE_ROLLOUT_DIR/uploads.tar.gz" uploads
sha256sum "$SHARE_ROLLOUT_DIR/database.sql" "$SHARE_ROLLOUT_DIR/uploads.tar.gz" \
  > "$SHARE_ROLLOUT_DIR/SHA256SUMS"
```

Repeat the preflight while the API is stopped. Abort if the missing count changed or any blocker appears.

```bash
docker compose run --rm --no-deps \
  -v "$PWD/$SHARE_ROLLOUT_DIR:/rollout" \
  --entrypoint node api \
  scripts/fractional_share_rollout_snapshot.js \
  --assert-ready --output=/rollout/before-migration.json
```

## 4. Apply migration 49 while the API remains offline

```bash
docker compose run --rm --no-deps --entrypoint npm api run migrate -- \
  --only=49_add_fractional_share_capital.sql
```

The guarded `--only` mode refuses to run migration 49 if any earlier migration is not recorded as applied. It also records migration 49 in `schema_migrations`, so the normal API startup will not run it again.

Run the bootstrap in preview mode first:

```bash
docker compose run --rm --no-deps --entrypoint node api \
  scripts/create_missing_share_accounts_once.js
```

Only if the preview count exactly matches `before-migration.json`, execute it. Replace `EXPECTED_COUNT` with that exact integer:

```bash
docker compose run --rm --no-deps --entrypoint node api \
  scripts/create_missing_share_accounts_once.js \
  --execute --expected-count=EXPECTED_COUNT
```

The bootstrap creates only zero-balance, zero-unit `SHR_CAP` accounts and an audit entry. It posts no financial transaction.

## 5. Post-migration conservation check

```bash
docker compose run --rm --no-deps \
  -v "$PWD/$SHARE_ROLLOUT_DIR:/rollout" \
  --entrypoint node api \
  scripts/fractional_share_rollout_snapshot.js \
  --assert-ready --output=/rollout/after-migration.json
```

Before starting the API, verify:

- member, loan, and transaction counts are unchanged;
- every `balances_by_product.total_balance` is unchanged;
- master account balance and master-ledger totals are unchanged;
- attachment count and bytes are unchanged;
- account count increased only by the previewed missing-account count;
- `missing_account_count`, `duplicate_member_count`, and `nonzero_without_ledger_count` are zero;
- the share ledger still has zero entries unless verified share transactions already existed.

## 6. Deploy only the three SACCO application containers

```bash
docker compose up -d --no-deps api frontend member_portal
docker compose ps api frontend member_portal mysql
docker compose logs --tail=100 api
curl --fail --silent https://sacco-api.alefdelta.com/api/health
curl --fail --head https://corebank.alefdelta.com
curl --fail --head https://sacco-mp.alefdelta.com
```

Smoke checks must be read-only: sign in, open a member Share Capital panel, open New Transaction modes, and view member share-request screens. Do not post a live financial test transaction.

## Rollback

Do not reverse migration 49 or delete its tables. If application rollback is necessary, retag the recorded pre-rollout images to the names in the three `*-image.txt` files and recreate only `api`, `frontend`, and `member_portal`. The additive schema stays dormant. Restore the database/uploads backup only for a confirmed migration failure and only while the SACCO API is stopped.
