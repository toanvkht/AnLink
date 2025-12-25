#!/bin/bash
# Database Restoration Script
# Restores database to GitHub repository state (Dec 10, 2025)

echo "========================================"
echo "AnLink Database Restoration"
echo "========================================"
echo ""
echo "WARNING: This will delete all current database data!"
read -p "Press Enter to continue or Ctrl+C to cancel..."

echo ""
echo "[1/5] Dropping existing database..."
psql -U postgres -c "DROP DATABASE IF EXISTS anlink_dev_clone;"

echo "[2/5] Creating fresh database..."
psql -U postgres -c "CREATE DATABASE anlink_dev_clone;"

echo "[3/5] Applying schema..."
psql -U postgres -d anlink_dev_clone -f database/anlink_schema.sql

echo "[4/5] Loading seed data..."
psql -U postgres -d anlink_dev_clone -f database/anlink_seed_data.sql

echo "[5/5] Loading education content..."
psql -U postgres -d anlink_dev_clone -f database/education_seed_data.sql

echo ""
echo "========================================"
echo "Database restoration complete!"
echo "========================================"
