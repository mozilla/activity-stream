# coding=utf8

# Any copyright is dedicated to the Public Domain.
# http://creativecommons.org/publicdomain/zero/1.0/

from __future__ import absolute_import
import fluent.syntax.ast as FTL
from fluent.migrate.helpers import transforms_from
from fluent.migrate.helpers import TERM_REFERENCE
from fluent.migrate import COPY, REPLACE, CONCAT

TARGET_FILE = 'browser/browser/newtab/onboarding.ftl'
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
PYTHONPATH=./bin migrate-l10n bug_1556895_newtab --lang en-US --reference-dir . \
  --localization-dir ../gecko-strings
diff -B -w locales-src/onboarding.ftl ../gecko-strings/browser/browser/newtab/onboarding.ftl
```
NB: migrate-l10n will make local commits to gecko-strings

The diff should result in no differences if the migration recipe matches the
fluent file.
"""
SOURCE_FILE = 'locales-src/onboarding.ftl'


def migrate(ctx):
    """Bug 1556895 - Migrate newtab.properties to onboarding.ftl, part {index}"""

    ctx.add_transforms(
        TARGET_FILE,
        SOURCE_FILE,
        transforms_from("""

onboarding-control-form-privacy-notice = { COPY(from_path, "firstrun_privacy_notice") }
onboarding-control-welcome-content = { COPY(from_path, "firstrun_content") }
onboarding-control-form-invalid-input = { COPY(from_path, "firstrun_invalid_input") }
onboarding-control-form-header = { COPY(from_path, "firstrun_form_header") }
onboarding-control-form-input =
    .placeholder = { COPY(from_path, "firstrun_email_input_placeholder") }
onboarding-control-form-continue-button = { COPY(from_path, "firstrun_continue_to_login") }
onboarding-control-form-skip-login-button = { COPY(from_path, "firstrun_skip_login") }

        """, from_path='browser/chrome/browser/activity-stream/newtab.properties')
    )

    ctx.add_transforms(
        TARGET_FILE,
        SOURCE_FILE,
        [
            FTL.Message(
                id=FTL.Identifier("onboarding-control-welcome-header"),
                value=REPLACE(
                    "browser/chrome/browser/activity-stream/newtab.properties",
                    "firstrun_title",
                    {
                        "Firefox": TERM_REFERENCE("brand-product-name")
                    },
                )
            ),
            FTL.Message(
                id=FTL.Identifier("onboarding-control-welcome-learn-more-link"),
                value=REPLACE(
                    "browser/chrome/browser/activity-stream/newtab.properties",
                    "firstrun_learn_more_link",
                    {
                        "Firefox": TERM_REFERENCE("brand-product-name")
                    },
                )
            ),
            FTL.Message(
                id=FTL.Identifier("onboarding-control-legal-notice"),
                value=REPLACE(
                    "browser/chrome/browser/activity-stream/newtab.properties",
                    "firstrun_extra_legal_links",
                    {
                        "{terms}": CONCAT(
                            FTL.TextElement('<a data-l10n-name="terms">'),
                            COPY(
                                "browser/chrome/browser/activity-stream/newtab.properties",
                                "firstrun_terms_of_service"
                            ),
                            FTL.TextElement("</a>")
                        ),
                        "{privacy}": CONCAT(
                            FTL.TextElement('<a data-l10n-name="privacy">'),
                            COPY(
                                "browser/chrome/browser/activity-stream/newtab.properties",
                                "firstrun_privacy_notice"
                            ),
                            FTL.TextElement("</a>")
                        )
                    },
                )
            ),
            FTL.Message(
                id=FTL.Identifier("onboarding-control-form-sub-header"),
                value=REPLACE(
                    "browser/chrome/browser/activity-stream/newtab.properties",
                    "firstrun_form_sub_header",
                    {
                        "Firefox Sync": TERM_REFERENCE("sync-brand-name")
                    },
                )
            ),
        ]
    )
