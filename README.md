[![issues](https://badgen.net/github/issues/aslanon/outdated-updater)](https://badge.fury.io/js/vue-confirm-dialog) [![npm](https://img.shields.io/npm/dm/outdated-updater)](https://www.npmjs.com/package/outdated-updater) ![npm version](https://badge.fury.io/js/outdated-updater.svg)

## 📦 outdated-updater

Easily upgrade your npm components in your applications.

This program uses the `npm outdated` command. It generates a new command to update your components from the output of this command.



 npm outdated command:

```bash
onur@onur-v510:~/outdated-updater$ npm outdated

Package    Current          Wanted          Latest  Location
commander  MISSING           3.0.2           3.0.2  outdated-updater
fs         MISSING  0.0.1-security  0.0.1-security  outdated-updater
npm        MISSING          6.12.0          6.12.0  outdated-updater
```

outdated-updater generates a new command from this output.

```bash
onur@onur-v510:~/outdated-updater$ outdated-updater -l

New version of 3 components available
npm install --save commander@latest fs@latest npm@latest
```



### 📌 Install

```bash
npm install -g outdated-updater
```



### 👋 Help

```bash

onur@onur-v510:~/web/app$ outdated-updater help

Usage: outdated-updater [options] <package.json or dir>

Options:
  -V, --version  output the version number
  -l, --list     check packages and get update command
  -c, --check    check global packages instead of in the current project
  -u, --upgrade  upgrade package.json dependencies to match latest versions (maintaining existing policy)
  -h, --help     output usage information
```



### 🧐 Usage

Show me update command.

```bash
~$: cd /path/your/app/
~$: ls
	...
	package.json
	...

~$: outdated-updater -l

New version of 3 components available

npm install --save commander@latest fs@latest npm@latest
```



Upgrade my components for latest versions

```bash
~$: outdated-updater -u

New version of 3 components available

+ commander@3.0.2
+ fs@0.0.1-security
+ npm@6.12.0
added 432 packages from 839 contributors and audited 11985 packages in 5.598s
found 21 high severity vulnerabilities
  run `npm audit fix` to fix them, or `npm audit` for details

```



### Another usage

Check your app components.

![](https://github.com/aslanon/outdated-updater/blob/master/image/command.jpeg?raw=true)