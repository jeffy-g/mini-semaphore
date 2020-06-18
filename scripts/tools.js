
const fs = require("fs");
/* utilities module by own. */
const utils = require("./utils");

/**
 * @typedef TToolArgs
 * @prop {string} basePath
 * @prop {string[]} targets
 * @prop {string} cmd
 * @prop {RegExp} test
 * @prop {RegExp} regex
 */

 /**
  * @type {TToolArgs}
  */
const params = utils.getExtraArgs();


/**
 * @typedef TProcessSourcesOpt
 * @prop {string} [base]
 * @prop {RegExp} [test]
 * @prop {string[]} [targets]
 */
/**
 * 
 * @param {string} taskName 
 * @param {(source: string) => string} process 
 * @param {TProcessSourcesOpt} [opt] 
 */
function processSources(
    taskName,
    process, {
        base = "./build", test,
        targets,
    } = {}
) {

    /** @type {string[]} */
    let sourceFiles;
    if (base) {
        sourceFiles = [];
        const re = params.test || test;
        utils.walkDirSync(base, dirent => {
            if (dirent.isFile() && re.test(dirent.name)) {
                sourceFiles.push(`${base}/${dirent.name}`);
            }
        });
    } else {
        sourceFiles = params.targets || targets;
        if (sourceFiles.length && params.basePath) {
            utils.appendStringTo(sourceFiles, params.basePath, "/");
        }
    }

    console.time(taskName);
    for (const sourceFile of sourceFiles) {
        if (fs.existsSync(sourceFile)) {
            // (err: any, data: string) => void
            utils.readTextUTF8(sourceFile, (err, data) => {
                if (err) {
                    console.log(err);
                    return;
                }
                utils.writeTextUTF8(
                    process(data), sourceFile
                );
            });
        } else {
            console.warn(`file: ${sourceFile} is not exists`);
        }
    }
    console.timeEnd(taskName);
}

const ToolFunctions = {
    // node ./scripts/tools -cmd stripWebpack -regex \"%npm_package_defs_regex%\""
    stripWebpack: () => {
        const re = params.regex;
        if (re) {
            processSources(
                "[stripWebpack]", data => data.replace(re, ""), {
                    base: "",
                    targets: ["./dist/umd/index.js", "./dist/webpack/index.js"]
                }
            );
        }
    }
};

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
