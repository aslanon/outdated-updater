const cliSpinners = require('cli-spinners');
const logUpdate = require('log-update');
const exec = require('child_process').exec;
var fs = require('fs');
var path = require('path');
var Prompt = require('prompt-checkbox');
var prompt = null
var interval;

/**
 * Get outdated list
 * 
 */
let outdated = function () {
  let arr = []

  return new Promise((resolve, reject) => {
    exec('npm outdated', {
      cwd: process.cwd()
    }, function (err, stdout, stderr) {

      var stream = fs.createWriteStream("outdated.txt");
      stream.once('open', function (fd) {
        // Package Current  Wanted  Latest  Location
        var lines = stdout.split('\n');
        // remove first line
        lines.splice(0, 1);
        var newtext = lines.join('\n');

        let packageLine = newtext.split('\n')
        let str = ""

        for (let i = 0; i < packageLine.length; i++) {
          const packageItem = packageLine[i];
          str = ""

          for (let j = 0; j < packageItem.split(' ').length; j++) {
            const packageObj = packageItem.split(' ')[j];
            if (packageObj)
              str += packageObj + '$'
          }

          if (str.length > 0)
            arr.push(
              {
                label: str.split('$')[0],
                name: str.split('$')[0] + " (" + str.split('$')[1] + " --> " + str.split('$')[3] + ")",
                current: str.split('$')[1],
                wanted: str.split('$')[2],
                latest: str.split('$')[3],
                location: str.split('$')[4],
              }
            )
        }
        stream.write(stdout);
        stream.end();
        resolve(arr)
      });

    });

  })

}

/**
 * @param {String} command 
 */
let runCommand = function (command) {
  return new Promise((resolve, reject) => {
    if (command == 'npm install --save ' || command == 'npm install --save-dev ') resolve('')
    exec(command, {
      cwd: process.cwd()
    }, function (err, stdout, stderr) {
      resolve(stdout)
    });
  })
}

/**
 * Generate new object for dependencies and dev dependencies object
 * from package.json and npm outdated 
 * 
 * @param {Object} dep, devDep 
 */
let getOutdatedPackageList = function (dep, devDep) {
  let arrDep = []
  let arrDevDep = []
  return new Promise((resolve, reject) => {
    outdated().then(array => {
      for (let i = 0; i < array.length; i++) {
        const package = array[i];
        if (Object.keys(dep).includes(package.label)) arrDep.push(package)
        if (Object.keys(devDep).includes(package.label)) arrDevDep.push(package)
      }
      resolve({ arrDep, arrDevDep })
    })

  })
}

/**
 * Cli select list
 * 
 * @param {Object} dev, devDep
 */
let newPrompt = function (dev, devDep) {
  let opt = {
    name: 'install',
    message: 'Which dependencies would you like to update?',
    choices: {
      "dependencies": dev,
      "devDependencies": devDep
    },
    transform: function (answer) {
      return answer ?
        answer
          .map(this.choices.get.bind(this.choices))
          .map(item => {
            return {
              choices: item.group ? item.group.name : null,
              value: item.value, label: item.label
            }
          }
          ) : [];
    }
  }
  if (dev.length <= 0) delete opt.choices.dependencies
  if (devDep.length <= 0) delete opt.choices.devDependencies
  return new Prompt(opt);
}

/**
 * @param {String} name, msg
 */
let startLoading = function (name, msg) {
  const spinner = cliSpinners[name ? name : 'dots'];
  let count = 0;
  let text = msg ? ' ' + msg : ' Loading'
  interval = setInterval(() => {
    const { frames } = spinner;
    logUpdate(frames[count = ++count % frames.length] + text);
  }, spinner.interval);
}

let stopLoading = function () {
  clearInterval(interval)
}

module.exports.init = function init(program) {
  var filePath = path.join(process.cwd(), 'package.json')
  let packageJson = JSON.parse(fs.readFileSync(filePath));
  var { dependencies, devDependencies } = {
    dependencies: packageJson.dependencies || {},
    devDependencies: packageJson.devDependencies || {}
  }

  if (!fs.existsSync(filePath)) {
    console.log('package.json not found');
    process.exit(1);
  }

  if (program) {
    startLoading('clock', 'Checking packages')

    getOutdatedPackageList(dependencies, devDependencies)
      .then(arr => {
        stopLoading()

        if (arr.arrDep.length <= 0 && arr.arrDevDep.length <= 0) {
          console.log('No components with updates');
          return
        }

        prompt = newPrompt(arr.arrDep, arr.arrDevDep)
        prompt.run()
          .then(function (answers) {
            let depCommand = 'npm install --save '
            let devDepCommand = 'npm install --save-dev '

            for (let i = 0; i < answers.length; i++) {
              const pkg = answers[i];

              if (pkg.choices == 'dependencies' && pkg.label != undefined)
                depCommand += pkg.label + "@latest "

              if (pkg.choices == 'devDependencies' && pkg.label != undefined)
                devDepCommand += pkg.label + "@latest "
            }


            startLoading('clock', 'Updating packages')
            runCommand(depCommand).then(stdout => {
              console.log(stdout)
              runCommand(devDepCommand).then(devStdout => {
                console.log(devStdout)
                stopLoading()
              })
            })

          }).catch(function (err) {
            console.log(err)
          })
      })
  }

}

