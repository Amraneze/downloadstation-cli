const chalk = require("chalk");
const ora = require("ora");

const initialize = require("./init");
const { isUrl } = require("../lib/validation");

const MAX_RETRIES = 5;

let retries = 0;

const waitForTaskToFinish = (synology, id) => {
  synology.tasksInfo().then((task) => {
    console.log(`Task ${JSON.stringify(task)}`);
    if (task.status === "finished") {
      console.log(`Task ${task.id} finished`);
    } else {
      if (retries === MAX_RETRIES) {
        console.error(`Timeout for getting info of the task ${task.id}`);
        process.exit(1);
      }
      retries++;
      console.log(`Task ${task.id} status is ${task.status}`);
      setTimeout(() => waitForTaskToFinish(synology, id), 3000);
    }
  });
};

const create = async () => {
  // initialize synology connection
  const synology = await initialize();

  // get download url
  const [, , , url] = process.argv;

  if (!isUrl(url)) {
    console.error(`The url ${url} provided is not valid`);
    process.exit(1);
  }

  console.info(`The provided url is ${url}`);

  const spinner = ora("Adding new task ...").start();

  // create new task
  const task = await synology.create(url);

  spinner.stop();

  if (task.success === true) {
    console.log(
      chalk.green("Download task successfully created"),
      JSON.stringify(task)
    );
    waitForTaskToFinish(synology, task.id);
  } else {
    console.log(
      chalk.white.bgRed("There was a problem while trying to create the task")
    );
  }
};

module.exports = { create };
