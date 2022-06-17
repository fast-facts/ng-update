Object.defineProperty(exports, "__esModule", { value: true });
exports.Helpers = void 0;
const exec = require("@actions/exec");
const path = require("path");
const fs = require("fs");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const hash = require('object-hash');
const io_util_1 = require("@actions/io/lib/io-util");
class Helpers {
    static timeout(millis) {
        return new Promise((resolve) => setTimeout(resolve, millis));
    }
    static async isFileExists(filePath) {
        return (0, io_util_1.exists)(filePath);
    }
    static isFolderEmpty(folderPath) {
        return fs.readdirSync(folderPath).length === 0;
    }
    /**
     * Makes sure that the given project as a `node_modules` folder, installs it otherwise
     * @param projectPath project path
     * @param force if true, will always install node modules (via `npm ci`) no matter if one already exits
     */
    static async ensureNodeModules(projectPath, force) {
        if (!force) {
            const nodeModulesPath = path.normalize(path.join(projectPath, 'node_modules'));
            const hasNodeModules = await (0, io_util_1.exists)(nodeModulesPath);
            if (hasNodeModules)
                return;
        }
        const options = {
            cwd: projectPath
        };
        const useYarn = await Helpers.isFileExists(path.join(projectPath, 'yarn.lock'));
        await (useYarn ? exec.exec('yarn', ['install'], options) : exec.exec('npm', ['ci'], options));
    }
    static getLocalNgExecPath(baseDir) {
        return path.normalize(path.join(baseDir, 'node_modules', '.bin', 'ng'));
    }
    static getPrBody(body, ngUpdateOutput) {
        return body.replace('${ngUpdateOutput}', ngUpdateOutput);
    }
    static getPrLabels(labels) {
        return Helpers.toList(labels);
    }
    static getPrAssignees(assignees) {
        return Helpers.toList(assignees);
    }
    static getPrReviewers(reviewers) {
        return Helpers.toList(reviewers);
    }
    static toList(value) {
        return value ? value.split(/,\s*/) : [];
    }
    static computeSha1(obj) {
        return hash(obj, { algorithm: 'sha1', unorderedArrays: true });
    }
}
exports.Helpers = Helpers;
//# sourceMappingURL=helpers.js.map