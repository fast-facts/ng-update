
<p align="center">
  <img height="256px" width="256px" style="text-align: center;" src="https://cdn.jsdelivr.net/gh/itzrabbs/ng-update@develop/assets/logo.svg">
</p>

# ng-update

A [Github Action](https://github.com/features/actions) that keeps your Angular CLI-based projects up-to-date via automated pull requests.

The action automatically runs `ng update` for you, updates @angular related dependencies and files, and creates/updates a PR with the changes.
You just have to merge the created PR back into your codebase, once ready.

## Usage

To get started, create a workflow under `.github/workflows/` folder (eg: `.github/workflows/ng-update.yml`), with the following content:

``` yaml
name: "Update Angular Action"
on: # when the action should run. Can also be a CRON or in response to external events. see https://git.io/JeBz1
  push

jobs:
  ngxUptodate:
    runs-on: ubuntu-latest
    steps:
      - name: Updating ng dependencies # the magic happens here !
        uses: itzrabbs/ng-update@master
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}

```

See [action.yml](action.yml) for complete list of options you can customize.
See [Creating a Workflow file](https://help.github.com/en/github/automating-your-workflow-with-github-actions/configuring-a-workflow#creating-a-workflow-file) for more informations about writing workflows.

## Outputs

When the action successfully runs, it produces the following outputs, that you can use them in further steps in your workflow:

* `pr-number`: the number of the PR that have been created on Github
*  `ng-update-result` : an array of [PackageToUpdate](src/ngupdate.service.ts#L7), that summarizes the packages that have been updated.
