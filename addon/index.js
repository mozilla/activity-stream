/* globals require, exports */
"use strict";
const self = require("sdk/self");
const shield = require("./shield-utils/index");
const {when: unload} = require("sdk/system/unload");
const {Feature} = require("./shield");
const {Cu} = require("chrome");
const feature = new Feature();

const studyConfig = {
  name: "ACTIVITY_STREAM",
  days: 14,
  surveyUrls: {
    "end-of-study": "https://qsurvey.mozilla.com/s3/Shield-Activity-Stream-2",
    "user-ended-study": "https://qsurvey.mozilla.com/s3/Shield-Activity-Stream-2?user-terminated=true",
    "ineligible": null
  },
  variations: {
    "ActivityStream": () => feature.loadActivityStream(),
    "Tiles": () => feature.loadTiles()
  }
};

class OurStudy extends shield.Study {
  isEligible() {
    return super.isEligible() && feature.isEligible();
  }
  shutdown(reason, variant) {
    super.shutdown(reason);
    feature.shutdown(reason, variant);
  }
  setVariant(variant) {
    feature.setVariant(variant);
  }
  checkTestPilot() {
    return new Promise(resolve => {
      feature.doesHaveTestPilot().then(resolve).catch(err => Cu.reportError(err));
    });
  }
}
const thisStudy = new OurStudy(studyConfig);
thisStudy.setVariant(thisStudy.variation);
thisStudy.checkTestPilot().then(() => thisStudy.startup(self.loadReason)).catch(err => Cu.reportError(err));
unload(reason => thisStudy.shutdown(reason, thisStudy.variation));
