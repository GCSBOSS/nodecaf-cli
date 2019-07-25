# [Nodecaf CLI](https://gitlab.com/GCSBOSS/nodecaf-cli)

> Docs for version v0.1.x.

Nodecaf CLI is contains a series of useful tools and code genration for the use
of [Nodecaf Framework](https://gitlab.com/GCSBOSS/nodecaf).
Using Nodecaf CLI you'll get:
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

### Common Commands

- `-v --version`: Outputs the currently installed version of Nodecaf CLI.
- `-h --help`: Outputs the complete command reference.

### Init Project

`nodecaf init` Generates a skelleton Nodecaf project file structure in the current
directory.

> You must already have a well-formed package.json in the target directory.

**Options**

- `-p --path [directory]`: Project root directory (defaults to working dir)
- `-c --confPath [file]`: Generate a config file and plug it in the structure
- `-n --name [string]`: A name/title for the generated app structure
- `--confType (yaml | toml)`: The type for the generated config file

### Open API Support

`nodecaf openapi` Generates an [Open API](https://www.openapis.org/) compliant
document of a given Nodecaf API.

**Options**

- `-p --path directory`: Project root directory (defaults to working dir)
- `--apiPath file`: A path to your project's API file (defaults to `lib/api.js`)
- `-t --type (json | yaml)`: The type of document to be generated (defaults to JSON)

**Arguments**
- `outFile`: A file path to save the generated document (required)
