import * as core from '@actions/core';
import type { getOctokit } from '@actions/github';
import { Context } from '@actions/github/lib/context';

export class GithubService {
  private owner: string;
  private repo: string;
  private repoPath: string;
  constructor(private gbClient: ReturnType<typeof getOctokit>, private context: Context) {
    this.repoPath = `${context.repo.owner}/${context.repo.repo}`;
    this.owner = context.repo.owner;
    this.repo = context.repo.repo;
  }

  public shouldIgnoreEvent(baseBranch: string): boolean {
    if (this.context.eventName === 'push') {
      if (this.context.ref !== `refs/heads/${baseBranch}`) {
        core.info(`🤖 Ignoring events not originating from base branch '${baseBranch}' (was '${this.context.ref}').`);
        return true;
      }
      // Ignore push events on deleted branches
      // The event we want to ignore occurs when a PR is created but the repository owner decides
      // not to commit the changes. They close the PR and delete the branch. This creates a
      // "push" event that we want to ignore, otherwise it will create another branch and PR on
      // the same commit.
      const deleted = this.context.payload.deleted;
      if (deleted === 'true') {
        core.info('🤖 Ignoring delete branch event.');
        return true;
      }
    }

    return false;
  }

  public async getOpenPR(base: string, head: string): Promise<number | null> {
    const res = await this.gbClient.rest.pulls.list({
      owner: this.owner,
      repo: this.repo,
      state: 'open',
      base,
    });

    return res.data.filter(pr => pr.head.ref === head)[0]?.number;
  }

  public async getClosedPRsBranches(base: string, title: string, branchPrefix: string): Promise<string[]> {
    const res = await this.gbClient.rest.pulls.list({
      owner: this.owner,
      repo: this.repo,
      state: 'closed',
      base,
    });

    return res.data
      .filter(pr => !pr.locked)
      .filter(pr => pr.head.ref.indexOf(branchPrefix) >= 0 || pr.title === title)
      .map(pr => pr.head.ref);
  }

  public async deleteClosedPRsBranches(base: string, title: string, branchPrefix: string, ignore: string): Promise<void> {
    const branches = await this.getClosedPRsBranches(base, title, branchPrefix);
    for (const branch of branches) {
      if (branch === ignore) continue;

      try {
        const res = await this.gbClient.rest.git.deleteRef({
          owner: this.owner,
          repo: this.repo,
          ref: `heads/${branch}`,
        });
        if (res.status === 204)
          core.info(`🤖 >> Branch '${branch}' has been deleted`);
        else if (res.status !== 422) // 422 = branch already gone
          core.warning(`🤖 >> Branch '${branch}' could not be deleted. Status was: ${res.status}`);
      } catch (ex: unknown) {
        core.warning(`🤖 >> Branch '${branch}' could not be deleted. Error was: ${(ex as Error).message}`);
      }
    }
  }

  public async createPR(base: string, head: string, title: string, body: string, assignees: string[], reviewers: string[], labels: string[]): Promise<number | null> {
    try {
      const createdPR = await this.gbClient.rest.pulls.create({
        owner: this.owner,
        repo: this.repo,
        head,
        base,
        maintainer_can_modify: false,
        title,
        body,
      });

      const prNumber = createdPR.data.number;

      core.info(`🤖 Created pull request [${this.repoPath}]#${prNumber}`);

      await this.gbClient.rest.issues.update({
        owner: this.owner,
        repo: this.repo,
        issue_number: prNumber,
        assignees,
        labels,
        body,
      });

      await this.addReviewers(prNumber, reviewers);

      core.info(`🤖 Updated pull request [${this.repoPath}]#${prNumber}`);

      return prNumber;
    } catch (ex: any) {
      core.error(`🤖  Create PR on [${this.repoPath}] from ${head} failed`);
      core.setFailed(ex);
      return null;
    }
  }

  private async addReviewers(prNumber: number, reviewers: string[]) {
    if (!prNumber || !reviewers || reviewers.length === 0) return null;
    return this.gbClient.rest.pulls.requestReviewers({
      owner: this.owner,
      repo: this.repo,
      pull_number: prNumber,
      reviewers,
    });
  }
}
