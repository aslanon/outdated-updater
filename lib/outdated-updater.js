var fs = require('fs');
var path = require('path');
const cliSpinners = require('cli-spinners');
const logUpdate = require('log-update');
var List = require('prompt-list');

const exec = require('child_process').exec;


var listDep = new List({
  name: 'order',
  message: 'Which dependencies would you like to update?',
  // choices may be defined as an array or a function that returns an array
  choices: [
    'Dependencies',
    'Development Dependencies',
  ]
});



/**
 * Get outdated list
 * @param { Boolean } isCheck, isCommand
 */
let outdated = function (isCheck) {
  let arr = []

  return new Promise((resolve, reject) => {
    exec('npm outdated', {
      cwd: process.cwd()
    }, function (err, stdout, stderr) {
      // if (isCheck) {
      //   stdout.length > 0 ? resolve(stdout) : resolve('No components with updates')
      // }

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
                name: str.split('$')[0],
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
 * Upgrade outdated list
 */
let upgrade = function (command) {
  return new Promise((resolve, reject) => {
    exec(command, {
      cwd: process.cwd()
    }, function (err, stdout, stderr) {
      console.log(stdout)
    });

  })

}


/**
 *  Update command
 */
let checkOutdated = function (dep, devDep, suffix) {
  return new Promise((resolve, reject) => {
    let command = "npm install "
    let count = 0
    if (suffix) command += suffix + ' '
    outdated().then(array => {

      for (let i = 0; i < array.length; i++) {
        const package = array[i];

        if (suffix == '--save' && Object.keys(dep).includes(package.name)) {
          count++
          command += package.name + '@latest '
        }
        if (suffix == '--save-dev' && Object.keys(devDep).includes(package.name)) {
          count++
          command += package.name + '@latest '
        }
      }
      console.log(`\nNew version of ${count} components available\n`)
      if (!count) resolve('')
      resolve(command)
    })

  })
}

let getDependencies = function (title, dependencies) {
  let arr = []
  let depName = Object.keys(dependencies)
  let depVersion = Object.values(dependencies)
  console.log('\nYour ' + title + ': ' + depName.length + '\n')
  for (let i = 0; i < depName.length; i++) {
    const package = depName[i];
    let text = package + '\n' + depVersion[i] + "\n---------------------------------"
    arr.push({ name: package, version: depVersion[i] })
  }
  console.table(arr)
}


let setLoading = function (state, name) {
  const spinner = cliSpinners[name ? name : 'dots'];
  let count = 0;
  let interval;

  if (!state) {
    clearInterval(interval)
    process.exit(1)
  }

  interval = setInterval(() => {
    const { frames } = spinner;
    logUpdate(frames[count = ++count % frames.length] + ' Loading');
  }, spinner.interval);



}


module.exports.init = function init(program) {
  var packageFile = 'package.json';
  var filePath = path.join(process.cwd(), packageFile)
  let packageJson = fs.readFileSync(filePath);
  let packageData = JSON.parse(packageJson);
  var dependencies = packageData.dependencies || {};
  var devDependencies = packageData.devDependencies || {};

  if (!fs.existsSync(filePath)) {
    console.log('package.json not found');
    process.exit(1);
  }



  if (program.check) {
    getDependencies('dependencies', dependencies)
    getDependencies('development dependencies', devDependencies)
    outdated(isCheck = true)
      .then(resp => {
        console.log(`New version of ${resp.length} components available`)
        console.table(resp)
      })
  }

  if (program.upgrade) {
    checkOutdated()
      .then(command => {
        upgrade(command)
      })
  }

  if (program.list) {

    listDep.run()
      .then(function (answer) {
        console.log('Selected:', answer);
        let suffix = ''

        if (answer.toLowerCase() == 'dependencies') suffix = '--save'
        if (answer.toLowerCase() == 'development dependencies') suffix = '--save-dev'

        setLoading(true, 'clock')

        checkOutdated(dependencies, devDependencies, suffix)
          .then(command => {
            console.log(command)
            setLoading(false)
          })
      });


  }
}

