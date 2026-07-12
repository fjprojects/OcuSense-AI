#!/usr/bin/env bash
set -e

echo "Building React..."

cd frontend
npm install
CI=false npm run build
cd ..

pip install -r requirements.txt

python manage.py collectstatic --noinput
python manage.py migrate