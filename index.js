const { execSync, exec, spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

// Helper Functions
function getRealPath(path) {
  try {
    return fs.realpathSync(path);
  } catch {
    return null;
  }
}

async function startActivity(extraArgs, verbose) {
  let main = async package => {
    let command = `am start ${package}/.MainActivity ${extraArgs || ""}`;

    return await new Promise((resolve, reject) => {
      exec(command, (err, stdout, stderr) => {
        if (err) {
          return reject(err);
        }

        verbose && stdout && log(stdout);
        verbose && stderr && error(stderr);

        if (stderr) {
          return resolve(1);
        }
        return resolve(0);
      });
    });
  };

  try {
    // For Acode paid version.
    return await main("com.foxdebug.acode");
  } catch {
    // For Acode free version.
    return await main("com.foxdebug.acodefree");
  }
}

function startTerminal(server, verbose) {
  let command, args = [];

  if (server === "acodex") {
    command = "acodeX-server";
  } else if (server === "acode") {
    command = 'termServer';
  }

  verbose && log(`Starting Terminal server for ${server} ("${command}").`);

  let proc = spawn(command, args);
  proc.on("spawn", () => {
    log(`Terminal server for ${server} started.`);
  });
  proc.on("close", () => {
    log(`Terminal server for ${server} stopped.`);
  });

  proc.stdout.on("data", data => {
    log(`(${server}): ${data}`);
  });

  proc.stderr.on("data", data => {
    log(`(${server}): ${data}`);
  });
}

function startAcodeLs(verbose) {
  let command = "acode-ls", args = [];

  verbose && log('Starting Acode Language Server.');

  let proc = spawn(command, args);
  proc.on("spawn", () => {
    log('Language server started.');
  });
  proc.on("close", () => {
    log('Language server stopped.');
  });

  proc.stdout.on("data", data => {
    log(`(acode-ls): ${data}`);
  });

  proc.stderr.on("data", data => {
    log(`(acode-ls): ${data}`);
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

function createZipFile(basePath) {
  const jszip = require("jszip");

  const mainFile = path.join(basePath, "./main.js");
  const iconFile = path.join(basePath, "./icon.png");
  const pluginJSON = path.join(basePath, "./plugin.json");
  const distFolder = path.join(basePath, "./dist");
  let readmeDotMd = path.join(basePath, "./readme.md");

  if (!fs.existsSync(readmeDotMd)) {
    readmeDotMd = path.join(basePath, "./README.md");
  }

  // create zip file of dist folder

  const zip = new jszip();

  if (fs.existsSync(mainFile)) {
    zip.file("main.js", fs.readFileSync(mainFile));
  }
  zip.file("icon.png", fs.readFileSync(iconFile));
  zip.file("plugin.json", fs.readFileSync(pluginJSON));

  if (!fs.existsSync(distFolder)) {
    fs.mkdirSync(distFolder);
  }

  zip.file("readme.md", fs.readFileSync(readmeDotMd));

  loadFile("", distFolder);

  zip
    .generateNodeStream({ type: "nodebuffer", streamFiles: true })
    .pipe(fs.createWriteStream(path.join(basePath, "./dist.zip")))
    .on("finish", () => {
      log("Plugin dist.zip written.");
    });

  function loadFile(root, folder) {
    const distFiles = fs.readdirSync(folder);
    distFiles.forEach(file => {
      const stat = fs.statSync(path.join(folder, file));

      if (stat.isDirectory()) {
        zip.folder(file);
        loadFile(path.join(root, file), path.join(folder, file));
        return;
      }

      if (!/LICENSE.txt/.test(file)) {
        zip.file(
          path.join(root, file),
          fs.readFileSync(path.join(folder, file))
        );
      }
    });
  }
}

function getWebpackConfig(basePath, configPath) {
  if (!configPath) {
    configPath = path.join(basePath, "webpack.config.js");
  }

  return require(configPath);
}

function onBuildExtension(basePath, err, stats) {
  if (err) {
    error("(webpack):", err.stack || err);
    if (err.details) {
      error("(webpack):", err.details);
    }
    return;
  }

  const info = stats.toJson();
  if (stats.hasErrors()) {
    error("(webpack):", info.errors);
  }

  if (stats.hasWarnings()) {
    warn("(webpack):", info.warnings);
  }

  log(
    "(webpack):",
    stats.toString({
      chunks: false,
      colors: true
    })
  );

  installDistZip(basePath);
}

function installDistZip(basePath) {
  let distPath = path.join(basePath, "dist.zip");
  if (fs.existsSync(distPath)) {
    log("Installing plugin from: ", distPath);
    _open(`acode://cli/install/${encodeURIComponent(distPath)}`);
  }
}

function installWebpack(path, options) {
  const webpack = require("webpack");
  const compiler = webpack(getWebpackConfig(path, options.config));

  if (options.watch) {
    const watching = compiler.watch(
      {
        aggregateTimeout: 300,
        poll: undefined
      },
      (err, stats) => onBuildExtension(path, err, stats)
    );
  } else {
    compiler.run((err, stats) => {
      onBuildExtension(path, err, stats);
      compiler.close(closeErr => {});
    });
  }
}

async function installExtension(path, options) {
  if (options.simple) {
    await createZipFile(path);
    installDistZip(path);
  } else {
    installWebpack(path, options);
  }
}

async function _open(uri, verbose) {
  let exitCode = await startActivity(verbose);
  if (exitCode === 0) {
    await new Promise(r => setTimeout(r, 5000));
  }

  let open = await import("open");
  await open.default(uri);
}

// Actions Implementations.
function openFile(path, verbose) {
  return _open(`acode://cli/open-file/${encodeURIComponent(path)}`, verbose);
}

function openFolder(path, verbose) {
  return _open(`acode://cli/open-folder/${encodeURIComponent(path)}`, verbose);
}

module.exports = {
  getRealPath,
  openFolder,
  openFile,
  startTerminal,
  startAcodeLs,
  installExtension,
  open: _open,

  start: startActivity,
  extensions: {
    install: installExtension
  }
};
