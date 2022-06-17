Object.defineProperty(exports, "__esModule", { value: true });
exports.NgUpdateService = exports.PackageToUpdate = void 0;
const exec = require("@actions/exec");
const core = require("@actions/core");
const helpers_1 = require("./helpers");
class PackageToUpdate {
    constructor(name, oldVersion, newVersion) {
        this.name = name;
        this.oldVersion = oldVersion;
        this.newVersion = newVersion;
    }
}
exports.PackageToUpdate = PackageToUpdate;
class NgUpdateService {
    constructor(projectPath) {
        this.projectPath = projectPath;
    }
    async runUpdate() {
        let ngUpdateOutput = '';
        let ngUpdateErrorOutput = '';
        const ngUpdateOptions = {
            listeners: {
                stdout: (data) => ngUpdateOutput += data.toString(),
                stderr: (data) => ngUpdateErrorOutput = data.toString()
            },
            cwd: this.projectPath
        };
        const npmRegistry = core.getInput('npm-registry');
        const ngUpdateArgs = npmRegistry ? [`registry=${npmRegistry}`] : [];
        core.debug(`🤖 Ensuring NPM modules are installed under '${this.projectPath}'...`);
        await helpers_1.Helpers.ensureNodeModules(this.projectPath, process.env.FORCE_INSTALL_NODE_MODULES === 'true');
        core.debug(`🤖 Running initial 'ng update${ngUpdateArgs}'...`);
        const ngExec = helpers_1.Helpers.getLocalNgExecPath(this.projectPath);
        await exec.exec(`"${ngExec}"`, ['update', ...ngUpdateArgs], ngUpdateOptions);
        if (ngUpdateOutput.indexOf(NgUpdateService.NO_UPDATE_FOUND) > 0) {
            core.info('🤖 Congratulations 👏, you are already using the latest version of Angular!');
            return { packages: [], ngUpdateOutput, ngUpdateErrorOutput };
        }
        else if (ngUpdateOutput.indexOf(NgUpdateService.UPDATE_FOUND) > 0) {
            const ngUpdateRegEx = /\s+([@/a-zA-Z0-9]+)\s+(\d+\.\d+\.\d+)\s+->\s+(\d+\.\d+\.\d+)\s+ng update/gm;
            const pkgsToUpdate = [];
            for (let match; (match = ngUpdateRegEx.exec(ngUpdateOutput));) {
                pkgsToUpdate.push(new PackageToUpdate(match[1], match[2], match[3]));
            }
            if (pkgsToUpdate.length) {
                core.info(`🤖 Updating outdated ng dependencies: ${pkgsToUpdate.map(p => `'${p.name}'`)}`);
                const ngUpdatePkgsArgs = [...ngUpdateArgs, '--allow-dirty', ...(pkgsToUpdate.map(p => p.name))];
                const ngUpdatePkgsOptions = {
                    cwd: this.projectPath
                };
                await exec.exec(`"${ngExec}"`, ['update', ...ngUpdatePkgsArgs], ngUpdatePkgsOptions);
            }
            return { packages: pkgsToUpdate, ngUpdateOutput, ngUpdateErrorOutput };
        }
        if (ngUpdateErrorOutput.length) {
            core.warning('🤖 It looks like the "ng update" command failed.');
            core.warning(ngUpdateErrorOutput);
        }
        return { packages: [], ngUpdateOutput, ngUpdateErrorOutput };
    }
}
exports.NgUpdateService = NgUpdateService;
NgUpdateService.NO_UPDATE_FOUND = 'We analyzed your package.json and everything seems to be in order. Good work!';
NgUpdateService.UPDATE_FOUND = 'We analyzed your package.json, there are some packages to update:';
//# sourceMappingURL=ngupdate.service.js.map