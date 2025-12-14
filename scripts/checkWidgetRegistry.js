// Node-only registry check for widgets. Requires SUPABASE_URL and SUPABASE_ANON_KEY env vars.
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const ts = require("typescript");
const { createClient } = require("@supabase/supabase-js");

function loadWidgetRegistryIds() {
  const filePath = path.join(__dirname, "..", "src", "config", "widgetRegistry.ts");
  const source = fs.readFileSync(filePath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 },
  }).outputText;

  const sandbox = { module: { exports: {} }, exports: {} };
  vm.runInNewContext(transpiled, sandbox, { filename: "widgetRegistry.js" });
  const registry = sandbox.module.exports.getWidgetRegistry
    ? sandbox.module.exports.getWidgetRegistry()
    : {};
  return Object.keys(registry);
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
    .from("dashboard_widgets")
    .select("widget_id")
    .limit(1000);

  if (error) {
    console.error("DB query failed", error);
    process.exit(1);
  }

  const dbIds = new Set((data || []).map((row) => row.widget_id));
  const registryIds = new Set(loadWidgetRegistryIds());

  const missingInRegistry = [];
  dbIds.forEach((id) => {
    if (!registryIds.has(id)) missingInRegistry.push(id);
  });

  const missingInDb = [];
  registryIds.forEach((id) => {
    if (!dbIds.has(id)) missingInDb.push(id);
  });

  const result = {
    ok: missingInRegistry.length === 0 && missingInDb.length === 0,
    missingInRegistry,
    missingInDb,
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
