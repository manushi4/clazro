import { assertDbFeaturesInRegistry } from "../src/services/config/contractService";

async function main() {
  const result = await assertDbFeaturesInRegistry();
  console.log(
    JSON.stringify(
      {
        ok: result.ok,
        missingInRegistry: result.missingInRegistry,
        registrySize: result.registrySize,
        dbSize: result.dbSize,
      },
      null,
      2
    )
  );
  if (!result.ok) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
