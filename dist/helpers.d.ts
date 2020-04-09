export declare class Helpers {
    static timeout(millis: number): Promise<unknown>;
    static isFileExists(filePath: string): Promise<boolean>;
    static isFolderEmpty(folderPath: string): boolean;
    /**
     * Makes sure that the given project as a `node_modules` folder, installs it otherwise
     * @param projectPath project path
     * @param force if true, will always install node modules (via `npm ci`) no matter if one already exits
     */
    static ensureNodeModules(projectPath: string, force?: boolean): Promise<void>;
    static getLocalNgExecPath(baseDir: string): string;
    static getPrBody(body: string, ngUpdateOutput: string): string;
    static getPrLabels(labels?: string): string[];
    static getPrAssignees(assignees?: string): string[];
    static getPrReviewers(reviewers?: string): string[];
    static toList(value?: string): string[];
    static computeSha1(obj: any): string;
}
//# sourceMappingURL=helpers.d.ts.map