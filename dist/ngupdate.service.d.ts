export declare class PackageToUpdate {
    name: string;
    oldVersion: string;
    newVersion: string;
    constructor(name: string, oldVersion: string, newVersion: string);
}
export interface NgUpdateResult {
    packages: PackageToUpdate[];
    ngUpdateOutput: string;
    ngUpdateErrorOutput?: string;
}
export declare class NgUpdateService {
    private projectPath;
    private nodeModulesPath;
    static readonly NO_UPDATE_FOUND = "We analyzed your package.json and everything seems to be in order. Good work!";
    static readonly UPDATE_FOUND = "We analyzed your package.json, there are some packages to update:";
    constructor(projectPath: string, nodeModulesPath: string);
    runUpdate(): Promise<NgUpdateResult>;
}
//# sourceMappingURL=ngupdate.service.d.ts.map