import * as core from '@actions/core';
import { context, getOctokit } from '@actions/github';
import * as path from 'path';
import { GithubService } from './github.service';
import { NgUpdateService } from './ngupdate.service';
import { GitService } from './git.service';
import { Helpers } from './helpers';

void (async () => {
  try {
    const repo = `${context.repo.owner}/${context.repo.repo}`;
    const repoToken = core.getInput('repo-token');
    const baseBranch = core.getInput('base-branch');
    const remoteUrl = `https://x-access-token:${repoToken}@github.com/${repo}`;
    const repoDir = process.env.GITHUB_WORKSPACE || ''; // TODO: if empty, manually checkout project
    const authorName = 'ng-update[bot]';
    const authorEmail = 'ng-update@users.noreply.github.com';
    const projectPath = path.normalize(path.join(repoDir, core.getInput('project-path')));

    const gbClient = getOctokit(repoToken);
    const ngService = new NgUpdateService(projectPath);
    const gitService = new GitService(repoDir);
    const gbService = new GithubService(gbClient, context);

    core.info('🤖 Checking if received Github event should be ignored...');
    if (gbService.shouldIgnoreEvent(baseBranch)) {
      return;
    }

    if (Helpers.isFolderEmpty(repoDir)) {
      const fetchDepth = core.getInput('fetch-depth');
      core.info(`🤖 Repo directory at: '${repoDir}' is empty. Checking out from: '${remoteUrl}'...`);
      await gitService.clone(remoteUrl, fetchDepth);
    }

    await core.group(`🤖 Initializing git config at: '${repoDir}'`, async () => {
      await gitService.init(remoteUrl, authorName, authorEmail);
    });

    await core.group(`🤖 Moving git head to base branch: ${baseBranch}`, async () => {
      await gitService.checkoutBranch(baseBranch);
    });

    const ngFilePath = path.join(projectPath, 'angular.json');
    const isNgProject = await Helpers.isFileExists(ngFilePath);
    if (!isNgProject) {
      core.error(`🤖 Could not detect an Angular CLI project under "${projectPath}", exiting`);
      return;
    }

    const prTitle = core.getInput('pr-title');
    const prBranchPrefix = core.getInput('pr-branch-prefix');

    await core.group('🤖 Prerequisites are done. Trying to \'ng update\' your code now...', async () => {
      const ngUpdateResult = await ngService.runUpdate();

      if (ngUpdateResult.packages.length > 0 && await gitService.hasChanges()) {
        const prBody = Helpers.getPrBody(core.getInput('pr-body'), ngUpdateResult.ngUpdateOutput);
        const prLabels = Helpers.getPrAssignees(core.getInput('pr-labels'));
        const prAssignees = Helpers.getPrAssignees(core.getInput('pr-assignees'));
        const prReviewers = Helpers.getPrReviewers(core.getInput('pr-reviewers'));

        const ngUpdateSha1 = await gitService.shortenSha1(Helpers.computeSha1(ngUpdateResult));
        const prBranch = `${prBranchPrefix.substring(0, prBranchPrefix.lastIndexOf('-'))}-${ngUpdateSha1}`;

        core.info(`🤖 PR branch will be: ${prBranch}`);
        const remotePrBranchExists = await gitService.remoteBranchExists(prBranch);

        await core.group(`🤖 Moving git head to pr branch: ${prBranch}`, async () => {
          await gitService.cleanCheckoutBranch(prBranch, baseBranch, remotePrBranchExists);
        });

        await core.group(`🤖 Committing changes to branch: ${prBranch}`, async () => {
          await gitService.commit(prTitle);
        });

        await core.group(`🤖 Pushing changes to pr branch: ${prBranch}`, async () => {
          await gitService.push(prBranch, remotePrBranchExists); // will updated existing pr
        });

        let prNumber = await gbService.getOpenPR(baseBranch, prBranch);

        if (prNumber) {
          core.info(`🤖 PR from branch '${prBranch}' to '${baseBranch}' already existed (#${prNumber}). It's been simply updated.`);
        } else {
          await core.group(`🤖 Creating PR from branch '${prBranch}' to '${baseBranch}'`, async () => {
            prNumber = await gbService.createPR(baseBranch, prBranch, prTitle, prBody, prAssignees, prReviewers, prLabels);
          });
        }

        if (prNumber) {
          core.setOutput('pr-number', `'${prNumber}'`);
        }
      } else {
        core.info('🤖 Running \'ng update\' has produced no change in your code, you must be up-to-date already 👏!');
      }

      core.setOutput('ng-update-result', JSON.stringify(ngUpdateResult.packages));
    });

    const deleteClosedPRBranches = core.getInput('delete-closed-pr-branches') === 'true';
    if (deleteClosedPRBranches) {
      await core.group('🤖 Deleting branches related to closed PRs created by this action...', async () => {
        await gbService.deleteClosedPRsBranches(baseBranch, prBranchPrefix, prTitle);
      });
    }
  } catch (ex: any) {
    core.setFailed(ex.message);
  }
})();