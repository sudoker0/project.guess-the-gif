"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_watch_1 = __importDefault(require("node-watch"));
const pug_1 = require("pug");
const promises_1 = require("fs/promises");
const fs_1 = require("fs");
const node_dir_1 = __importDefault(require("node-dir"));
const path_1 = __importDefault(require("path"));
const argparse_1 = require("argparse");
const PUG_FILE = /(?<!^\_.*)\.pug$/;
var IGNORED_DIR = /.*/g;
const argparse = new argparse_1.ArgumentParser({
    description: "a pug compiler that compile pug to html",
});
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
async function render(path) {
    const p = path_1.default.parse(path);
    if (IGNORED_DIR.test(path))
        return false;
    if (!PUG_FILE.test(p.base))
        return false;
    try {
        const content = (0, pug_1.renderFile)(path, {
            doctype: "html",
            pretty: false,
            self: true,
            string: {}
        });
        await (0, promises_1.writeFile)(`${p.dir}${p.dir == "" ? "" : path_1.default.sep}${p.base.replace(PUG_FILE, ".html")}`, content, { encoding: "utf-8", });
        console.log("Compiled: " + path);
    }
    catch (e) {
        console.error("Error: An error has occurred which make the process of rendering Pug file into HTML file unable to finish. Detail of the error will be attached below:\n\n", "----------ERROR_LOG_BEGIN----------\n", `AFFECTED_FILE: ${path}\n`, e, "----------ERROR_LOG_END----------\n");
    }
}
(async () => {
    argparse.add_argument("-p", "--path", {
        type: String,
        nargs: "*",
        default: ["."],
        help: "a list of directories to compile all pug file inside or a list of pug files seperated by spaces (like: -p '1.pug' '2.pug' 'stuff/') (default: the current directory of the script) (this will use the current dir of the script as the root for path, so if you use: -p 'b/a.pug' and the location of the script (relative to: '/home/admin/project') than the path will be: '/home/admin/project/b/a.pug')"
    });
    argparse.add_argument("-w", "--watch", {
        action: "store_true",
        help: "watch and compile pug file if file changed",
    });
    argparse.add_argument("-i", "--ignore", {
        type: String,
        nargs: 1,
        default: ["((\\/|\\\\)node_modules(\\/|\\\\))|((\\/|\\\\)\\.git(\\/|\\\\))"],
        help: "regex expression to make sure any path that match the regex will be ignored (default: node_modules and .git directory) (to escape character, please use 2 back slashes)"
    });
    const args = argparse.parse_args();
    var good_path = [];
    console.log(args);
    IGNORED_DIR = new RegExp(escapeRegExp(args["ignore"][0]), "g");
    console.log("Compiling...");
    for (const i of args["path"]) {
        const path = path_1.default.resolve(__dirname + "/" + i);
        if (!(0, fs_1.existsSync)(path))
            continue;
        const ft = (await (0, promises_1.lstat)(path));
        if (ft.isDirectory()) {
            good_path.push(path);
            var queue = await node_dir_1.default.promiseFiles(path);
            for (const f of queue) {
                await render(f);
            }
        }
        else if (ft.isFile()) {
            good_path.push(path);
            await render(path);
        }
        else {
            console.log(`Error: File/directory: ${path} does not exist, is not valid or is inaccessible`);
        }
    }
    if (args["watch"]) {
        console.log("Now watching for changes");
        for (const i of good_path) {
            (0, node_watch_1.default)(i + "/.", {
                recursive: true,
                filter(f, skip) {
                    if (IGNORED_DIR.test(f))
                        return skip;
                    return true;
                },
            }, async (_ev, path) => {
                await render(path);
            });
        }
    }
})();
//# sourceMappingURL=compilePug.js.map