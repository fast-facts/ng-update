Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const exec = tslib_1.__importStar(require("@actions/exec"));
const path = tslib_1.__importStar(require("path"));
const fs = tslib_1.__importStar(require("fs"));
// tslint:disable-next-line: no-var-requires
const hash = require('object-hash');
const io_util_1 = require("@actions/io/lib/io-util");
class Helpers {
    static timeout(millis) {
        return new Promise((resolve) => setTimeout(resolve, millis));
    }
    static async isFileExists(filePath) {
        return io_util_1.exists(filePath);
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
            const hasNodeModules = await io_util_1.exists(nodeModulesPath);
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
        return path.normalize(path.join(baseDir, 'node_modules', '@angular', 'cli', 'bin', 'ng'));
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