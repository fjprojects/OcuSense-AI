#!/usr/bin/env bash
set -e

echo "Installing frontend dependencies..."
cd frontend
npm install

echo "Building React..."
CI=false npm run build
cd ..

echo "Installing Python dependencies..."
pip install -r requirements.txt

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Running migrations..."
python manage.py migrate

echo "Build completed successfully."