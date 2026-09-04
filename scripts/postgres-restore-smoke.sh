#!/usr/bin/env bash
set -euo pipefail

dump_file="$(mktemp)"
restore_db="paircode_restore_check"
trap 'rm -f "$dump_file"; docker compose exec -T db dropdb --if-exists -U paircode "$restore_db" >/dev/null 2>&1 || true' EXIT

docker compose exec -T db psql -U paircode -d paircode -v ON_ERROR_STOP=1 -c \
  "insert into rooms (id, language, code, updated_at) values ('backup01', 'javascript', 'console.log(\"backup\")', '2026-09-04T00:00:00.000Z') on conflict (id) do update set code = excluded.code;"
docker compose exec -T db pg_dump -U paircode -d paircode > "$dump_file"
docker compose exec -T db createdb -U paircode "$restore_db"
docker compose exec -T db psql -U paircode -d "$restore_db" -v ON_ERROR_STOP=1 < "$dump_file" >/dev/null

restored="$(docker compose exec -T db psql -U paircode -d "$restore_db" -Atc \
  "select code from rooms where id = 'backup01';")"
test "$restored" = 'console.log("backup")'
echo 'PostgreSQL backup restore smoke check passed.'
