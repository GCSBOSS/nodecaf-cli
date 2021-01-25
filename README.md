# [Nodecaf CLI](https://gitlab.com/GCSBOSS/nodecaf-cli)

> Docs for version v0.4.x.

Nodecaf CLI contains a series of useful tools and code generation for the use
of [Nodecaf Framework](https://gitlab.com/GCSBOSS/nodecaf).
Using Nodecaf CLI you'll be able to:
- [Run your application](#running) via command line or containers.
- [Generate a basic Nodecaf project structure](#init-project).
- [Generate an OpenAPI document](#open-api-support) or your APIs.

## Installation

`npm i -P -g nodecaf-cli`

## Reporting Bugs
If you have found any problems with this module, please:

1. [Open an issue](https://gitlab.com/GCSBOSS/nodecaf-cli/issues/new).
2. Describe what happened and how.
3. Also in the issue text, reference the label `~bug`.

We will make sure to take a look when time allows us.

## Proposing Features
If you wish to get that awesome feature or have some advice for us, please:
1. [Open an issue](https://gitlab.com/GCSBOSS/nodecaf-cli/issues/new).
2. Describe your ideas.
3. Also in the issue text, reference the label `~proposal`.

## Contributing
If you have spotted any enhancements to be made and is willing to get your hands
dirty about it, fork us and
[submit your merge request](https://gitlab.com/GCSBOSS/nodecaf-cli/merge_requests/new)
so we can collaborate effectively.

## Manual
Check a brief description of how to use the available commands.

### Common Options

- `-v --version`: Outputs the currently installed version of Nodecaf CLI.
- `-h --help`: Outputs the complete command reference.

### Run Application

`nodecaf run` Executes the Nodecaf app installed in the specified directory.

**Options**

- `-c --conf [file]`: Conf file path (supports multiple eg.: `-c ./foo.toml -c ./bar.toml`)
- `-r --reload`: Whether the app should be reloaded upon code changes

**Arguments**

- `APP_PATH`: The path to your app's module directory or main js file.

### Init Project

`nodecaf init` Generates a base Nodecaf project file structure in the current
directory.

**Options**

- `-p --path [directory]`: Project root directory (defaults to working dir)
- `-c --conf [file]`: Path to a default config file relative to project root
- `--bin`: When present will generate a npm binary file to run the app
- `--bare`: When present will generate only js files

**Arguments**

- `APP_NAME`: The name to be used for the app all across the generated files.

### Open API Support

`nodecaf openapi` Generates an [Open API](https://www.openapis.org/) compliant
document of a given Nodecaf API.

**Options**

- `-p --path directory`: Project root directory (defaults to working dir)
- `--apiPath file`: A path to your project's API file (defaults to `lib/api.js`)
- `-t --type (json | yaml)`: The type of document to be generated (defaults to JSON)

**Arguments**
- `outFile`: A file path to save the generated document (required)
