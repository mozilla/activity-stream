import {_DSLinkMenu as DSLinkMenu} from "content-src/components/DiscoveryStreamComponents/DSLinkMenu/DSLinkMenu";
import {LinkMenu} from "content-src/components/LinkMenu/LinkMenu";
import React from "react";
import {shallowWithIntl} from "test/unit/utils";

describe("<DSLinkMenu>", () => {
  const ValidDSLinkMenuProps = {
    site: {},
  };
  let wrapper;

  beforeEach(() => {
    wrapper = shallowWithIntl(<DSLinkMenu {...ValidDSLinkMenuProps} />);
  });

  it("should render a context menu button", () => {
    assert.ok(wrapper.exists());
    assert.ok(wrapper.find(".context-menu-button").exists());
  });

  it("should render LinkMenu when context menu button is clicked", () => {
    let button = wrapper.find(".context-menu-button");
    button.simulate("click", {preventDefault: () => {}});
    assert.equal(wrapper.find(LinkMenu).length, 1);
  });

  it("should pass dispatch, onUpdate, onShow, site, options, shouldSendImpressionStats, source and index to LinkMenu", () => {
    wrapper.find(".context-menu-button").simulate("click", {preventDefault: () => {}});
    const linkMenuProps = wrapper.find(LinkMenu).props();
    ["dispatch", "onUpdate", "onShow", "site", "index", "options", "source", "shouldSendImpressionStats"].forEach(prop => assert.property(linkMenuProps, prop));
  });

  it("should remove .active and .last-item classes from the parent component", () => {
    const instance = wrapper.instance();
    const remove = sinon.stub();
    instance.contextMenuButtonRef = {current: {parentElement: {parentElement: {classList: {remove}}}}};
    instance.onMenuUpdate();
    assert.calledOnce(remove);
  });

  it("should add .active and .last-item classes to the parent component", () => {
    const instance = wrapper.instance();
    const add = sinon.stub();
    instance.contextMenuButtonRef = {current: {parentElement: {parentElement: {classList: {add}}}}};
    instance.onMenuShow();
    assert.calledOnce(add);
  });
});
