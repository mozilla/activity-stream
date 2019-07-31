# Vendoring in npm libraries

#### Build system basics

#### Vendored libraries as externals

#### Is this library a good candidate to depend on and vendor?

#### How to vendor in a library

* [ ] file a vendoring bug in Bugzilla

* [ ] Get license approval from the licensing team
  + [ ] review the mozilla-central policy at https://www.mozilla.org/en-US/MPL/license-policy/
  + [ ] file a license bug as described in the policy doc to request approval
  + [ ] make it block the next upcoming export bug (if that bug is not already

    filed, file one)

  + [ ] post a patch to add the license to

    [ `toolkit/content/license.html` ](https://searchfox.org/mozilla-central/source/toolkit/content/license.html)

  + [ ] get the patch reviewed
* [ ] Install the package using npm
  + [ ] Check that you're using npm 6.9.0 using `npm --version` 
  + [ ] Be sure to save the exact version by passing `--save-exact` to `npm install` 

* [ ] XXX more to come

