## Activity Stream Router message format

Field name | Type     | Required | Description | Example / Note
---        | ---      | ---      | ---         | ---
`id`       | `string` | Yes | A unique identifier for the message that should not conflict with any other previous message | `ONBOARDING_1`
`template` | `string` | Yes | An id matching an existing Activity Stream Router template | [See example](https://github.com/mozilla/activity-stream/blob/33669c67c2269078a6d3d6d324fb48175d98f634/system-addon/content-src/message-center/templates/SimpleSnippet.jsx)
`publish_start` | `date` | No | When to start showing the message | `1524474850876`
`publish_end` | `date` | No | When to stop showing the message | `1524474850876`
`content` | `object` | Yes | An object containing all variables/props to be rendered in the template. Values should not contain HTML (supporting a subset will be addressed in 62) | [See example below](#message-example)
`campaign` | `string` | No | Campaign id that the message belongs to | `RustWebAssembly`
`targeting` | `string` `JEXL` | Yes | A [JEXL expression](http://normandy.readthedocs.io/en/latest/user/filter_expressions.html#jexl-basics) with all targeting information needed in order to decide if the message is shown | Not yet implemented, [some examples](http://normandy.readthedocs.io/en/latest/user/filter_expressions.html#examples)

### Message example
```javascript
{
  id: "ONBOARDING_1",
  template: "simple_snippet",
  content: {
    title: "Find it faster",
    body: "Access all of your favorite search engines with a click. Search the whole Web or just one website from the search box."
  }
}
```
