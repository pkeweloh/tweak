#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

DIR=backups
NAME=tweak
KEEP_DAILY=${KEEP_DAILY:-14}
KEEP_WEEKLY=${KEEP_WEEKLY:-8}
KEEP_MONTHLY=${KEEP_MONTHLY:-12}
REMOTE=${BACKUP_REMOTE:-$(sed -n 's/^BACKUP_REMOTE=//p' .env 2>/dev/null || true)}

file="$DIR/${NAME}_$(date +%F).archive.gz"
mkdir -p "$DIR"

if [[ -s "$file" ]]; then
    echo "exists $(basename "$file")"
else
    if ! docker compose -f docker-compose.prod.yml exec -T db sh -c \
        'mongodump --quiet --archive --gzip -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --db tweak' \
        > "$file.part" || [[ ! -s "$file.part" ]] || ! gzip -t "$file.part"; then
        rm -f "$file.part"
        echo "dump failed" >&2
        exit 1
    fi
    mv "$file.part" "$file"
    echo "saved $(basename "$file") ($(du -h "$file" | cut -f1))"
fi

declare -A keep first_week first_month
mapfile -t files < <(ls "$DIR"/${NAME}_[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9].archive.gz 2>/dev/null | sort)
n=${#files[@]}
for ((i = n - KEEP_DAILY; i < n; i++)); do (( i >= 0 )) && keep[${files[i]}]=1; done

for f in "${files[@]}"; do
    d=$(basename "$f" .archive.gz); d=${d#${NAME}_}
    w=$(date -d "$d" +%G-W%V); m=${d:0:7}
    [[ -z ${first_week[$w]:-} ]] && first_week[$w]=$f
    [[ -z ${first_month[$m]:-} ]] && first_month[$m]=$f
done
for w in $(printf '%s\n' "${!first_week[@]}" | sort | tail -n "$KEEP_WEEKLY"); do keep[${first_week[$w]}]=1; done
for m in $(printf '%s\n' "${!first_month[@]}" | sort | tail -n "$KEEP_MONTHLY"); do keep[${first_month[$m]}]=1; done

for f in "${files[@]}"; do
    if [[ -z ${keep[$f]:-} ]]; then rm -f "$f"; echo "removed $(basename "$f")"; fi
done
echo "kept ${#keep[@]} of $n"

if [[ -n $REMOTE ]]; then
    rclone sync "$DIR" "$REMOTE" --include "${NAME}_*.archive.gz" -q
    echo "remote: $(rclone ls "$REMOTE" | wc -l) files"
fi
