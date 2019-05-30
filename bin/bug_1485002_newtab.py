# coding=utf8

# Any copyright is dedicated to the Public Domain.
# http://creativecommons.org/publicdomain/zero/1.0/

from __future__ import absolute_import
# import fluent.syntax.ast as FTL
from fluent.migrate.helpers import transforms_from
# from fluent.migrate.helpers import MESSAGE_REFERENCE, TERM_REFERENCE
# from fluent.migrate import COPY, CONCAT, REPLACE

TARGET_FILE = 'browser/browser/newtab/newtab.ftl'
SOURCE_FILE = TARGET_FILE

"""
For now while we're testing, use a recipe with slightly different paths for
testing from activity-stream instead of the usual steps:
https://firefox-source-docs.mozilla.org/intl/l10n/l10n/fluent_migrations.html#how-to-test-migration-recipes


One-time setup starting from activity-stream directory:

```
cd ..
git clone hg::https://hg.mozilla.org/l10n/fluent-migration
cd fluent-migration
pip install -e .

cd ..
hg clone https://hg.mozilla.org/l10n/gecko-strings
```
NB: gecko-strings needs to be cloned with mercurial not git-cinnabar


Testing from activity-stream directory:

```
rm -f ../gecko-strings/browser/browser/newtab/newtab.ftl
PYTHONPATH=./bin migrate-l10n bug_1485002_newtab --lang en-US --reference-dir . \
  --localization-dir ../gecko-strings
diff -B locales-src/newtab.ftl ../gecko-strings/browser/browser/newtab/newtab.ftl
```
NB: migrate-l10n will make local commits to gecko-strings

The diff should result in no differences if the migration recipe matches the
fluent file.


NB: Move the following line out of this comment to test from activity-stream
SOURCE_FILE = 'locales-src/newtab.ftl'
"""


def migrate(ctx):
    """Bug 1485002 - Migrate newtab.properties to newtab.ftl, part {index}"""

    ctx.add_transforms(
        TARGET_FILE,
        SOURCE_FILE,
        transforms_from("""

newtab-page-title = { COPY(from_path, "newtab_page_title") }

        """, from_path='browser/chrome/browser/activity-stream/newtab.properties')
    )
