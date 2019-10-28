#!/usr/bin/env node


var program = require('commander');
var outdatedUpdater = require('../lib/outdated-updater.js');

program
  .version(require('../package').version)
  .usage('[options]')
  .option('-l, --list', 'check packages and get update command')
  .option('-c, --check', 'check global packages instead of in the current project')
  .option('-u, --upgrade', 'upgrade package.json dependencies to match latest versions (maintaining existing policy)')
  .parse(process.argv);

if (program.global && program.upgrade) {
  print('outdated-updater cannot update global packages.');
  print('Run \'npm install -g [package]\' to upgrade a global package.');
  process.exit(1);
}

outdatedUpdater.init(program);

