import {EOYSnippet} from "content-src/asrouter/templates/EOYSnippet/EOYSnippet";
import {GlobalOverrider} from "test/unit/utils";
import {mount} from "enzyme";
import React from "react";
import schema from "content-src/asrouter/templates/EOYSnippet/EOYSnippet.schema.json";

const DEFAULT_CONTENT = {
  text: "foo",
  donation_amount_first: 50,
  donation_amount_second: 25,
  donation_amount_third: 10,
  donation_amount_fourth: 5,
  donation_form_url: "https://submit.form",
  button_label: "Donate",
  currency_code: "usd",
};

describe("EOYSnippet", () => {
  let sandbox;
  let wrapper;

  /**
   * mountAndCheckProps - Mounts a EOYSnippet with DEFAULT_CONTENT extended with any props
   *                      passed in the content param and validates props against the schema.
   * @param {obj} content Object containing custom message content (e.g. {text, icon, title})
   * @returns enzyme wrapper for EOYSnippet
   */
  function mountAndCheckProps(content = {}, provider = "test-provider") {
    const props = {
      content: Object.assign({}, DEFAULT_CONTENT, content),
      provider,
      onAction: sandbox.stub(),
    };
    assert.jsonSchema(props.content, schema);
    return mount(<EOYSnippet {...props} />);
  }

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    wrapper = mountAndCheckProps();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should render 4 donation options", () => {
    assert.lengthOf(wrapper.find("input[type='radio']"), 4);
  });

  it("should set frequency value to monthly", () => {
    assert.equal(wrapper.instance().refs.form.querySelector("[name='frequency']").value, "single");

    wrapper.instance().refs.form.querySelector("#monthly-checkbox").checked = true;
    wrapper.instance().setFrequencyValue();

    assert.equal(wrapper.instance().refs.form.querySelector("[name='frequency']").value, "monthly");
  });

  it("should block after submitting the form", () => {
    const onBlockStub = sandbox.stub();
    wrapper.setProps({onBlock: onBlockStub});

    wrapper.instance().handleSubmit({preventDefault: sandbox.stub()});

    assert.calledOnce(onBlockStub);
  });

  it("should not block if do_not_autoblock is true", () => {
    const onBlockStub = sandbox.stub();
    wrapper = mountAndCheckProps({do_not_autoblock: true});
    wrapper.setProps({onBlock: onBlockStub});

    wrapper.instance().handleSubmit({preventDefault: sandbox.stub()});

    assert.notCalled(onBlockStub);
  });

  describe("locale", () => {
    let stub;
    let globals;
    beforeEach(() => {
      globals = new GlobalOverrider();
      stub = sandbox.stub().returns({format: () => {}});

      globals = new GlobalOverrider();
      globals.set({"Intl": {NumberFormat: stub}});
    });
    afterEach(() => {
      globals.restore();
    });

    it("should use content.locale for Intl", () => {
      // triggers component rendering and calls the function we're testing
      wrapper.setProps({content: {locale: "locale-foo"}});

      assert.calledOnce(stub);
      assert.calledWithExactly(stub, "locale-foo", sinon.match.object);
    });

    it("should use navigator.language as locale fallback", () => {
      wrapper.instance().renderDonations();

      assert.calledOnce(stub);
      assert.calledWithExactly(stub, navigator.language, sinon.match.object);
    });
  });
});
