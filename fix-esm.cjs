const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const targetDir = "node_modules/@n8n/json-schema-to-zod/dist/esm";

if (fs.existsSync(targetDir)) {
  try {
    console.log("Fixing ESM imports for @n8n/json-schema-to-zod...");

    // Find all .js files
    const files = execSync(`find ${targetDir} -name "*.js"`)
      .toString()
      .split("\n")
      .filter((f) => f.trim());

    files.forEach((file) => {
      try {
        let content = fs.readFileSync(file, "utf8");

        // Fix relative imports
        content = content.replace(/from '\.\/([^']*?)';/g, "from './$1.js';");
        content = content.replace(
          /from '\.\.\/([^']*?)';/g,
          "from '../$1.js';"
        );

        // Fix double .js extensions
        content = content.replace(/\.js\.js/g, ".js");

        fs.writeFileSync(file, content);
      } catch (e) {
        // Ignore errors for individual files
      }
    });

    console.log("ESM imports fixed successfully!");
  } catch (e) {
    console.log("ESM fix skipped (package not found or error occurred)");
  }
} else {
  console.log("ESM fix skipped (package not found)");
}
