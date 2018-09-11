import {ASRouterTargeting, CachedTargetingGetter} from "lib/ASRouterTargeting.jsm";

// Note that tests for the ASRouterTargeting environment can be found in
// test/functional/mochitest/browser_asrouter_targeting.js

describe("ASRouterTargeting#isInExperimentCohort", () => {
  let sandbox;
  beforeEach(() => {
    sandbox = sinon.sandbox.create();
  });
  afterEach(() => sandbox.restore());
  it("should return the correct if the onboardingCohort pref value", () => {
    sandbox.stub(global.Services.prefs, "getStringPref").returns(JSON.stringify([{id: "onboarding", cohort: 1}]));
    const result = ASRouterTargeting.Environment.isInExperimentCohort;
    assert.equal(result, 1);
  });
  it("should return 0 if it cannot find the pref", () => {
    sandbox.stub(global.Services.prefs, "getStringPref").returns("");
    const result = ASRouterTargeting.Environment.isInExperimentCohort;
    assert.equal(result, 0);
  });
  it("should return 0 if it fails to parse the pref", () => {
    sandbox.stub(global.Services.prefs, "getStringPref").returns(17);
    const result = ASRouterTargeting.Environment.isInExperimentCohort;
    assert.equal(result, 0);
  });
});

describe("#CachedTargetingGetter", () => {
  const sixHours = 6 * 60 * 60 * 1000;
  let sandbox;
  let clock;
  let frecentStub;
  let topsitesCache;
  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    clock = sinon.useFakeTimers();
    frecentStub = sandbox.stub(global.NewTabUtils.activityStreamProvider, "getTopFrecentSites");
    sandbox.stub(global.Cu, "reportError");
    topsitesCache = new CachedTargetingGetter("getTopFrecentSites");
  });

  afterEach(() => {
    sandbox.restore();
    clock.restore();
  });

  it("should only make a request every 6 hours", async () => {
    frecentStub.resolves();
    clock.tick(sixHours);

    await topsitesCache.getTopFrecentSites; // eslint-disable-line no-unused-expressions
    await topsitesCache.getTopFrecentSites; // eslint-disable-line no-unused-expressions

    assert.calledOnce(global.NewTabUtils.activityStreamProvider.getTopFrecentSites);

    clock.tick(sixHours);

    await topsitesCache.getTopFrecentSites; // eslint-disable-line no-unused-expressions

    assert.calledTwice(global.NewTabUtils.activityStreamProvider.getTopFrecentSites);
  });
  it("should report errors", async () => {
    frecentStub.rejects(new Error("fake error"));
    clock.tick(sixHours);

    // assert.throws expect a function as the first parameter, try/catch is a
    // workaround
    try {
      await topsitesCache.getTopFrecentSites; // eslint-disable-line no-unused-expressions
      assert.isTrue(false);
    } catch (e) {
      assert.calledOnce(global.Cu.reportError);
    }
  });
});
