# Running an Experiment in Activity Stream

When you add a new feature or want to test the performance of a change, you may want to implement it as an experiment. You can do that using our simple experiment testing framework, which is currently set up to allow for a control value and a single variant.

## Step 1: Add an experiment definition to `experiments.json`

First, you should add a definition of your experiment. Your experiment should have a unique key name (this will identify it in the code) and contain the following fields:

```js
{
  "buttonColor": {

    // name
    // This is a human readable name, used for the display of results.
    "name": "Button Color"

    // description
    // This is a short description of the experiment, also used in the display of results.
    "description": "Tests whether the button performs better as blue or red",

    // active
    // This is an OPTIONAL field. Once the experiment is done, set active to false,
    // and it will not be included in the experiment data
    "active": true,

    // control
    // This is a definition of the control option, which should represent the state
    // of the application before the change.
    "control": {
      // This may be any value.
      "value": "rgb(249, 103, 103)",
      // This should describe what the control state represents. Used for display.
      "description": "Red button color"
    },

    // variant
    // This represents the change you want to test
    "variant": {
      // id
      // This is used for reporting purposes. Make sure it is unique!
      "id": "button_color_01",

      // This may be any value.
      "value": "rgb(45, 161, 250)",

      // This defines what percentage of users should get this change, as a decimal value < 1.
      // In this case, 20% of users would get the change.
      "threshold": 0.2,

      // This should describe what the the change does. Used for display.
      "description": "Blue button color"
    }
  }
}
```

## Step 2: Create a code path based on experiment data

If your code is on the *content* side (React), the value for your experiment will be available on the Redux store in `Experiments.values`. Here is an example of how you might use it:

```js
const {connect} = require("react-redux");

const MyFormComponent = React.createClass({
  const style =  {
    backgroundColor: this.props.Experiments.values.buttonColor
  };
  render() {
    return (<button style={style}>Press me</button>);
  }
});

// Make sure you select the Experiments state from the redux store!
module.exports = connect(function(state) {
  return {Experiments: state.Experiments};
})(MyForm);
```

If your code is on the Firefox side (everything in `/lib`), you should look for a property on the `ActivityStream` instance called `_experimentProvider`. Here is an example:

```js
// ActivityStreams.js
  ...
  myFunction() {
    // This would log either red or blue
    console.log(this._experimentProvider.data.buttonColor);
  },
  ...
```
