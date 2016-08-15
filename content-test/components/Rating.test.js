const {assert} = require("chai");
const {Rating} = require("components/Rating/Rating");
const React = require("react");
const ReactDOM = require("react-dom");
const TestUtils = require("react-addons-test-utils");

const DEFAULT_PROPS = {
  site: {"index": 0, "type": "first-run"},
  showRating: true,
  numStars: 5,
  dispatch: () => {}
};

describe("Rating", () => {
  let instance;

  function setup(customProps = {}) {
    const props = Object.assign({}, DEFAULT_PROPS, customProps);
    instance = TestUtils.renderIntoDocument(<Rating {...props} />);
  }

  beforeEach(setup);

  it("should render 5 stars", () => {
    const children = instance.refs.rating.children;
    assert.equal(children.length, 5);
  });

  it("should not render if pref is off", () => {
    const props = {showRating: false};
    setup(props);
    assert.equal(ReactDOM.findDOMNode(instance).hidden, true);
  });

  it("should only set the rating once even if we click another star", () => {
    let ratingIndex = 4;
    instance.setState({currentRating: ratingIndex});
    TestUtils.Simulate.click(instance.refs.star2);
    assert.equal(instance.state.currentRating, ratingIndex);
  });

  it("should record the active ratings", () => {
    TestUtils.Simulate.click(instance.refs.star3);
    // these are going 3, 4, 5 because the stars are IN REVERSE ORDER
    // in order for them to highlight on hover in the proper order
    assert.equal(instance.refs.star3.classList[2], "active");
    assert.equal(instance.refs.star4.classList[2], "active");
    assert.equal(instance.refs.star5.classList[2], "active");
    // other stars should not have 'active' class
    assert.equal(instance.refs.star2.classList[2], undefined);
    assert.equal(instance.refs.star1.classList[2], undefined);
  });

  describe("actions", () => {
    it("should fire a click event when clicking on a star", done => {
      let ratingIndex = 3;
      const props = {
        dispatch: action => {
          if (action.type === "NOTIFY_RATE_METADATA") {
            assert.equal(action.data.rated_index, DEFAULT_PROPS.site.index);
            assert.equal(action.data.rated_type, DEFAULT_PROPS.site.type);
            assert.equal(action.data.rating, ratingIndex);
            done();
          }
        }
      };
      setup(props);
      TestUtils.Simulate.click(instance.refs.star3);
    });
  });
});
