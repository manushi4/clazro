// Node-only registry check without ts-node. Requires SUPABASE_URL and SUPABASE_ANON_KEY env vars.
// Uses TypeScript transpileModule to load the feature registry TS file.
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const ts = require("typescript");
const { createClient } = require("@supabase/supabase-js");

function loadRegistry() {
  const filePath = path.join(__dirname, "..", "src", "config", "featureRegistry.ts");
  const source = fs.readFileSync(filePath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 },
  }).outputText;

  const sandbox = { module: { exports: {} }, exports: {} };
  vm.runInNewContext(transpiled, sandbox, { filename: "featureRegistry.js" });
  const registry = sandbox.module.exports.getFeatureRegistry
    ? sandbox.module.exports.getFeatureRegistry()
    : [];
  return registry.map((f) => f.id);
}

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    console.error("SUPABASE_URL and SUPABASE_ANON_KEY are required");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, anonKey, { db: { schema: "config_dev" } });
  const { data, error } = await supabase
    .schema("config_dev")
    .from("customer_features")
    .select("feature_id")
    .limit(1000);

  if (error) {
    console.error("DB query failed", error);
    process.exit(1);
  }

  const dbIds = new Set((data || []).map((row) => row.feature_id));
  const registryIds = new Set(loadRegistry());

  const missingInRegistry = [];
  dbIds.forEach((id) => {
    if (!registryIds.has(id)) missingInRegistry.push(id);
  });

  const result = {
    ok: missingInRegistry.length === 0,
    missingInRegistry,
    registrySize: registryIds.size,
    dbSize: dbIds.size,
  };

  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
