## Snippets message format

Field name | Type     | Description | Example
---        | ---      | ---         | ---
`id`       | `string` | A unique identifier for the snippet that should not conflict with any other previous snippet
`template` | `string` | An id matching an existing Activity Stream Router template | [`simple_snippet`](https://github.com/piatra/activity-stream/blob/ea5f890c9a94ddd03ffca4ccc432936a2d6795aa/system-addon/lib/MessageCenterRouter.jsm#L5-L17)
`publish_start` | `date` | When to start showing the snippet
`publish_end` | `date` | When to stop showing the snippet
`created` | `date` | When the message was created
`modified` | `date` | When the message was last modified
`content` | `object` | An object containing all variables/props to be rendered in the template. Values should not contain HTML (supporting a subset will be addressed in 62) | [`{title: “Hello”, body: “Hello world 123”}`](https://github.com/piatra/activity-stream/blob/ea5f890c9a94ddd03ffca4ccc432936a2d6795aa/system-addon/lib/MessageCenterRouter.jsm#L5-L17)
`campaign` | `string` | Campaign id that the snippet belongs to
`targeting` | `string` `JEXL` | A [JEXL expression](http://normandy.readthedocs.io/en/latest/user/filter_expressions.html#jexl-basics) with all targeting information needed in order to decide if the snippet is shown