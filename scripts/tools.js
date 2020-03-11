/* utilities module by own. */
const utils = require("./utils");

/**
 * @typedef TToolArgs
 * @prop {string} basePath
 * @prop {string} cmd
 * @prop {RegExp} test
 */

 /**
  * @type {TToolArgs}
  */
const params = utils.getExtraArgs();

/**
 * 
 * @param {string} taskName 
 * @param {(source: string) => string} process 
 * @param {RegExp} test 
 * @param {string} [base] 
 */
function processSources(taskName, process, test, base = "./build") {
    const re = params.test || test;
    const jsSources = [];
    utils.walkDirSync(base, dirent => {
        if (dirent.isFile() && re.test(dirent.name)) {
            jsSources.push(dirent.name);
        }
    });
    console.time(taskName);
    for (const js of jsSources) {
        // (err: any, data: string) => void
        utils.readTextUTF8(`${base}/${js}`, (err, data) => {
            if (err) {
                console.log(err);
                return;
            }
            utils.writeTextUTF8(
                process(data), `${base}/${js}`
            );
        });
    }
    console.timeEnd(taskName);
}

const ToolFunctions = {
    // node ./scripts/tools -cmd rmc [-basePath ./dist]
    rmc: () => {
        const rmc = require("rm-cstyle-cmts");
        processSources(
            "rm-cstyle-cmts", data => rmc(data), params.test || /.js$/, params.basePath
        );
    },
}

if (params.cmd) {
    const fn = ToolFunctions[params.cmd];
    typeof fn === "function" && fn();
} else {
    const commands = Object.keys(ToolFunctions);
    console.log(`
Usage: node tools -cmd <command name>
 - - - - available commands:`
);
    for (const cmd of commands) {
        console.log(cmd);
    }
}
