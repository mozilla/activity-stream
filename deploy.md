Here are the instructions to deploy Activity Stream:

#  Have the correct credentials
# Update code and packages

- ensure you have the latest version of the code

`git pull`

- update/install any packages

`npm install`

# Update version numbers
- set a new version of the addon by running npm version

`npm version patch`

- update the changelog:

`./node_modules/.bin/conventional-changelog -i CHANGELOG.md -s -r 0`

`git add CHANGELOG.md`

`git commit -m '1.0.X changelog' # where X is the patch version you just upgraded to`

- update remote repository

`git push origin master`

`git push origin --tags`

# Deploy

- create / instantiate virtual env. Note the path name. it is important so that the python virtual env doesn't get included in the addon.

`virtualenv activity-streams-env`

`source ./activity-streams-env/bin/activate`

`pip install -r requirements.txt`

- deploy

Important: Ensure there are no extra files in the directory. Any file that is not in .jpmignore will be included in the addon.
Make extra sure the .amo_config.json is named properly, otherwise it might be included in the addon XPI

You can make extra sure there are no extra files by running:
`npm run bundle  # building static assets`

`./node_modules/.bin/jpm xpi # create addon package`

`unzip -t @activity-streams-1.0.16.xpi | less # check for unexpected files`

`rm \@activity-streams-*.xpi # remove the addon. don't forget!`

To deploy, you need both the AWS creds and the AMO creds. If you have them, simply run:

`fab deploy`
