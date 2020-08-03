# Vendoring in npm libraries

#### Build system basics

#### Vendored libraries as externals

#### Is this library a good candidate to depend on and vendor?

#### How to vendor in a library

- [ ] file a bug for vendoring in the library itself so that there's
      an easy-to-find audit trail in Bugzilla, should it be needed

- [ ] Get license approval from the licensing team

  - [ ] review the mozilla-central policy at
        https://www.mozilla.org/en-US/MPL/license-policy/
  - [ ] file a license bug as described in the policy doc to request approval
  - [ ] make it block the next upcoming export bug (if that bug is not already
        filed, file one)
  - [ ] post a patch to add the license to
        [ `toolkit/content/license.html` ](https://searchfox.org/mozilla-central/source/toolkit/content/license.html)
  - [ ] get the patch reviewed
  - [ ] make sure that the patch gets landed at export time.

- [ ] Install the package using npm

  - [ ] Check that you're using npm 6.9.0 with `npm --version`
  - [ ] Be sure to save the exact version by passing `--save-exact` to
        `npm install`

- [ ] Include the vendored files and reference them

  - [ ] update [`bin/vendor.js`](../../bin/vendor.js) to copy any files
        needed at runtime as well as the license to the [`vendor/`
        directory](../../vendor/)
  - [ ] execute `bin/vendor.js` to copy your files into place so they get
        committed and referenced at runtime
  - [ ] add the exported symbol (the library's global name) for your library
        to the list of externals in
        [`webpack.system-addon.config.js`](../../webpack.system-addon.config.js)
        so that webpack knows where to link the symbol from
  - [ ] add the library to the list of scripts in
        [`bin/render-activity-stream-html.js`](../../bin/render-activity-stream-html.js)
        so it gets loaded at runtime
  - [ ] add the library to the list of scripts in
        [`AboutNewTabService.jsm`](../../AboutNewTabService.jsm) so that it gets
        preloaded for better browser startup performance
  - [ ] add the library to [`jar.mn`](../../jar.mn) so that it gets
        packaged into released builds
  - [ ] test and make sure that everything builds and works at runtime
