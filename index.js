const { Command } = require("commander");
const { execSync, spawn } = require("child_process");
const fs = require("fs");

let open;
const program = new Command();

program.name("Acode CLI").description("Acode cli interface.").version("0.0.1");

program
  .argument("<file>", "Open a file or folder in Acode")
  .option("-h, --help", "Display help information")
  .option("-v, --verbose", "Set verbose mode")
  .option("-i", "--install", "Install as an extension")
  .option("-t", "--terminal <server>", "Start and manager terminal servers");

program.on("command:*", () => {
  error("Invalid command!");
});

program.action(async (file, option) => {
  open = await import("open");
  let verbose = option.verbose;

  if (option.help) {
    return program.help();
  }

  if (option.terminal) {
    startTerminal(option.args[0] || "acodex");
  }

  if (option.install) {
    let path = getRealPath(file);
    if (path == null) {
      return error("Invalid path provided!");
    }

    verbose && log(`Installing extension from path: ${path}`);
    // Your implementation goes here
  } else if (file) {
    let path = getRealPath(file);
    if (path == null) {
      return error("Invalid path provided!");
    }

    if (fs.existsSync(path)) {
      // Open file in Acode
      let fileStat = fs.statSync(path);
      if (fileStat.isFile()) {
        verbose && log(`Opening file: ${path}`);
        await openFile(path);
      } else {
        verbose && log(`Opening folder: ${path}`);
        await openFolder(path);
      }
    } else {
      error("Invalid path provided!");
    }
  } else {
    error(
      "Please specify a file, folder, " + "or use --install for extensions."
    );
  }
});
program.parse();

// Helper Functions
function getRealPath(path) {
  try {
    return fs.realpathSync(path);
  } catch {
    return null;
  }
}

function startActivity(extraArgs) {
  let main = package => {
    let command = `am start-activity ${package}/.MainActivity ${extraArgs}`;
    return execSync(command);
  };

  try {
    // For Acode paid version.
    main("com.foxdebug.acode");
  } catch {
    // For Acode free version.
    main("com.foxdebug.acodefree");
  }
}

function startTerminal(server) {
  let command;

  if (server === "acodex") {
    command = "acodeX-server";
  } else if (server === "acode") {
    command = "node ~/termServer/index.js";
  }
  
  log(`Starting Terminal server for ${server} ("${command}").`);

  let proc = spawn(command);
  proc.on("spawn", () => {
    log(`Terminal server for ${server} started.`);
  });

  proc.stdout.on("data", data => {
    log(`(${server}): ${data}`);
  });
}

function log(...messages) {
  console.log("[Acode CLI]", ...messages);
}

function error(...messages) {
  console.error("[Acode CLI]", ...messages);
}

function warn(...messages) {
  console.warn("[Acode CLI]", ...messages);
}

// Actions Implementations.
function openFile(path) {
  // startActivity(`-d "acode://cli/open-file/${encodeURIComponent(path)}"`);
  return open.default(`acode://cli/open-file/${encodeURIComponent(path)}`);
}

function openFolder(path) {
  // startActivity(`-d "acode://cli/open-folder/${encodeURIComponent(path)}"`);
  return open.default(`acode://cli/open-folder/${encodeURIComponent(path)}`);
}
