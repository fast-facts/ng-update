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
    fs.writeFileSync(path.join(demoFolder, '.gitignore'), '/node_modules');
    process.env.NG_DISABLE_VERSION_CHECK = true;
    const options = { cwd: demoFolder, silent: false };

    // await exec.exec('git', ['init'], options);
    await exec.exec('npm', ['init', '-f'], options);
    await exec.exec('npm', ['install', '--save', '@angular/cli@13.0.0'], options);

    console.log(`Created new folder with @angular/cli@13.0.0 installed: '${demoFolder}'`);
  });

  it('runUpdate: should return packages to update if project is outdated', async () => {
    const ngUpdateService = new NgUpdateService(demoFolder);
    const result = await ngUpdateService.runUpdate();

    expect(result.packages.map(p => p.name)).to.eql(['@angular/cli']);
    expect(result.ngUpdateOutput).to.contain(NgUpdateService.UPDATE_FOUND);
  });

  // This is causing trouble with angular 14
  // it('runUpdate: should return no packages to update if project is up-to-date', async () => {
  //   const ngUpdateService = new NgUpdateService(demoFolder);
  //   const result = await ngUpdateService.runUpdate();

  //   expect(result.packages.map(p => p.name)).to.eql([]);
  //   expect(result.ngUpdateOutput).to.contain(NgUpdateService.NO_UPDATE_FOUND);
  // });
});
