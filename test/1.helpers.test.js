const Helpers = require('../dist/helpers').Helpers;
const chai = require('chai');

const expect = chai.expect;

describe('Helpers Tests', () => {
  it('isFileExists: should return "true" if file does exit on fs', async () => {
    expect(await Helpers.isFileExists('package.json')).to.equal(true);
  });

  it('isFileExists: should return "false" if file does not exist on fs', async () => {
    expect(await Helpers.isFileExists('missing.json')).to.equal(false);
  });

  it('isFolderExist: should return "false" if folder is not empty', () => {
    expect(Helpers.isFolderEmpty('src')).to.equal(false);
  });

  it('isFolderExist: should throw error if file is not a folder', () => {
    const test = () => { try { Helpers.isFolderEmpty('package.json'); return true; } catch (ex) { null; } return false; };
    expect(test()).to.equal(false);
  });

  it('toList: should return empty array on empty value string', () => {
    expect(Helpers.toList("")).to.eql([]);
  });

  it('toList: should return empty array on undefined value string', () => {
    expect(Helpers.toList()).to.eql([]);
  });

  it('toList: should return a non empty array on value string separated with comma', () => {
    expect(Helpers.toList('ng,update, automated-pr,  bot')).to.eql(['ng', 'update', 'automated-pr', 'bot']);
  });

  it('getLocalNgExecPath: should return path to local "ng" executable', () => {
    expect(Helpers.getLocalNgExecPath('/path/to').replace(/\\/g, '/')).to.eql('/path/to/node_modules/@angular/cli/bin/ng');
  });

  it('computeSha1: should return SHA1 of given object', () => {
    const obj = {
      "packages": [
        {
          "name": "@angular/cli",
          "oldVersion": "8.3.8",
          "newVersion": "8.3.9"
        },
        {
          "name": "@angular/core",
          "oldVersion": "8.1.3",
          "newVersion": "8.2.10"
        },
        {
          "name": "rxjs",
          "oldVersion": "6.4.0",
          "newVersion": "6.5.3"
        }
      ],
      "ngUpdateOutput": "Using package manager: 'npm'\nCollecting installed dependencies...\nFound 30 dependencies.\n    We analyzed your package.json, there are some packages to update:\n    \n      Name                               Version                  Command to update\n     --------------------------------------------------------------------------------\n      @angular/cli                       8.3.8 -> 8.3.9           ng update @angular/cli\n      @angular/core                      8.1.3 -> 8.2.10          ng update @angular/core\n      rxjs                               6.4.0 -> 6.5.3           ng update rxjs\n",
      "ngUpdateErrorOutput": ""
    };

    expect(Helpers.computeSha1(obj)).to.equal('603ff3c3931dbb11cd3ce63ec0426040dd2aa0cd');
  });
});