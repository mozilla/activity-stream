/* globals require, exports, XPCOMUtils, CustomizableUI, Services, Social, Task */

const {Cc, Ci, Cu} = require("chrome");
const {data} = require("sdk/self");

const SocialService = Cu.import("resource://gre/modules/SocialService.jsm", {}).SocialService;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://services-common/utils.js");
Cu.import("resource://gre/modules/Preferences.jsm");
Cu.import("resource://gre/modules/Task.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "Services",
                                  "resource://gre/modules/Services.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "CustomizableUI",
                                  "resource:///modules/CustomizableUI.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "Social",
                                  "resource:///modules/Social.jsm");

const DEFAULT_MANIFEST_PREFS = {
  "social.manifest.twitter-com": {
    "author": "Twitter, Inc.",
    "description": "Use your Firefox Twitter Share to quickly author tweets about the pages you discover across the web.  We shorten URLs for quick sharing using the t.co link shortener.",
    "homepageURL": "https://twitter.com",
    "icon32ULR": "images/twitter/icon32.png",
    "icon64URL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAFgElEQVR42u2Za2wUVRSApy1CFWvBYkARrMZgor9MJRgfkR/8MJEfxPjHYIBE0YTE9w9DYkIkYtQYY2I0QdFoCBV2Z3d2l+5SKC2FKg/7gLZItbS0hZY+5t47M7uz89yZ8dzdhqYJyI47UyWZk5NJNp3mnu+ce8695wzDxPAtrQFAABAABAABQAAQAAQAAcDcKoeZKGIiiD65WwgAbGURE+KZMF/JoYUxvICDn6A8wFznZUroIQB1WwnWw/+GUU2SbDiT/uSiuu+KHhnT9l7Rd/Wr637LlMcQ/JXhrplOX56fIJUNhOE8ApgXx1UNNPTuracGlbPoxdNSM28Ihu3MlgnN3jeqPXE8zYTyGCyqSZBNnfL3w2ptk0iDFi8RII4h6HVt0v5RbVWjwBzgXfoelbFo2zkZ67ZzYxmQcxs70s+dkLZfUNqQqebsb4fVymJ2UTGbpyyEdvSpsEzkqr48SairuGI3Hli/pTNDHX8zyeZsrFuF91KTxjJw3H6eSZQOEMGVcRy9qheWaZw0Hj4iQOYVxcCix5qFoWzOKVps22mZMh5tFuuahNe75RVNAhMtFQDdmSItvHFtjd+J8fRxiWFvFt8oBfhiQHHcSNqwI2P6zyPakGJ9PahUx7AHAFUpIQ8wI5cV662ebDVND8BANwrd3UncLpquAEzbKWyj+iv6ojh1gQdb6PYEgU3pzBbVcg5PGutPpmmqHZiu5bMqRohf0yqNKJbjUgDguyHtngYC3vHiHIjiChZ9c0m97mJIt3cPaevapKoERAOMRpSEmwZYfzrDQ/FxI7rlfHZRqaK+5z06iePUlBdOZaQbVxKiWw0Txvt/KE+2inAAlbG08jL7JteeEK+q7gDGNbv2iAi+9/QqwaJqDh+avMluBksvZa0W3twzpH3Qm91wSnqzWx7XXAM80AwVAnsKAEH4ZeqRJvGcVGxBNCxHNCxiWDnbcSVjKgCIs25HpSfxkkbyRo9c1yJu7syMQ1L6KefT1r1HBE8BWHRfo9Ah5rBhJ8eNgUzOVwA4KKuh/kQ93EIcvo1DUJWdOZHdI9o8uqi3ORDit3XLpu279bDC2+cVhvUcgEXLU6RdyPkNAFfr539NQw31oSMLoY0dspKz/U2AKWNJEsqGHwARXMHxO/9UND+L0K6/shBt33riKKqM4Vc6MqewiXTb8joYcAI8BZfcMO9jU18Rw4uTpK5V/GpARarHsYAWeX6Epq9vABG0uAH/OKJ1S7lOwRQNL0MwrlprqPuhA/YPgENlEfTqWdnxQb4cVMtpB+z3XCiKF8TIDyOat9afk6yHDhNI3zkZbIXRiqQQHtO9qqhYt186IxeabL8BZhhqEvjjfuWiXOrRZljOhxeUCjrVQnM7Wszv19Wt0s5+FQYWA5l/GY/6UWNRnBSmV3MIEJ8+Fujcpp5ffUw8iU3HvSQnDLjnzm4d3Wuxw2QOwZNqBBVmtPB8MEXe7cl2EBMaWbejhz3D2tJD0773F6A8DgwI/ARaFkXQbq9MkWfa0p/2K12iqbo/kHnd2tGXvSufS/5/H+DIsqPie73Zj/qV7X3Zzwe0+lG9W8xJpj3jdDdTt2O8ue6kVA6mRwpL+A6AFx4kL7dnYGHVKqXa2NBPv9Oj3J8iriqmN3MhuGDBkGzD6czey/pg1iq+5OiWPaFZMFWH8UQt5GuI5s9/8okpv/ABdEcUP35U2NyV+WlEO0PMQdmCsY9o2OnctMLWmtLs4azVK5kNEzrMyteekJYmaDtBNVqoYJ6q69IZpiWokuVrDpKVTcKzbdLG9vTWLvm1LnnrWXlThwwt1apmYWmKVHF5u8MzU8f/00c+jup0SWX5WQqEbD5HueAzawAQAAQAAUAAEAAEAAFAAPCP+jdTEm8kfrK2ewAAAABJRU5ErkJggg==",
    "iconURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAABEElEQVQoz2Ng2PCWNERVDevBCKcGNOl1b7k3vQMihjVvUMThqg33f5Dd8Z5h7RuI6rCTn298+gNEDde+RZ76zIyuYc2bumvfrnz8Y3/wI8Pat+wb3z769vc/DLTc+MayHk3DujeuRz7+/Pv/19//u17+mnzn+7c/UNWffv9T3PmeAV3D2jeRpz///fcfE9z/+pdvyzsMDevfCmx+t+PlL0wN8x78gHoMPZTWvsk8/+X7HxRbPvz6p7PnA7ZQ2gDyqNCmt723vsFVf/79Dxg+KMYjO8n64McVj3+8/vnvx99/L378Xfvkp8X+j+iq0SKOd/M71d3vdfZ+EN/2HhhuwNggImmsB8UalhRBm8SHDQEA5UPgBrwMoL4AAAAASUVORK5CYII=",
    "name": "Twitter",
    "origin": "https://twitter.com",
    "pageSize": {
      "share": {
        "height": 300,
        "width": 550
      }
    },
    "shareURL": "https://twitter.com/intent/tweet?url=%{url}&text=%{text}",
    "postActivationURL": "https://activations.cdn.mozilla.net/en-US/activated/twitter.html",
    "updateDate": Date.now(),
    "installDate": Date.now()
  },
  "social.manifest.www-facebook.com": {
    "activities": {
      "share": {
        "disposition": "inline",
        "filters": {"type": ["*"]},
        "href": "https://www.facebook.com/sharer/sharer.php?u=%{url}",
        "returnValue": false
      }
    },
    "author": "Facebook",
    "description": "Keep up with friends wherever you go on the web.",
    "homepageURL": "https://www.facebook.com",
    "icon32URL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAADbklEQVRYCc1Xv08UQRj99tctexAuCEFjRE0kGBEtLDSGqIWNxkYKbTAxNlY2JhaGWltNtNFeKgsKKxITK43/gCYW+IsoRhA4D47bH7fn9+bcvdm5JR7sefolC3Ozu9978+bNN7PayUv3HN3umdY0Y6IWBtSJ0HSTarXqTOiuTep6Lj+tdxAcA8RAgSmwdd2aCDs0clldYALb/FvgYVhjmfliVA2XpjEgWo0Attn42Z6WH1RFor5ehwo9XQIUZMoVn4qlCoVMSo62EvD8Kh0b3U2Xz43R2PBO6mUCGDlAf65V6MadZzT/rUimoccc2kYA4BfPHqJb105RzjJigKhRq9kEJUBIjgYVuXeL7SAI6eD+Abp5dTwVHOmEHxT50d8WBYJqSOdPj5BjW8gZR8UNqFR2xagx/65XFYaMH+BGWwiYpi4UkBPPLxTp9v1Z+lHc4DWvCQXWmIy6EjITgKowVd5Jjv7N3Hd6y5esigoOwpkJIAmMpZpLJGdiaaC4F0UmAj6bD84GCEwmB/qxMmRilmnwb/mpjAocHh4UEoNAt5NLZB7oy9OJo0PxqkAtePdhiSqunyC1LQUwWMPQaOr6GRre258Ajn4cP7KHcEXhsxpXbj+lT19X2TMNGTLVAcjcalS8gDwsQ2UOMhH4k8FkcrEn5E5ub2sKohxLK2VR77Hl9RUcsrgeRIEiVOT6z+tDbIeLy+vk+kGTCbXxycet6xhl//3f6bJEkdHYhA+mLtDIvoH4ieev5+juoxdk5+pjhALYEdXIpEB5w+NlSKSzqVQ/+H7IO6BLtl3fngGMiqhGJgIwlM6qpyUGFjySdk8m0Zg0ubeD7X9OIDEFajltRQgUJaUKx69tdgaQa0FMADuahZPMFtcEwNPm2hA7ZI5sK4aoE2NvYI+o8hkCIe7CwTv68zS0q9Dk5vpbm/8FXxitSzmMFHpsGj0wyLUheTwD2Y9fVgh1Ae0EPUgD9241ZEnld+v5kgnVZ/8fE0brVh5BK+1oCqKKF72Dk7HwBsssB/pklU1dfChy3S659H5+uelgIb+8WRv1/uGTV9Sdb5wJFlfW6fPCalMhwhSU1j2xKwKbP838GcOwJja4TqO0bjdmXxYTy1EYjFdCWoCEYZhseH/GDL3yJPHnuW6YmT7P1SlIA4768Hke4vOcsX8BE346lLHhDUQAAAAASUVORK5CYII=",
    "icon64URL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADoAAAA6CAYAAADhu0ooAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA2hpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDowNTgwMTE3NDA3MjA2ODExODA4M0NDMTM4MEMyQTVFQiIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDpCOEE0QzYzMUE2MTYxMUUyOEJFQUJDRTMzOERDQjM5MCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpCOEE0QzYzMEE2MTYxMUUyOEJFQUJDRTMzOERDQjM5MCIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ1M2IChNYWNpbnRvc2gpIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6QUM3QUJGQTkzODIwNjgxMThDMTQ5OEFGOTgxQUJBQ0UiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6MDU4MDExNzQwNzIwNjgxMTgwODNDQzEzODBDMkE1RUIiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz4XCE4/AAABzElEQVR42mK0Dp/LyMDAUAHEOUAsxTC8wDMgngLEHSxQT7YxDE8gBfXbfyYgkc0w/EEOyKPSI8Cj0kwMIwSMenTUo6MeHdyAZTA6ipebncHBXIHBTF+aQVFGgIGfl4NBAIgZgU2bL99+Mfz4+Yfh89dfDK/ffQPj9hmHhpZHOTlYGZJDjBgCXNUZONixO42Hiw2MRQS5wIEAAkPKowoyggwdJc4MMhJ8wzfpyojzM0yp82IQ4GMfvoUROxsLQ0eZM009OSg8GuGtw6AgLTC8qxdQgRPpqzP861ErIzlwCTrs61EzPcIdp20H7zCs23Wd4e6jdwy/f/8dmh5VUxTCK7/1wB2i6shBn3TFhXnwym/ce2N45FFODvwJ6tHTD8PDo2yszHjlQe3a0d7LqEdHPTrq0VGPDkVA05bRkRVJNNe/78R9hroJ+4d/jN68925kJN2b91+PDI/efjACYvTlm68MHz//GP4evfXg7cioXm7eezMyPEpKjNK0HrWJmEdRPUlI/2jLaNSjox4d9eioR0c9OurRUY+OenTUo6MeHfXoqEdHPTrq0VGP0t+jT0eAP5+CPDp1BHh0KmhwrBMas1kMw3ODDygiOwECDADJwGV3tLQaBAAAAABJRU5ErkJggg==",
    "iconURL": "data:image/png;base64,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",
    "name": "Facebook",
    "origin": "https://www.facebook.com",
    "pageSize": {
      "share": {
        "height": 400,
        "width": 700
      }
    },
    "shareURL": "https://www.facebook.com/sharer/sharer.php?u=%{url}",
    "version": 2,
    "postActivationURL": "https://activations.cdn.mozilla.net/en-US/activated/facebook.html",
    "updateDate": Date.now(),
    "installDate": Date.now()
  },
  "social.manifest.mg-mail.yahoo.com": {
    "author": "Yahoo! Inc",
    "description": "Quickly send web pages to yourself and others with enhanced link previews and more.",
    "homepageURL": "http://mail.yahoo.com",
    "icon32URL": "https://s.yimg.com/nq/nr/icons/ymail32.png",
    "icon64URL": "https://s.yimg.com/nq/nr/icons/ymail64.png",
    "iconURL": "https://s.yimg.com/nq/nr/icons/ymail16.png",
    "name": "Yahoo Mail",
    "origin": "https://mg.mail.yahoo.com",
    "shareURL": "https://mg.mail.yahoo.com/d/app/compose?url=%{url}&title=%{title}",
    "version": "1.0",
    "postActivationURL": "https://activations.cdn.mozilla.net/en-US/activated/yahoomail.html",
    "updateDate": Date.now(),
    "installDate": Date.now()
  },
  "social.manifest.mail-google.com": {
    "author": "Google",
    "description": "Send web pages and images to people using Gmail.",
    "homepageURL": "https://mail.google.com",
    "icon32URL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAEBklEQVRYw+2WTWhcVRTHf/dNJulMJl80qSbtpKk1SUsFBV1EkOAirYu6aBEXKih01eLCD0Swgm3UKkY3CpFWMSIoiF8FcdFFlt0UKrrwI5WaZiZ1mmQmXzbz8jJv3j0u3uckM0ZX2eTBm3vnnfvu+Z//Of/zrhIRtvIy2OJrG8A2gDp/opRi+vjhswhn6np6aHnpZYz2dtAaEY0WQby5ewtaa7RoRIv7LPjv2kUcd12hgD16Hp3NIiLDveNXzgZ+fRlmjj7cGquvXwRPlskkzaeepf7+B4LN3U09QJ7TCodVADg//Uxp7DPELIIIIkLv+BVVIwWucxFBikWW3xvB/OZrCHqFbw/nBCZBKvYRyt//gD16HkwzWLdolys8BgwopcgeGxKijcmbxg8eJPXCi5BIVKYgEq3206MFXVyhNPohzsS1IGoRIbNqMWOVeOrqrzUYqOIcBPv331g+/QrlzFQkcgHxBgnZ0NPTrL3+JnriD9cOrGnNL7eLzFql/6AClz2aTp6qoNzJ5/n71dNYly65EQH+r7+oPD7O2vAbyPx8YLttl5l4aBDT0cimMoxE3TA4SMtbb2O0d1QsWf38C8yPPkYXi0HepWhSGvsU+8uviJZHrn4H1x97HH3oECAoQNWS4ToEaNHEurtpPneOlQsXsH+8Gpjty5dxshkaTpxARFj7ZAydzQb0OaK5fmcX5pEjqHgc8R2rdWleD6CiBLRHbyJB6vnnWP32O6yLF0OA2SzWyIibd9MM3jfLDpP33oc9MOAXCGpD3DUZiILRbpbF3bnh+DGMA/2svv+Bq2mP+hC5MAPkjj6KSqdDWSoVMiCbtmIJbl9qoew0Rn8fyXffwehOR2pPcESYTDYx8/QzqHSajWcMqcmBUcN/0NlcvYvb+bSbkh2vnaFuaAgRwXQcrvUdYPnJJ5D6hqCnVIxB19m0CKkoQlfHEjYTBLRQKpX468EBJNVIfsXE7ukJ0lC9qH0g8j9qQOug5YrfakVYmF9grpAnmUjQ+chhurTmz8kMC4tLEbdSNeFKNi3CqAwlkIWIYFkWszOzrFoWnZ13kGpsRBBiyqD37r0sLLZyY+omdtkOoxYJB4k8qwlAKhnwu0q+UCCfL9DS0sz+rh4MQ3mFFhZrW2szTff0kZnOUZhfdCWv1jOwkZmqKRBPhpa1Ri53C8dxSKd3k0wkAmmGMg1ZMmIx9u3dw862VqYyN7FKpSAIP//ybymIymduLk+hUKCtrZX29p3EDGND1NH3gnoRIZVK0t+/n9ytOfL5+VBdESBVZSgiw77slpaWSaf3sKujA0MZ7olInArn/pdQPLX4n10tgqEUuzt3cde+buLxuFcEAjBc9TywVdf2qXgbwDaAfwDcNu1qGFmC/gAAAABJRU5ErkJggg==",
    "icon64URL": "data:image/png;base64,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",
    "iconURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAAbFBMVEX////gSj+qODDgSj/o5tiwr6ThVEniZ1zn08XOzMCqODDmtajl49bY18nkjoLdST7Lyr2/VUuvoJblopXWRzzFxLjT0cW6aV/mv7LjhXjPRDq0fXPCQDfMS0Hg3tHe3M60sqfl49W7ua6vkYfYzKRYAAAAA3RSTlMA19csuNBxAAAAaElEQVR4Xp3IRw7CMBQFwJj3m51e6f3+dyTYoGSJmOVkP3Bq9GHq5gAkT5ELDjGA6h0VcAox9oCaKeptSEE9IILhyN+gnQDnJy9Bpm3H6yj9yOvwJdG0RNFcaHa9pXBoCoruj7DJ/vACm58E7AMvk10AAAAASUVORK5CYII=",
    "name": "Gmail",
    "origin": "https://mail.google.com",
    "pageSize": {
      "share": {
        "height": 500,
        "width": 500
      }
    },
    "shareURL": "https://mail.google.com/mail/?view=cm&ui=2&tf=0&fs=1&body=%{body}&su=%{title}",
    "postActivationURL": "https://activations.cdn.mozilla.net/en-US/activated/gmail.html",
    "updateDate": Date.now(),
    "installDate": Date.now()
  },
  "social.manifest.www-linkedin.com": {
    "author": "LinkedIn Corporation",
    "description": "Manage your professional identity. Build and engage with your professional network. Access knowledge, insights and opportunities.",
    "icon32URL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAZCAYAAAAmNZ4aAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAABJFJREFUeNqsVl1oHFUU/u7M7OxfyuanadNtlGz8KYl5kASsD1oEqfgiJvimfRBUCPgkFd98UF/6VtASEMQfahERCiJCfahIKVYakuJPbWsTo92ENSaN3U2ymZ07M9dzZnY3O7OTPkRnuXtnzrn3fOfvnnPFniPPH3/m5dfe2pfLZl3Xw//16LqOxduV9UufvffqlU9OnO49cDDEFxMfXraPHupLSMelT8WkOiv6jrvw4tcx+IXrxfmT4w+N5HtyViuwYSYSiVLFgiRrBa2XLvx3XQNM/vOFtAqMUwKx63RNIJntyAkznSJCGLhsSaxu2XA9BdtVuKczjbF9OZTWLfxcWkfCB98dsCBLKpb0aFLRUBgb0sE/BE58FLozeOOJAjpM3WdO/XAL39xYQdLQdhVnQb8tCmEMLoyq7aJsOaSZg4mR/U1Qfo4UuvHFTyUknd0BM9yWdJVoeqcFmDXaqDmokuXX/t4IMW+sbIJDkUnouwLmMxKclBhgixjrBOqRfl9dX8beDhNP3teDm7erOHlxAbbnwZVqZ+FK+S4VIo5HmQ0/1O3ANccja4OjRF7B2+dv4sR3c5C0aw+5PWsaqJJXtmy3uSlNdEn7GC1L764XyNDpO5XQmjlG4pDUhIoFdshim4TYNBe6Mnjn6CHaF1hx7rcVfH1tGWP9nXhxrL+56dT3f6A/l8Irj9yLQUpIScC/Lm/gg+kiZpbKyFJoWAZH19ghSgZbaTsKm7aHrpSJFx7ON5lLZQufziyiryMZoqcoy58d3g9D2zZlqLcDTz/Yi4nTM5gulpEmy9kTptDjDIbmEbBDFrtsteOGmDU6YuwvW4bpz430hUAbD7v9+OOD4CrIMjkcnhefH5qi5FDkZsUBiSxiHsgbKmbvmdklvPT5j/h4ejFEHz2YQ2/GDHKAi1JNQkrZ7mquWJJy2vF4hBGYB85qL9w8zlFROXZm1n//iOJ6/94sHit0+d+daQOdKQPLVPkMTYNUDlnvtFvMYDaNGg0nYhofMdY6qtC3c6v+Ic0kDd9Ts5RQTUsoBIJGzQ3kun4PiTnHLruaDfItiwA36BFXc8Fh//sK0WxFcoPlcGwdQbNQKi65DDbSt4xevKjFKp5eT4AmP66oNPisWywwgwoVCFKRYq7qCrXTw8AqItqr81Uw4noEtNbGFlVe1aXE0kP7oqchZL3SY6qI0SYl0tb8vhqJkmisr4/W3AnzFDKZDH5fmHfe//LsA47rjk5OTp7P5/Orhgoh7wAgYvpdIwRKtbGFqCNzrU6msLS4qE9NTR0mxqOjo6Ol8fHxC9sW0/3ol78qOPzuxSborTtbAJXLS3+uhegLa1WSaAQK0HyKuthZ6tsNUQvU2aBp9Th7wjB0t6en+0rfgbwcHh6eC1y9rSY26TJweX615aqo8cFEuSrb6XogGHRmiwRUXGnp5RzT+k2IslqjKUFfV4eGhq4ODAzUz7vGNUQZvhBeHG36d6M3Zl34Hou7guTSZiWtS0v5lwLXr2KmaUJ7KlV6XbOtO7Gd/D89AglprR0b1N5MG8LigqJp21eofwUYABnolxra9d85AAAAAElFTkSuQmCC",
    "icon64URL": "data:image/png;base64,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",
    "iconURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAm5JREFUeNp8U0trU0EU/mZyb9I8amrQYGq0GjdWio/iwq7qUgVduVDciRv39U+04MKNC7euRFAoisVFUKGKCwWLaNUaa8VXmia1yU3ua8ZzJknTKvRcLnfmzJzv+87jiqniwr1KwzsthRAg02ib2GLNppTGjlT0obhy543avz0h3FDBDzUICDFLYiPYRusCSFos1RxtLTt+4GnHHhqI49xIFnM/1/C0tAJLSmxlDFBr+qFVaXqouQGuju3FiT1pjObTePShjLrrQkqxOUr3JDC844WwVl3f+DnoQCaO50s1LNYcKN1lEubcpxQZz45IA8I4fqAgCpNFT0aEzRdz/TFUHR91Qk5GI5SGwBqp47NCJoFWEOJz1THpRRhB6cByfYV6I8S18QIuH8/jfbmB87df4fqZYYwNDeDxx2UMZ1MYHdyGJjHef/sLEw/eUToaESKQvh+iSSxJO2IUZJNRuLTPJGyzvnR0EAd3pkhJiDh15+KRHMb3ZVAjpT6Ry5ByC0laQF+YXDXlFpr82OZJ0aHJIk7enEW1GRjfyK5+tIiEY6VH1QoDjaBTNU2PF+j1GZj9UsXi7zpef/+D0opjfFwbRUQcK02gIhW6HWJwaN/tQqDUehe7PnOX/BwrjVP3Drv9XtfAE65NzTbPQydGmhN6+zrjm4pZZs9tZItTcbt3UrG2z4x6h9kyyDQcM/NlU7hvqy2Clbj14iuefKrgJQ0Wn7PdeFZCPt2H4kKFC2FwhZyY1opXPr1UfTNurILaxnmaYFbDRF7QZrZobwv6SFgXju2+Oz3345SK/jP4Uev/PyjW80n6n88ezs38FWAAzAg/WebH1yoAAAAASUVORK5CYII=",
    "name": "LinkedIn",
    "origin": "https://www.linkedin.com",
    "pageSize": {
      "share": {
        "height": 570,
        "width": 520
      }
    },
    "shareURL": "https://www.linkedin.com/shareArticle?mini=true&url=%{url}&title=%{title}&trk=FIREFOX_ACTIVATION",
    "postActivationURL": "https://activations.cdn.mozilla.net/en-US/activated/linkedin.html",
    "updateDate": Date.now(),
    "installDate": Date.now()
  },
  "social.manifest.www-tumblr.com": {
    "author": "Tumblr, Inc.",
    "description": "Post text, photos, quotes, links, music, and videos from your browser, phone, desktop, email or wherever you happen to be. You can customize everything, from colors to your theme's HTML.",
    "homepageURL": "https://www.tumblr.com",
    "icon32URL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAOtJREFUeNpi/P//P8NAAiaGAQajDmAhpMDCPY5sw0/sXES5A/AAQST2e5qFAA6gDcRXkPiM9E4DFgOdCJMG0gEgy63olgvQQBoQTyaQIElKlKQ44CwQG+GQe4fGZ6RFFBiNzJIQCQjhCO5PQKxADwfgSlj/KSkJR2vDUQeQ44A/aHxuSqp1chzwBEtOikZzEE0dsAmL2AIgvg/ET4F4Ha0d0AXEb7GIgwojKSB2BGIRWjoA5EsvIH6OQ54ViO1p3SQ7BcRq0OrZHYjlgfgbtJm2Goi30NoBIPAFiPugmGzAONo1G3XAQDsAIMAAyz0m+77iTBQAAAAASUVORK5CYII=",
    "icon64URL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAaJJREFUeNrsmzFLAzEUxxMp4lQEHR0ERRCKdFBwdBDq4CAoLpV2cPAjuBRxUcRR/AS6OwiCIq5SdFdc66R0KYKgIvEfmqGIYLTmztz7P/htL3fpj8u7d7mrNsYoydGjhAcFUAAFUAAFUAAFUAAFUIDQyP31AadLleCTrp8dRH0F3APzBSKWQD8YklwDxqUXwUnpAuYlCxgBs5IFbP7HviOpCS2BFamd4AI4lNgK58EeOAJ9YlphFztgzTU+vvFdN6hjErDOp0EKoAAKiCFCFUH9wwofrMrzCqAACqAACqAACqAACqCAdAU8eeQMZ1lAwyOnnGUB1x45G6q9c9w5p15QAoOxCzjxyLE/1u4eP4IrcOeWzqkKuKWelIBj0PTMHQBTYMxJsVGNXcAr2O5ifBFMxH4btO8ILroYX4ldwDtYBPVfjl/OQiPUAjNg1y0L37gBq1npBF9U+8XJKKiBS/D8KecN3IJ9MAcK4DzEZHIqvbAfS205tKv+eSfjQSX04VSaAjrDuNtkM+kTa/5pik+DFEABFEABFEABFEABMuNDgAEAKzQ9WAq/3UEAAAAASUVORK5CYII=",
    "iconURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAJNJREFUeNpi/P//PwMlgAWZY+EeR5SmEzsXwdlMeNQJAfFMKMYJ8BkQCcRpUEyyAc5A3ElyGECBCRDvBmJGJDFYSDMS4wI+bApJ8cI+LAYw4jKUiYFCQFMDvqKlCW5SDdiDxH4LxIdJNaAIiK8h8ZmBmIuYdAAD94BYB4hVgfg3EN8nNiExoCWgW/gUMFKanQECDABkohjLM1oQUAAAAABJRU5ErkJggg==",
    "name": "Tumblr",
    "origin": "https://www.tumblr.com",
    "pageSize": {
      "share": {
        "height": 430,
        "width": 550
      }
    },
    "shareURL": "https://www.tumblr.com/share?v=3&u=%{url}&t=%{title}&s=%{description}",
    "version": 1,
    "postActivationURL": "https://activations.cdn.mozilla.net/en-US/activated/tumblr.html",
    "updateDate": Date.now(),
    "installDate": Date.now()
  }
};

// based on SocialShare.sharePage in browser-social.js
// target would be item clicked on for a context menu, but not handled in this case
function windowProperty(window, eventTracker) {
  return {
    configurable: true,
    enumerable: true,
    writable: true,
    value: {
      copyLink: url => {
        let clipboard = Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper);
        clipboard.copyString(url);
        eventTracker.handleUserEvent({
          event: "SHARE_FROM_TOOLBAR",
          provider: "copy-link"
        });
      },
      emailLink: (browser, url) => {
        window.MailIntegration.sendLinkForBrowser(browser);
        eventTracker.handleUserEvent({
          event: "SHARE_FROM_TOOLBAR",
          provider: "email-link"
        });
      },
      sharePage: (providerOrigin, graphData, target) => {
        let SocialUI = window.SocialUI;
        let Social = window.Social;
        let messageManager = window.messageManager;
        let gBrowser = window.gBrowser;
        let OpenGraphBuilder = window.OpenGraphBuilder;
        let ShareUtils = window.ShareUtils;
        // graphData is an optional param that either defines the full set of data
        // to be shared, or partial data about the current page. It is set by a call
        // in mozSocial API, or via nsContentMenu calls. If it is present, it MUST
        // define at least url. If it is undefined, we're sharing the current url in
        // the browser tab.
        let pageData = graphData ? graphData : null;
        let sharedURI = pageData ? Services.io.newURI(pageData.url, null, null) :
                                    gBrowser.currentURI;
        if (!SocialUI.canShareOrMarkPage(sharedURI)) {
          return;
        }

        // the point of this action type is that we can use existing share
        // endpoints (e.g. oexchange) that do not support additional
        // socialapi functionality.  One tweak is that we shoot an event
        // containing the open graph data.
        let _dataFn;
        if (!pageData || sharedURI === gBrowser.currentURI) {
          messageManager.addMessageListener("PageMetadata:PageDataResult", _dataFn = msg => {
            messageManager.removeMessageListener("PageMetadata:PageDataResult", _dataFn);
            let pageData = msg.json;
            if (graphData) {
              // overwrite data retreived from page with data given to us as a param
              for (let p of Object.keys(graphData)) {
                pageData[p] = graphData[p];
              }
            }
            ShareUtils.sharePage(providerOrigin, pageData, target);
          });
          gBrowser.selectedBrowser.messageManager.sendAsyncMessage("PageMetadata:GetPageData", null, {target});
          return;
        }
        // if this is a share of a selected item, get any microformats
        if (!pageData.microformats && target) {
          messageManager.addMessageListener("PageMetadata:MicroformatsResult", _dataFn = msg => {
            messageManager.removeMessageListener("PageMetadata:MicroformatsResult", _dataFn);
            pageData.microformats = msg.data;
            ShareUtils.sharePage(providerOrigin, pageData, target);
          });
          gBrowser.selectedBrowser.messageManager.sendAsyncMessage("PageMetadata:GetMicroformats", null, {target});
          return;
        }

        let provider = Social._getProviderFromOrigin(providerOrigin);
        if (!provider || !provider.shareURL) {
          return;
        }

        let shareEndpoint = OpenGraphBuilder.generateEndpointURL(provider.shareURL, pageData);
        window.open(shareEndpoint, "share-dialog", "chrome");

        eventTracker.handleUserEvent({
          event: "SHARE_FROM_TOOLBAR",
          provider: provider.origin
        });
      }
    }
  };
}

// This is to register a ShareUtils object in the browser chrome window and
// to hide the existing social share (paper airplane) button.
const Overlay = {
  init: eventTracker => {
    for (let win of CustomizableUI.windows) {
      Overlay.setWindowScripts(win, eventTracker);
    }
    Services.obs.addObserver(Overlay, "browser-delayed-startup-finished", false);
  },
  uninit: () => {
    Services.obs.removeObserver(Overlay, "browser-delayed-startup-finished");
    for (let win of CustomizableUI.windows) {
      delete win.ShareUtils;
      if (win.SocialShare.shareButton) {
        win.SocialShare.shareButton.removeAttribute("hidden");
      }
    }
  },
  observe: window => {
    Overlay.setWindowScripts(window);
  },
  setWindowScripts: (window, eventTracker) => {
    Object.defineProperty(window, "ShareUtils", windowProperty(window, eventTracker));

    if (window.SocialShare.shareButton) {
      window.SocialShare.shareButton.setAttribute("hidden", "true");
    }
  }
};

function createElementWithAttrs(document, type, attrs) {
  let element = document.createElement(type);
  Object.keys(attrs).forEach(attr => {
    element.setAttribute(attr, attrs[attr]);
  });
  return element;
}

const DEFAULT_OPTIONS = {eventTracker: {handleUserEvent() {}}};

function ShareProvider(options = {}) {
  this.options = Object.assign({}, DEFAULT_OPTIONS, options);
  this.eventTracker = this.options.eventTracker;
}

ShareProvider.prototype = {

  /**
   * Initialize Share Provider
   */
  init: Task.async(function*() {
    yield this._setupProviders();
    this._createButton();
    Overlay.init(this.eventTracker);
  }),

  /**
   * Set up the prefs and enable a default set of social providers if the user
   * hasn't enabled any.
   */
  _setupProviders: Task.async(function*() {
    if (!Services.prefs.prefHasUserValue("social.activeProviders")) {
      let promises = [];
      for (let key of Object.keys(DEFAULT_MANIFEST_PREFS)) {
        this._setPref(key, DEFAULT_MANIFEST_PREFS[key]);
        promises.push(new Promise(resolve => {
          SocialService.enableProvider(DEFAULT_MANIFEST_PREFS[key].origin, resolve);
        }));
      }
      Services.prefs.setBoolPref("social.enabledByActivityStream", true);
      yield Promise.all(promises);
    }
  }),

  _setPref(key, value) {
    let string = Cc["@mozilla.org/supports-string;1"].createInstance(Ci.nsISupportsString);
    string.data = JSON.stringify(value);
    Services.prefs.setComplexValue(key, Ci.nsISupportsString, string);
  },

  _unsetupProviders: Task.async(function*() {
    if (Services.prefs.getBoolPref("social.enabledByActivityStream")) {
      let promises = [];
      for (let key of Object.keys(DEFAULT_MANIFEST_PREFS)) {
        let _key = key;
        promises.push(new Promise(resolve => {
          SocialService.uninstallProvider(DEFAULT_MANIFEST_PREFS[_key].origin, () => {
            Services.prefs.clearUserPref(_key);
            resolve();
          });
        }));
      }
      yield Promise.all(promises);
      Services.prefs.clearUserPref("social.activeProviders");
      Services.prefs.clearUserPref("social.enabledByActivityStream");
    }
  }),

  /**
   * Create the share button widget
   */
  _createButton() {
    let id = "activity-stream-share-button";
    let widget = CustomizableUI.getWidget(id);

    // The widget is only null if we've created then destroyed the widget.
    // Once we've actually called createWidget the provider will be set to
    // PROVIDER_API.
    if (widget && widget.provider === CustomizableUI.PROVIDER_API) {
      return;
    }

    let shareButton = {
      id,
      defaultArea: CustomizableUI.AREA_NAVBAR,
      introducedInVersion: "pref",
      type: "view",
      viewId: "PanelUI-shareMenuView",
      label: "Share",
      tooltiptext: "Share",
      onViewShowing: () => {},
      onViewHiding: () => {},
      onBeforeCreated: doc => {
        if (doc.getElementById("PanelUI-shareMenuView")) {
          return;
        }
        let view = doc.createElement("panelview");
        view.id = "PanelUI-shareMenuView";
        doc.getElementById("PanelUI-multiView").appendChild(view);
        shareButton.populateProviderMenu(doc);
      },
      populateProviderMenu: doc => {
        let view = doc.getElementById("PanelUI-shareMenuView");
        for (let el of [...view.childNodes]) {
          el.remove();
        }

        let item = createElementWithAttrs(doc, "toolbarbutton", {
          "class": "subviewbutton",
          "label": "Copy Address",
          "image": data.url("content/img/glyph-copy-16.svg"),
          "oncommand": "ShareUtils.copyLink(gBrowser.currentURI.spec);"
        });
        view.appendChild(item);
        item = createElementWithAttrs(doc, "toolbarbutton", {
          "class": "subviewbutton",
          "label": "Email Link...",
          "image": data.url("content/img/glyph-email-16.svg"),
          "oncommand": "ShareUtils.emailLink(gBrowser.selectedBrowser, gBrowser.currentURI.spec);"
        });
        view.appendChild(item);
        item = createElementWithAttrs(doc, "menuseparator", {"id": "menu_shareMenuSeparator"});
        view.appendChild(item);

        const defaultSort = ["Facebook", "Twitter", "Tumblr", "LinkedIn", "Yahoo Mail", "Gmail"];
        let providers = Social.providers.filter(p => p.shareURL);
        for (let provider of providers) {
          let index = defaultSort.indexOf(provider.name);
          if (index < 0) {
            index = 99;
          }
          provider.sortIndex = index;
        }
        providers.sort((a, b) => a.sortIndex - b.sortIndex);

        for (let provider of providers) {
          let item = createElementWithAttrs(doc, "toolbarbutton", {
            "class": "subviewbutton",
            "label": provider.name,
            "image": provider.iconURL,
            "origin": provider.origin,
            "oncommand": `ShareUtils.sharePage("${provider.origin}");`
          });
          view.appendChild(item);
        }

        item = createElementWithAttrs(doc, "menuseparator", {"id": "menu_shareMenuSeparator"});
        view.appendChild(item);

        let url = Services.prefs.getCharPref("social.directories").split(",")[0];
        item = createElementWithAttrs(doc, "toolbarbutton", {
          "class": "subviewbutton",
          "label": "Add Services",
          "image": data.url("content/img/glyph-add-16.svg"),
          "oncommand": `openUILinkIn("${url}", "tab");`
        });
        view.appendChild(item);
        item = createElementWithAttrs(doc, "toolbarbutton", {
          "class": "subviewbutton",
          "label": "Remove Services",
          "image": data.url("content/img/glyph-delete-16.svg"),
          "oncommand": "BrowserOpenAddonsMgr('addons://list/service');"
        });
        view.appendChild(item);
      },
      onCreated: node => {
        // quick hack to add style for share icon
        if (!node || node.id !== id) {
          return;
        }
        node.setAttribute("image", data.url("content/img/glyph-share-16.svg"));
        node.setAttribute("observes", "Social:PageShareOrMark");
      },
      observe: (aSubject, aTopic, aData) => {
        for (let win of CustomizableUI.windows) {
          let document = win.document;
          shareButton.populateProviderMenu(document);
        }
      }
    };

    CustomizableUI.createWidget(shareButton);
    CustomizableUI.addListener(shareButton);
    Services.obs.addObserver(shareButton, "social:providers-changed", false);
  },

  /**
   * Uninit the Share Provider
   */
  uninit: Task.async(function*(reason) {
    CustomizableUI.destroyWidget("activity-stream-share-button");

    Overlay.uninit();

    if (reason === "uninstall" || reason === "disable") {
      yield this._unsetupProviders();
    }
  })
};

exports.ShareProvider = ShareProvider;
