# Localization

## When should you localize strings?

Any time you add human-readable text to the add-on, whether it is plain text, labels, or text only available to screen-readers, you should localize those strings.

## How to localize strings

First, add the new string to `locales/en-US/strings.properties`. You do NOT need to add strings to other language files.

Note that you must **re-build the add-on** every time you add new strings (the actual build task that processes the strings.properties file is `bundle:locales`, so you need to re-run `npm start`).

On the React side, You have two options for implementing the strings:

1 ) If your string would normally be a text node, you should use the `<FormattedMessage />` component from `react-intl`. Set the `id` property to the `id` of your string. Example:

```js
const {FormattedMessage} = require("react-intl");

const MyComponent = props => (<div>
  <FormattedMessage id="hello_world" />
</div>)
```

2 ) If you your text is somewhere else, such as an attribute, you must use [the injection api](https://github.com/yahoo/react-intl/wiki/API#injection-api). Example:

```js
const {injectIntl} = require("react-intl");

const MyComponent = props => (<div>
  <img alt={props.intl.formatMesssage("hello_world")} />
</div>);

module.exports = injectIntl(MyComponent);
```

## Building the add-on with a different set of languages

By default, running `npm run package`, it will build the add-on with *all* locales. This might be useful if you want to QA several locales with a single build.

If you would like to build the add-on with a specific set of locales, you can add a `SUPPORTED_LOCALES` variable to your environment. For example:

```
SUPPORTED_LOCALES=en-US,de npm run package
```

will run a build of the add-on with German and English.
