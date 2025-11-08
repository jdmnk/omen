#!/usr/bin/env python3
"""
Generate TypeScript types from FastAPI OpenAPI schema.

This script generates the OpenAPI schema and triggers the TypeScript generation
via the Node.js script which uses openapi-typescript.
"""

import json
import subprocess
import sys
from pathlib import Path

# Paths
SCRIPT_DIR = Path(__file__).parent
BACKEND_DIR = SCRIPT_DIR.parent
FRONTEND_DIR = BACKEND_DIR.parent / "frontend"
OPENAPI_SCHEMA = BACKEND_DIR / "openapi.json"


def generate_openapi_schema():
    """Generate OpenAPI schema from FastAPI app."""
    print("📡 Generating OpenAPI schema from FastAPI...")

    # Add src to path
    sys.path.insert(0, str(BACKEND_DIR / "src"))

    from src.api.api import app

    # Generate OpenAPI schema
    openapi_schema = app.openapi()

    # Write to file
    OPENAPI_SCHEMA.write_text(json.dumps(openapi_schema, indent=2))

    print(f"✅ Generated OpenAPI schema: {OPENAPI_SCHEMA}")
    print(f"   {len(openapi_schema.get('paths', {}))} endpoints")
    print(f"   {len(openapi_schema.get('components', {}).get('schemas', {}))} schemas")


def generate_typescript_types():
    """Generate TypeScript types using the Node.js script."""
    print("\n🔨 Generating TypeScript types...")

    cmd = ["node", str(FRONTEND_DIR / "scripts" / "generate-types-from-openapi.js")]

    result = subprocess.run(cmd, cwd=str(FRONTEND_DIR), capture_output=True, text=True)

    if result.returncode != 0:
        print(f"❌ Error generating types:\n{result.stderr}")
        sys.exit(1)

    print(result.stdout)


def main():
    """Main entry point."""
    print("🚀 Starting type generation...\n")

    # Step 1: Generate OpenAPI schema
    generate_openapi_schema()

    # Step 2: Generate TypeScript types
    generate_typescript_types()

    print("\n✨ Done!")


if __name__ == "__main__":
    main()
