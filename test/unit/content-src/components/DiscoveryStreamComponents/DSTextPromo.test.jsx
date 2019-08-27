import { DSTextPromo } from "content-src/components/DiscoveryStreamComponents/DSTextPromo/DSTextPromo";
import React from "react";
import { shallow } from "enzyme";

describe("<DSTextPromo>", () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(
      <DSTextPromo
        data={{
          spocs: [
            {
              image_src: "image_src",
              alt_text: "alt_text",
              title: "title",
              url: "url",
              context: "context",
              cta: "cta",
            },
          ],
        }}
      />
    );
  });

  it("should render", () => {
    assert.ok(wrapper.exists());
    assert.ok(wrapper.find(".ds-text-promo").exists());
  });

  it("should not render with no content", () => {
    wrapper = shallow(<DSTextPromo />);
    assert.ok(!wrapper.find(".ds-text-promo").exists());
  });

  it("should render a header", () => {
    assert.ok(wrapper.find(".text").exists());
  });

  it("should render a subtitle", () => {
    assert.ok(wrapper.find(".subtitle").exists());
  });
});
