# Acode CLI

This package serves as a companion to the `Acode CLI` Plugin.

____
## How To Use

Ensure the package is installed by running
```sh
npm install -g @thraize/acode-cli
```

### To see the help page
```sh
acode --help
```


### To open current directory
```sh
acode .
```

### To open a directory
```sh
acode /path/to/directory/
```

### To open a file
```sh
acode /path/to/file
```

### To install a plugin
```sh
acode install /path/to/plugin
```

### To uninstall a plugin
```sh
acode uninstall <plugin-id>
```

### To enable a plugin
```sh
acode enable <plugin-id>
```

### To disable a plugin
```sh
acode disable <plugin-id>
```

### To start acode language server
```sh
acode -ls
```

Or

```sh
acode --start-lsp
```


### To start acode terminal server (acodex/acode terminal)

Use `acodex` to start AcodeX Server and use `acode` to start Acode Terminal Server (npm version)

```sh
acode -t <server_name>
```

Or

```sh
acode --terminal <terminal_name>
```



