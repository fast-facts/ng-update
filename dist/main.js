Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const core = tslib_1.__importStar(require("@actions/core"));
const github = tslib_1.__importStar(require("@actions/github"));
const path = tslib_1.__importStar(require("path"));
const github_service_1 = require("./github.service");
const ngupdate_service_1 = require("./ngupdate.service");
const git_service_1 = require("./git.service");
const helpers_1 = require("./helpers");
async function run() {
    try {
        const context = github.context;
        const repo = `${context.repo.owner}/${context.repo.repo}`;
        const repoToken = core.getInput('repo-token');
        const baseBranch = core.getInput('base-branch');
        const remoteUrl = `https://x-access-token:${repoToken}@github.com/${repo}`;
        const repoDir = process.env.GITHUB_WORKSPACE || ''; // TODO: if empty, manually checkout project
        const authorName = 'ng-update[bot]';
        const authorEmail = `ng-update@users.noreply.github.com`;
        const projectPath = path.normalize(path.join(repoDir, core.getInput('project-path')));
        const gbClient = new github.GitHub(repoToken);
        const ngService = new ngupdate_service_1.NgUpdateService(projectPath);
        const gitService = new git_service_1.GitService(repoDir);
        const gbService = new github_service_1.GithubService(gbClient, context);
        core.info(`🤖 Checking if received Github event should be ignored...`);
        if (gbService.shouldIgnoreEvent(baseBranch)) {
            return;
        }
        if (helpers_1.Helpers.isFolderEmpty(repoDir)) {
            const fetchDepth = core.getInput('fetch-depth');
            core.info(`🤖 Repo directory at: '${repoDir}' is empty. Checking out from: '${remoteUrl}'...`);
            await gitService.clone(remoteUrl, fetchDepth);
        }
        core.debug(`🤖 Intializing git config at: '${repoDir}'`);
        await gitService.init(remoteUrl, authorName, authorEmail);
        core.debug(`🤖 Moving git head to base branch: ${baseBranch}`);
        await gitService.checkoutBranch(baseBranch);
        const ngFilePath = path.join(projectPath, 'angular.json');
        const isNgProject = await helpers_1.Helpers.isFileExists(ngFilePath);
        if (!isNgProject) {
            core.warning(`🤖 Could not detect an Angular CLI project under "${projectPath}", exiting`);
            return;
        }
        core.info(`🤖 Prerequisites are done. Trying to 'ng update' your code now...`);
        const ngUpdateResult = await ngService.runUpdate();
        const prTitle = core.getInput('pr-title');
        const prBranchPrefix = core.getInput('pr-branch-prefix');
        if (ngUpdateResult.packages.length > 0 && gitService.hasChanges()) {
            const prBody = helpers_1.Helpers.getPrBody(core.getInput('pr-body'), ngUpdateResult.ngUpdateOutput);
            const prLabels = helpers_1.Helpers.getPrAssignees(core.getInput('pr-labels'));
            const prAssignees = helpers_1.Helpers.getPrAssignees(core.getInput('pr-assignees'));
            const prReviewers = helpers_1.Helpers.getPrReviewers(core.getInput('pr-reviewers'));
            const ngUpdateSha1 = await gitService.shortenSha1(helpers_1.Helpers.computeSha1(ngUpdateResult));
            const prBranch = `${prBranchPrefix.substring(0, prBranchPrefix.lastIndexOf('-'))}-${ngUpdateSha1}`;
            core.debug(`🤖 PR branch will be : ${prBranch}`);
            const remotePrBranchExists = await gitService.remoteBranchExists(prBranch);
            core.debug(`🤖 Moving git head to pr branch: ${prBranch}`);
            await gitService.cleanCheckoutBranch(prBranch, baseBranch, remotePrBranchExists);
            core.debug(`🤖 Committing changes to branch: '${prBranch}'`);
            await gitService.commit(prTitle);
            core.debug(`🤖 Pushing changes to pr branch: '${prBranch}'`);
            await gitService.push(prBranch, remotePrBranchExists); // will updated existing pr
            core.debug(`🤖 Checking for existing open PR from '${prBranch}' to '${baseBranch}'...`);
            let prNumber = await gbService.getOpenPR(baseBranch, prBranch);
            if (prNumber) {
                core.debug(`🤖 PR from branch '${prBranch}' to '${baseBranch}' already existed (#${prNumber}). It's been simply updated.`);
            }
            else {
                core.debug(`🤖 Creating PR from branch '${prBranch}' to '${baseBranch}'`);
                prNumber = await gbService.createPR(baseBranch, prBranch, prTitle, prBody, prAssignees, prReviewers, prLabels);
            }
            if (prNumber)
                core.setOutput('pr-number', `'${prNumber}'`);
        }
        else
            core.info(`🤖 Running 'ng update' has produced no change in your code, you must be up-to-date already 👏!`);
        const deleteClosedPRBranches = core.getInput('delete-closed-pr-branches') === 'true';
        if (deleteClosedPRBranches) {
            core.info(`🤖 Deleting branches related to closed PRs created by this action...`);
            await gbService.deleteClosedPRsBranches(baseBranch, prBranchPrefix, prTitle);
        }
        core.setOutput('ng-update-result', JSON.stringify(ngUpdateResult.packages));
    }
    catch (error) {
        core.setFailed(error.message);
    }
}
// tslint:disable-next-line: no-floating-promises
run();
//# sourceMappingURL=main.js.map