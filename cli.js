#!/usr/bin/env node
const { Command } = require("commander");
const fs = require("fs");

const {
  open,
  start,
  openFile,
  openFolder,
  getRealPath,
  startAcodeLs,
  startTerminal,
  installExtension
} = require(".");

const program = new Command();

program.name("Acode CLI").description("Acode cli interface.").version("0.0.1");

program
  .option("-h, --help", "display help information")
  .option("-v, --verbose", "set verbose mode")
  .option("-ls, --start-lsp", "start acode language server")
  .option(
    "-t, --terminal [server]",
    "start and manager terminal servers. default (acodex)"
  )
  .argument("[file]", "Open a file or folder in Acode");

program
  .command("install <path>")
  .description("Install an extension")
  .option(
    "-w, --watch",
    "Watch the folder/file for change. Update plugin on change"
  )
  .option("-c, --config <path>", "Path to webpack config file")
  .option("-s, --simple", "Simply zip necessary files.")
  .action(async (path, options) => {
    path = getRealPath(path);
    if (path == null) {
      return error("Invalid path provided!");
    }
    installExtension(path, {
      watch: options.watch,
      simple: options.simple,
      config: options.config ? getRealPath(options.config) : null
    });
  });

program
  .command("uninstall <plugin_id>")
  .description("Uninstall a plugin by id")
  .action(async (pluginID, options) => {
    await open("acode://cli/uninstall/" + encodeURIComponent(pluginID));
  });

program
  .command("enable <plugin_id>")
  .description("Enable a plugin by id")
  .action(async (pluginID, options) => {
    await open("acode://cli/enable/" + encodeURIComponent(pluginID));
  });

program
  .command("disable <plugin_id>")
  .description("Disable a plugin by id")
  .action(async (pluginID, options) => {
    await open("acode://cli/disable/" + encodeURIComponent(pluginID));
  });

program
  .command("list")
  .description("List all installed plugins")
  .action(async (pluginID, options) => {});

program.action(async (file, option) => {
  let verbose = option.verbose;

  if (option.help || !(option.terminal || option.startLsp || file)) {
    return program.help();
  }

  if (option.terminal) {
    startTerminal(option.terminal || "acodex", verbose);
  }

  if (option.startLsp) {
    startAcodeLs(verbose);
  }

  if (file) {
    let path = getRealPath(file);
    if (path == null) {
      return error("Invalid path provided!");
    }

    if (fs.existsSync(path)) {
      // Open file in Acode
      let fileStat = fs.statSync(path);
      if (fileStat.isFile()) {
        verbose && log(`Opening file: ${path}`);
        await openFile(path, verbose);
      } else {
        verbose && log(`Opening folder: ${path}`);
        await openFolder(path, verbose);
      }
    } else {
      error("Invalid path provided!");
    }
  } else {
  	await start();
  }
});
program.parse();

function log(...messages) {
  console.log("[Acode CLI]", ...messages);
}

function error(...messages) {
  console.error("[Acode CLI]", ...messages);
}

function warn(...messages) {
  console.warn("[Acode CLI]", ...messages);
}
