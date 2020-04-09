Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const core = tslib_1.__importStar(require("@actions/core"));
class GithubService {
    constructor(gbClient, context) {
        this.gbClient = gbClient;
        this.context = context;
        this.repoPath = `${context.repo.owner}/${context.repo.repo}`;
        this.owner = context.repo.owner;
        this.repo = context.repo.repo;
    }
    shouldIgnoreEvent(baseBranch) {
        if (this.context.eventName === "push") {
            if (this.context.ref !== `refs/heads/${baseBranch}`) {
                core.debug(`🤖 Ignoring events not originating from base branch '${baseBranch}' (was '${this.context.ref}').`);
                return true;
            }
            // Ignore push events on deleted branches
            // The event we want to ignore occurs when a PR is created but the repository owner decides
            // not to commit the changes. They close the PR and delete the branch. This creates a
            // "push" event that we want to ignore, otherwise it will create another branch and PR on
            // the same commit.
            const deleted = this.context.payload.deleted;
            if (deleted === 'true') {
                core.debug('🤖 Ignoring delete branch event.');
                return true;
            }
        }
        return false;
    }
    async getOpenPR(base, head) {
        var _a;
        const res = await this.gbClient.pulls.list({
            owner: this.owner,
            repo: this.repo,
            state: 'open',
            base,
            head
        });
        return (_a = res.data[0]) === null || _a === void 0 ? void 0 : _a.number;
    }
    async getClosedPRsBranches(base, title, branchSuffix) {
        const res = await this.gbClient.pulls.list({
            owner: this.owner,
            repo: this.repo,
            state: 'closed',
            base
        });
        return res.data //
            .filter(pr => !pr.locked) //
            .filter(pr => !pr.merged_at) //
            .filter(pr => pr.head.ref.indexOf(branchSuffix) > 0 || pr.title === title) //
            .map(pr => pr.head.ref);
    }
    async deleteClosedPRsBranches(base, title, branchSuffix) {
        const branches = await this.getClosedPRsBranches(base, title, branchSuffix);
        for (const branch of Object.keys(branches)) {
            const res = await this.gbClient.git.deleteRef({
                owner: this.owner,
                repo: this.repo,
                ref: branch
            });
            if (res.status === 204)
                core.debug(`🤖 >> Branch '${branch}' has been deleted`);
            else if (res.status !== 422) // 422 = branch already gone
                core.warning(`🤖 >> Branch '${branch}' could not be deleted. Status was: ${res.status}`);
        }
    }
    async createPR(base, head, title, body, assignees, reviewers, labels) {
        try {
            const createdPR = await this.gbClient.pulls.create({
                owner: this.owner,
                repo: this.repo,
                head,
                base,
                maintainer_can_modify: false,
                title,
                body
            });
            const prNumber = createdPR.data.number;
            core.debug(`🤖 Created pull request [${this.repoPath}]#${prNumber}`);
            await this.gbClient.issues.update({
                owner: this.owner,
                repo: this.repo,
                issue_number: prNumber,
                assignees,
                labels,
                body
            });
            await this.addReviewers(prNumber, reviewers);
            core.debug(`🤖 Updated pull request [${this.repoPath}]#${prNumber}`);
            return prNumber;
        }
        catch (error) {
            core.error(`🤖  Create PR on [${this.repoPath}] from ${head} failed`);
            core.setFailed(error);
            return null;
        }
    }
    async addReviewers(prNumber, reviewers) {
        if (!prNumber || !reviewers || reviewers.length === 0)
            return null;
        return this.gbClient.pulls.createReviewRequest({
            owner: this.owner,
            repo: this.repo,
            pull_number: prNumber,
            reviewers
        });
    }
}
exports.GithubService = GithubService;
//# sourceMappingURL=github.service.js.map