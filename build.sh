#!/usr/bin/env bash
set -e

echo "Building React..."

cd frontend
npm install
npm run build
cd ..

echo "Installing Python packages..."

pip install -r requirements.txt

echo "Collecting static files..."

python manage.py collectstatic --noinput

echo "Running migrations..."

python manage.py migrate