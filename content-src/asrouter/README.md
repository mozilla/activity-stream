# Activity Stream Router

## Preferences `browser.newtab.activity-stream.asrouter.*`

Name | Used for | Example value
---  | ---      | ---
`whitelistHosts` | Unblock a specific host in order to preview messages for other endpoints |  `["gist.github.com", "gist.githubusercontent.com", "localhost:8000"]`
`snippetsUrl` | The main remote endpoint that serves all snippet messages | `https://activity-stream-icons.services.mozilla.com/v1/messages.json.br`

## Admin Interface

* Navigate to `about:newtab#asrouter`
  * See all available messages and message providers
  * Block, unblock or force show a specific message

## Snippet Preview

* Whitelist the provider host that will serve the messages
  * In `about:config`, `browser.newtab.activity-stream.asrouter.whitelistHosts` can contain a array of hosts
  * Example value `["gist.github.com", "gist.githubusercontent.com", "localhost:8000"]`
  * Errors are surfaced in the `Console` tab of the `Browser Toolbox` ([read how to enable](https://developer.mozilla.org/en-US/docs/Tools/Browser_Toolbox))
* Navigate to `about:newtab?endpoint=<URL>`
  * URL should be from an endpoint that was just whitelisted
  * The snippet preview should imediately load
  * The endpoint must be HTTPS, the host must be whitelisted
  * Errors are surfaced in the `Console` tab of the `Browser Toolbox`

### [Snippet message format documentation](https://github.com/mozilla/activity-stream/blob/master/content-src/asrouter/schemas/message-format.md)
