#!/usr/bin/env bash
set -euo pipefail

python -m pip install -r requirements.txt
npm --prefix frontend ci --include=dev --no-audit --no-fund
PUBLIC_URL=/static/frontend npm --prefix frontend run build
python manage.py collectstatic --clear --noinput
python manage.py migrate --noinput
