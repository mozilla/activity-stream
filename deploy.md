# Overview

At the end of each milestone, we will start a new release process that consists of following tasks.

- creating the `release` branch. A new git branch `release` will be created off the `master` to encapsulate the release preparations, for instance, building release candidates, QA check-ups, and documentation updates etc.

  Once we create this branch and push it to the central repository, the release enters the code-freeze stage, any functionality that isn't already in there is postponed until the next release cycle.

- building release candidate. As soon as the `release` branch lands in the central repo, the CI automatically builds the addon and ships it to the `pre-release` channel, which is supposed to be used by all the stakeholders (QA/PM/Engineers) during the release.

  As a side note, there are three channels for Activity Stream.
  * [dev](https://s3.amazonaws.com/moz-activity-streams-dev/dist/latest.html)
  * [pre-release](https://s3.amazonaws.com/moz-activity-streams-prerelease/dist/latest.html)
  * [release](https://moz-activity-streams.s3.amazonaws.com/dist/latest.html)

- release signing-off. Upon the first build of release candidate, the release engineer sends out the release preview email to all the stakeholders. In addition, she/he files a release issue on Github to track the status through an attached checklist. The release deploy won't be initiated unless all the items get checked by the stakeholders.

  Over the course of this stage, QA tests the pre-release build and files bugs with the label "release/block". Meanwhile, PM and UI/UX verifies the addon and gives feedback. Engineers, in turn, respond to those inputs and make bugfixes or changes accordingly.

- release deploy. As the final stage of the release process, the release engineer ensures all requirements are met on the checklist, then proceeds to deploy the release as described below in detail.

Note that the first three tasks are mostly driven by the automated "pre-release" channel, people from different release party could cooperate directly on Github or via IRC/Slack.

Let's now focus on the final task - release deploy. Again, we break it down into three stages pre-deploy, deploy, and post-deploy respectiviely.

# Pre-deploy

In this stage, we prep everything for the release in the git repo.

## Update code and packages

- ensure you have the latest version of the code

  ```
  git checkout release
  git pull upstream release
  ```

- update/install any packages

  ```
  npm install
  ```

## Update CHANGELOG and version numbers
- set a new version of the addon by running npm version

  ```
  npm version patch
  ```

- update the changelog

  ```
  ./node_modules/.bin/conventional-changelog -i CHANGELOG.md -s -r 0
  git add CHANGELOG.md
  git commit -m '1.X.Y changelog' # where X and Y are the minor and patch version you just upgraded to
  ```

## Update repository

  ```
  # merge changes to master
  git checkout master
  git merge release
  git push upstream master

  # note that you might want to cherry-pick commits from the release branch if there exists some commits
  # that are not supposed to be merged to master, for example, bugfixes for the deprecated features in the master branch.
  git checkout master
  git cherry-pick some_commit_hash
  git push upstream master

  # push the release branch to remote
  git push upstream release
  git push upstream --tags
  ```

# Deploy

We use `fabric` in a Python virtual environment to do the job,

- create / instantiate virtual env. Note the path name, it is important so that the python virtual env doesn't get included in the addon

  If it is the __first__ time to deploy on your machine,
  ```
  virtualenv activity-streams-env
  source ./activity-streams-env/bin/activate
  pip install -r requirements.txt
  ```

  Otherwise,
  ```
  source ./activity-streams-env/bin/activate
  ```

- deploy

  We will deploy off the `release` branch,

  ```
  git checkout release
  ```

  Important: Ensure there are no extra files in the directory. Any file that is not in .jpmignore will be included in the addon. Make extra sure that the `.amo_config.json` is named properly, otherwise it might be included in the addon XPI.

  You can make extra sure there are no extra files by running:
  ```
  npm run bundle  # building static assets
  ./node_modules/.bin/jpm xpi # create addon package
  unzip -t @activity-streams-1.X.Y.xpi | less # check for unexpected files
  rm \@activity-streams-*.xpi # remove the addon. don't forget!
  ```

  To deploy, you need both the AWS creds and the AMO creds. If you have them, simply run:

  ```
  fab deploy
  ```

# Post-deploy

- hotfixes

  We may find futher issues after the release is out. You can create hotfixes off the `release` branch as follows,

  ```
  git checkout -b hotfix-fix-issue release
  # fix the bug and submit PR

  git checkout release
  git merge hotfix-fix-issue
  git push upstream release

  # push to master branch as well
  git checkout master
  git merge hotfix-fix-issue
  git push upstream master

  # delete the hotfix branch once it's merged
  git branch -d hotfix-fix-issue
  ```
