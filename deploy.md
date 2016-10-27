# Overview

At the end of each milestone, we will start a new release process that consists of following tasks.

- Creating the `release` branch. A new git branch `release-X.Y.Z` (e.g. release-1.1.0) is created off the `master` to encapsulate the release preparations, for instance, building release candidates, QA check-ups, and documentation updates etc.

  Once we create this branch and push it to the central repository, the release enters the code-freeze stage, any functionality that isn't already in there is postponed until the next release cycle.

- Building release candidate. As soon as the `release-X.Y.Z` branch lands in the central repo, the CI automatically builds the add-on and ships it to the `pre-release` channel, which is supposed to be used by all the stakeholders (QA/PM/Engineers) during the release.

  Important: you need to update the branch name in the `deploy` section in [travis.yml](.travis.yml) to let CI build the release candiate every once you push a new commit to the `release-X.Y.Z` branch.

  As a side note, there are three channels for Activity Stream.
  * [dev](https://s3.amazonaws.com/moz-activity-streams-dev/dist/latest.html)
  * [pre-release](https://s3.amazonaws.com/moz-activity-streams-prerelease/dist/latest.html)
  * [release](https://moz-activity-streams.s3.amazonaws.com/dist/latest.html)

- Release signing-off. Upon the first build of release candidate, the release engineer sends out the release preview email to all the stakeholders. In addition, she/he makes a release pull request on GitHub to track the status through an attached checklist. The release deploy won't be initiated unless all the items get checked by the stakeholders.

  Over the course of this stage, QA tests the pre-release build and files bugs with the label "release/block". Meanwhile, PM and UI/UX verifies the add-on and gives feedback. Engineers, in turn, respond to those inputs and make bugfixes or changes accordingly.

- Release deploy. The release engineer ensures all requirements are met on the checklist, then proceeds to deploy the release as described below in detail.

Note that the first three tasks are mostly driven by the automated "pre-release" channel, people from different release party could cooperate directly on GitHub or via IRC/Slack.

Let's now focus on the final task - release deploy. Again, we break it down into three stages as pre-deploy, deploy, and post-deploy respectiviely.

# Pre-deploy

In this stage, we prep everything for the release in the git repo.

## Update code and packages

- ensure you have the latest version of the code

  ```
  git checkout release-X.Y.Z
  git pull upstream release-X.Y.Z
  ```

- update/install any packages

  ```
  npm install
  ```

## Update CHANGELOG and version numbers
- set a new version of the add-on by running npm version

  ```
  npm version patch
  ```

- update the changelog

  ```
  npm run changelog -- -r 0
  git add CHANGELOG.md
  git commit -m 'X.Y.Z changelog' # where X, Y, and Z are the major, minor, and patch version you just upgraded to
  ```

## Update repository
- merge the latest changelog to master
  ```
  # merge changes to master
  git checkout master
  git merge release-X.Y.Z
  git push upstream master

  # push the release branch to remote
  git push upstream release-X.Y.Z
  git push upstream --tags
  ```

  Note that you might want to cherry-pick commits from the release branch if there exists some commits that are not supposed to be merged to master, for instance, the bugfixes for the deprecated features in the master branch.
  ```
  git checkout master
  git cherry-pick some_commit_hash # like the commit for CHANGELOG.md
  git push upstream master
  ```

# Deploy

We use `fabric` in a Python virtual environment to do the job,

- create / instantiate virtual env. Note the path name, it is important so that the python virtual env doesn't get included in the add-on

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

  You will deploy within the `release-X.Y.Z` branch,

  ```
  git checkout release-X.Y.Z
  ```

  Important: ensure there are no extra files in the directory. Any file that is not in .jpmignore will be included in the add-on. Make extra sure that the `.amo_config.json` is named properly, otherwise it might be included in the add-on XPI.

  You can make extra sure there are no extra files by running:
  ```
  npm run bundle  # building static assets
  ./node_modules/.bin/jpm xpi # create add-on package
  unzip -t @activity-streams-1.X.Y.xpi | less # check for unexpected files
  rm \@activity-streams-*.xpi # remove the add-on. don't forget!
  ```

  To deploy, you need both the AWS creds and the AMO creds. If you have them, simply run:

  ```
  fab deploy
  ```

- inform Test Pilot

  Lastly, you send the add-on to Test Pilot, which takes care of everything needed to serve Activity Stream for the add-on users. See [#1509](https://github.com/mozilla/activity-stream/issues/1509) for more details. Currently, you have to send it via email to the T-P maintainers, however, there is a plan of automating the add-on update process on their end.

# Post-deploy

- hotfixes

  We may find futher issues after the release is out. You can create hotfixes as follows,

  ```
  # create a hotfix branch off the current release branch
  git checkout -b hotfix-fix-issue release-X.Y.Z
  # fix the bug and submit a PR for it

  # merge to release branch (you could also merge it via GitHub)
  git checkout release-X.Y.Z
  git merge hotfix-fix-issue
  git push upstream release-X.Y.Z

  # merge to master branch as well
  git checkout master
  git merge hotfix-fix-issue
  git push upstream master

  # delete the hotfix branch once it's merged
  git branch -d hotfix-fix-issue

  # deploy the new release
  ```
