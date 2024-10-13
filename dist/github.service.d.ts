import type { getOctokit } from '@actions/github';
import { Context } from '@actions/github/lib/context';
export declare class GithubService {
    private gbClient;
    private context;
    private owner;
    private repo;
    private repoPath;
    constructor(gbClient: ReturnType<typeof getOctokit>, context: Context);
    shouldIgnoreEvent(baseBranch: string): boolean;
    getOpenPR(base: string, head: string): Promise<number | null>;
    getClosedPRsBranches(base: string, title: string, branchPrefix: string): Promise<string[]>;
    deleteClosedPRsBranches(base: string, title: string, branchPrefix: string, ignore: string): Promise<void>;
    createPR(base: string, head: string, title: string, body: string, assignees: string[], reviewers: string[], labels: string[]): Promise<number | null>;
    private addReviewers;
}
//# sourceMappingURL=github.service.d.ts.map