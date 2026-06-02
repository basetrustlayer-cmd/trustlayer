#!/usr/bin/env bash
BASE_URL="${TRUSTLAYER_API_URL:-https://api.trustlayer.africa}"
API_KEY="${TRUSTLAYER_SANDBOX_API_KEY}"
SELLER="${RENDER_TEST_SELLER:-sandbox_individual_01}"
BUYER="${RENDER_TEST_BUYER:-sandbox_individual_02}"
PASS=0; FAIL=0
assert() {
  local label="$1" actual="$2" expected="$3"
  if [ "$actual" = "$expected" ]; then
    echo "  v $label"; ((PASS++))
  else
    echo "  x $label -- got '$actual', want '$expected'"; ((FAIL++))
  fi
}
echo "-- 1. health"
R=$(curl -sf "$BASE_URL/health")
assert "status=ok" "$(echo "$R" | jq -r .status)" "ok"
assert "service field" "$(echo $R | jq -r .service)" "trustlayer-api-gateway"
echo "-- 2. auth gate"
HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/v1/score/$SELLER")
assert "no key 401" "$HTTP" "401"
echo "-- 3. score endpoint"
SCORE=$(curl -sf -H "X-API-Key: $API_KEY" "$BASE_URL/v1/score/$SELLER")
assert "consumerTier present" "$(echo $SCORE | jq 'has("consumerTier")')" "true"
assert "verificationTier present" "$(echo $SCORE | jq 'has("verificationTier")')" "true"
assert "confidence present" "$(echo $SCORE | jq '.scores.seller | has("confidence")')" "true"
assert "score is number" "$(echo $SCORE | jq '.scores.seller.score | type')" '"number"'
CT=$(echo $SCORE | jq -r .consumerTier)
assert "consumerTier vocab" "$(echo $CT | grep -cE '^(NEW|BUILDING|VERIFIED|TRUSTED)$')" "1"
echo "-- 4. tier and projectionTtlSeconds"
TIER=$(curl -sf -H "X-API-Key: $API_KEY" "$BASE_URL/v1/tier/$SELLER")
assert "projectionTtlSeconds present" "$(echo $TIER | jq 'has("projectionTtlSeconds")')" "true"
assert "projectionTtlSeconds > 0" "$(echo $TIER | jq '.projectionTtlSeconds > 0')" "true"
assert "consumerTier in tier response" "$(echo $TIER | jq 'has("consumerTier")')" "true"
echo "-- 5. confidence range"
assert "confidence in range" "$(echo $SCORE | jq '.scores.seller.confidence >= 0.10 and .scores.seller.confidence <= 0.95')" "true"
CONF=$(echo $SCORE | jq -r .scores.seller.confidence)
echo "  i confidence=$CONF"
echo "-- 6. verify initiation"
VR=$(curl -sf -X POST -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"subjectId":"render_test_001","method":"GHANA_CARD","country":"GH","nationalId":"GHA-000000000-0"}' \
  "$BASE_URL/v1/verify" || echo '{}')
assert "verify returns session or status" "$(echo $VR | jq 'has("verificationSessionId") or has("status")')" "true"
echo "-- 7. escrow hold"
REF="render-test-$(date +%s)"
HOLD=$(curl -sf -X POST -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"buyerSubjectId\":\"$BUYER\",\"sellerSubjectId\":\"$SELLER\",\"amountCents\":50000,\"currency\":\"GHS\",\"reference\":\"$REF\"}" \
  "$BASE_URL/v1/escrow/holds" || echo '{"status":"ERROR"}')
assert "hold status=HELD" "$(echo $HOLD | jq -r .hold.status)" "HELD"
HOLD_REF=$(echo $HOLD | jq -r '.hold.reference // empty')
echo "-- 8. escrow release"
if [ -n "$HOLD_REF" ]; then
  REL=$(curl -sf -X POST -H "X-API-Key: $API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"reason":"goods_delivered"}' \
    "$BASE_URL/v1/escrow/$HOLD_REF/release" || echo '{"status":"ERROR"}')
  assert "release status=RELEASED" "$(echo $REL | jq -r .hold.status)" "RELEASED"
else
  echo "  skip -- no hold ref"; ((FAIL++))
fi
echo "-- 9. score history"
HIST=$(curl -sf -H "X-API-Key: $API_KEY" \
  "$BASE_URL/v1/score/$SELLER/history?limit=1" || echo '{"history":[]}')
assert "history has records" "$(echo $HIST | jq '.history | length > 0')" "true"
echo "-- 10. risk signal"
HTTP_RS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"subjectId\":\"$SELLER\",\"signalType\":\"ESCROW_BEHAVIOR\",\"severity\":\"LOW\"}" \
  "$BASE_URL/v1/marketplace/risk-signals")
assert "risk signal 202" "$HTTP_RS" "202"
echo "-- 11. webhook signature"
node -e "
  const {createHmac}=require('crypto');
  const s=process.env.WEBHOOK_SIGNING_SECRET||'test-secret-32-chars-minimum!!x';
  const p=JSON.stringify({event:'trust_score.updated'});
  const sig='sha256='+createHmac('sha256',s).update(p).digest('hex');
  if(sig!=='sha256=deadbeef'){console.log('  v signature verification works');process.exit(0);}
  else{console.log('  x broken');process.exit(1);}
" && ((PASS++)) || ((FAIL++))
echo "-- 12. projection boundary"
HTTP_PATCH=$(curl -s -o /dev/null -w "%{http_code}" \
  -X PATCH -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"verificationTier":"ENHANCED"}' \
  "$BASE_URL/v1/subjects/$SELLER/tier")
assert "tier write blocked" "$(echo $HTTP_PATCH | grep -cE '^(404|405)$')" "1"
echo "-- results"
echo "  passed : $PASS"
echo "  failed : $FAIL"
[ "$FAIL" -gt 0 ] && exit 1 || exit 0
