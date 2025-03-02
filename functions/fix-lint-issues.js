// Script to fix common ESLint issues across all files
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

// Get all JavaScript files recursively
function getAllJsFiles(dir, fileList = []) { const files = fs.readdirSync(dir);
  
  files.forEach((file) => { const filePath = path.join(dir, file);
    
    if (fs.statSync(filePath).isDirectory()) { getAllJsFiles(filePath, fileList);
    } else if (file.endsWith(".js")) { fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Fix common issues in a file
function fixFileIssues(filePath) { console.log(`Processing ${ filePath }...`);
  
  let content = fs.readFileSync(filePath, "utf8");
  
  // Fix optional chaining syntax 
  content = content.replace(/(\w+)\.(\w+)\?\./g, "$1 && $1.$2 && $1.$2.");
  
  // Fix missing trailing commas
  content = content.replace(/,\s*([}\]])/g, "$1");
  
  // Fix space issues in object curlies
  content = content.replace(/{\s*(\w+)/g, "{ $1");
  content = content.replace(/(\w+)\s*}/g, "$1 }");
  
  // Ensure files end with a newline
  if (!content.endsWith("\n")) { content += "\n";
  }
  
  fs.writeFileSync(filePath, content);
}

// Main process
const jsFiles = getAllJsFiles(".");
jsFiles.forEach(fixFileIssues);

console.log("\nRunning ESLint fix...");
exec("npm run lint:fix", (error, stdout, stderr) => { if (error) { console.error(`Error running ESLint: ${ error.message }`);
    return;
  }
  
  if (stderr) { console.error(`ESLint stderr: ${ stderr }`);
    return;
  }
  
  console.log(stdout);
  console.log("\nRunning Prettier...");
  
  exec("npm run format", (error, stdout, stderr) => { if (error) { console.error(`Error running Prettier: ${ error.message }`);
      return;
    }
    
    if (stderr) { console.error(`Prettier stderr: ${ stderr }`);
      return;
    }
    
    console.log(stdout);
    console.log("\nLinting issues fixed! 🎉");
  });
});
