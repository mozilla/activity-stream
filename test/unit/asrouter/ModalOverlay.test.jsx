import {ModalOverlayWrapper} from "content-src/asrouter/components/ModalOverlay/ModalOverlay";
import {mount} from "enzyme";
import React from "react";

describe("ModalOverlayWrapper", () => {
  let fakeDoc;
  let sandbox;
  beforeEach(() => {
    sandbox = sinon.createSandbox();
    fakeDoc = {addEventListener: sandbox.stub(), removeEventListener: sandbox.stub()};
  });
  afterEach(() => {
    sandbox.restore();
  });
  it("should do stuff", async () => {
    sandbox.stub(global, "addEventListener");
    const wrapper = mount(<ModalOverlayWrapper active={true} document={fakeDoc} />);
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.calledOnce(fakeDoc.addEventListener);
  });
});
