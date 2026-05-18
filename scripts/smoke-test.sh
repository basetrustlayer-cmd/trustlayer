#!/usr/bin/env sh
set -eu

BASE_URL="${BASE_URL:-http://localhost:3000}"

echo "Running TrustLayer smoke tests against ${BASE_URL}"

health_response="$(curl -fsS "${BASE_URL}/health")"
echo "$health_response" | grep -q '"status":"ok"'

metrics_response="$(curl -fsS "${BASE_URL}/metrics")"
echo "$metrics_response" | grep -q "trustlayer_api_uptime_seconds"

echo "Smoke tests passed."
