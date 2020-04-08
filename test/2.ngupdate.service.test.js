const fs = require('fs');
const path = require('path');
const exec = require('@actions/exec');
const NgUpdateService = require('../dist/ngupdate.service').NgUpdateService;
const chai = require('chai');

const expect = chai.expect;

describe('NgUpdateService Tests', () => {
  const demoFolder = path.resolve('demo');

  before(async () => {
    fs.mkdirSync(demoFolder);
    const options = { cwd: demoFolder, silent: true };
    await exec.exec('git', ['init'], options);
    await exec.exec('npm', ['init', '-f'], options);
    await exec.exec('npm', ['install', '--save', '@angular/cli@9.0.0'], options);

    console.log(`Created new folder with git, npm and @angular/cli@9.0.0 initialized: '${demoFolder}'`);
  });

  after(() => { fs.unlinkSync(demoFolder); });

  it('runUpdate: should return packages to update if project is outdated', async () => {
    const ngUpdateService = new NgUpdateService(demoFolder);
    const result = await ngUpdateService.runUpdate();

    expect(result.packages.map(p => p.name)).to.eql(['@angular/cli']);
    expect(result.ngUpdateOutput).toContain(NgUpdateService.UPDATE_FOUND);
    expect(result.ngUpdateErrorOutput).toBeFalsy();
  });

  it('runUpdate: should return no packages to update if project is up-to-date', async () => {
    const ngUpdateService = new NgUpdateService(demoFolder);
    const result = await ngUpdateService.runUpdate();

    expect(result.packages.map(p => p.name)).to.eql([]);
    expect(result.ngUpdateOutput).toContain(NgUpdateService.NO_UPDATE_FOUND);
    expect(result.ngUpdateErrorOutput).toBeFalsy();
  });

});
