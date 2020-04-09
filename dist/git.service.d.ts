export declare class GitService {
    private repoDir;
    private git;
    constructor(repoDir: string);
    clone(repoUrl: string, depth?: string): Promise<void>;
    init(remoteUrl: string, authorName: string, authorEmail: string): Promise<void>;
    hasChanges(): Promise<boolean>;
    remoteBranchExists(branch: string): Promise<boolean>;
    checkoutBranch(branch: string): Promise<void>;
    cleanCheckoutBranch(branch: string, baseBranch: string, remoteExists: boolean): Promise<void>;
    raw(commands: string | string[]): Promise<string>;
    shortenSha1(sha1: string): Promise<string>;
    commit(message: string): Promise<void>;
    push(branch: string, force?: boolean): Promise<void>;
}
//# sourceMappingURL=git.service.d.ts.map