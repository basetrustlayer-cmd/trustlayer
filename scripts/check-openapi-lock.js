const fs = require("fs");
const crypto = require("crypto");

const specPath = "api-spec/openapi.yaml";
const lockPath = "api-spec/openapi.lock.json";

if (!fs.existsSync(specPath)) {
  console.error(`Missing ${specPath}`);
  process.exit(1);
}

const spec = fs.readFileSync(specPath);
const hash = crypto.createHash("sha256").update(spec).digest("hex");

if (!fs.existsSync(lockPath)) {
  fs.writeFileSync(
    lockPath,
    JSON.stringify({ file: specPath, sha256: hash }, null, 2) + "\n"
  );
  console.log(`Created ${lockPath}`);
  process.exit(0);
}

const lock = JSON.parse(fs.readFileSync(lockPath, "utf8"));

if (lock.sha256 !== hash) {
  console.error("OpenAPI lock mismatch. Regenerate api-spec/openapi.lock.json.");
  console.error(`Expected: ${lock.sha256}`);
  console.error(`Actual:   ${hash}`);
  process.exit(1);
}

console.log("OpenAPI lock verified.");
