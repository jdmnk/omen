#!/usr/bin/env node
/**
 * Generate TypeScript types from FastAPI OpenAPI schema
 *
 * This script generates clean TypeScript types with proper exports
 * that don't require nested component access.
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const OPENAPI_SCHEMA_FILE = path.join(__dirname, "../../backend/openapi.json");
const OUTPUT_FILE = path.join(
  __dirname,
  "../src/lib/models/api.models.generated.ts"
);

console.log(`📡 Looking for OpenAPI schema at ${OPENAPI_SCHEMA_FILE}...`);

// Check if schema file exists
if (!fs.existsSync(OPENAPI_SCHEMA_FILE)) {
  console.error(`❌ OpenAPI schema not found at ${OPENAPI_SCHEMA_FILE}`);
  console.error(
    `   Run: cd backend && poetry run python scripts/generate_types.py`
  );
  process.exit(1);
}

try {
  // Read and validate schema
  const schemaContent = fs.readFileSync(OPENAPI_SCHEMA_FILE, "utf-8");
  const schema = JSON.parse(schemaContent);

  console.log(
    `✅ Found OpenAPI schema (${
      Object.keys(schema.paths || {}).length
    } endpoints)`
  );

  // Generate TypeScript types using openapi-typescript
  console.log(`🔨 Generating TypeScript types...`);
  const tempOutput = path.join(__dirname, "../.openapi-temp.ts");

  execSync(`npx openapi-typescript ${OPENAPI_SCHEMA_FILE} -o ${tempOutput}`, {
    stdio: "inherit",
    cwd: path.join(__dirname, ".."),
  });

  // Post-process to create clean type exports
  const generatedContent = fs.readFileSync(tempOutput, "utf-8");

  // Extract schemas and create direct type exports
  const schemas = schema.components?.schemas || {};
  const schemaNames = Object.keys(schemas);

  let output = `// This file is auto-generated. Do not edit manually.
// Run: pnpm generate-types
// Source: FastAPI OpenAPI schema

${generatedContent}

// Clean type exports (no need to access via components["schemas"])
`;

  // Create type aliases for all schemas
  for (const schemaName of schemaNames) {
    // For Input/Output variants, use Output for the default export
    if (schemaName.endsWith("-Output")) {
      const baseName = schemaName.replace("-Output", "");
      output += `export type ${baseName} = components["schemas"]["${schemaName}"];\n`;
    } else if (schemaName.endsWith("-Input")) {
      const baseName = schemaName.replace("-Input", "");
      output += `export type ${baseName}Input = components["schemas"]["${schemaName}"];\n`;
    } else {
      output += `export type ${schemaName} = components["schemas"]["${schemaName}"];\n`;
    }
  }

  // Clean up temp file
  fs.unlinkSync(tempOutput);

  // Write final output
  fs.writeFileSync(OUTPUT_FILE, output);

  console.log(`✅ Generated TypeScript types: ${OUTPUT_FILE}`);
  console.log(`   ${schemaNames.length} type exports created`);
} catch (error) {
  console.error(`❌ Error generating types:`, error.message);
  process.exit(1);
}
