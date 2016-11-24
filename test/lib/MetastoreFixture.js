const favicon_colors = [
  {
    "color": [
      223,
      40,
      22
    ],
    "weight": 0.0534667969
  },
  {
    "color": [
      249,
      246,
      247
    ],
    "weight": 0.0090332031
  }
];

const images = [
  {
    "caption": null,
    "colors": [
      {
        "color": [
          0,
          2,
          18
        ],
        "weight": 0.5300292969
      },
      {
        "color": [
          0,
          64,
          117
        ],
        "weight": 0.056152343800000004
      }
    ],
    "entropy": 5.39729713409,
    "height": 360,
    "size": 47722,
    "url": "https://i.ytimg.com/vi/Q_CXUa8WfNM/hqdefault.jpg",
    "width": 480
  }
];

const favicon_colors_firefox = [
  {
    "color": [
      70,
      185,
      230
    ],
    "weight": 0.049072265600000005
  },
  {
    "color": [
      0,
      135,
      197
    ],
    "weight": 0.0368652344
  }
];

const images_firefox = [
  {
    "caption": null,
    "colors": [
      {
        "color": [
          0,
          108,
          168
        ],
        "weight": 0.3452148438
      },
      {
        "color": [
          0,
          61,
          107
        ],
        "weight": 0.1997070312
      }
    ],
    "entropy": 4.85517735513,
    "height": 627,
    "size": 83964,
    "url": "https://www.mozilla.org/media/img/firefox/firefox-independent-1200.5bd827ccf1ed.jpg",
    "width": 1200
  },
  {
    "caption": null,
    "colors": [
      {
        "color": [
          6,
          7,
          14
        ],
        "weight": 0.6301269531
      },
      {
        "color": [
          214,
          143,
          43
        ],
        "weight": 0.034667968800000004
      },
      {
        "color": [
          45,
          133,
          194
        ],
        "weight": 0.031005859400000002
      }
    ],
    "entropy": 2.3233239714,
    "height": 70,
    "size": 9804,
    "url": "https://www.mozilla.org/media/img/firefox/template/header-logo-inverse.510f97e92635.png",
    "width": 185
  }
];

const gMetadataFixture = [
  {
    cache_key: "mozilla.org/",
    places_url: "https://www.mozilla.org/",
    favicon_url: "https://www.mozilla.org/media/img/favicon.52506929be4c.ico",
    description: "Did you know? Mozilla - the maker of Firefox - fights to keep the Internet a global public resource open and accessible to all.",
    title: "We're building a better Internet",
    media: {type: "video", url: "https://www.mozilla.org/media/video/mozilla.mp4"},
    expired_at: 2550891600000, // "2050-01-01 00:00:00",
    metadata_source: "Embedly",
    provider_name: "Mozilla",
    type: "html",
    favicon_colors,
    images
  },
  {
    cache_key: "mozilla.org/en-US/firefox/new",
    places_url: "https://www.mozilla.org/en-US/firefox/new",
    favicon_url: "https://www.mozilla.org/media/img/firefox/favicon.dc6635050bf5.ico",
    description: "Download Mozilla Firefox, a free Web browser. Firefox is created by a global non-profit dedicated to putting individuals in control online. Get Firefox for Windows, Mac OS X, Linux, Android and iOS today!",
    title: "Browse Freely",
    media: {type: "video", url: "https://www.mozilla.org/media/video/firefox.mp4"},
    expired_at: 2550891600000, // "2050-01-01 00:00:00",
    metadata_source: "Embedly",
    provider_name: "Mozilla",
    type: "html",
    favicon_colors: favicon_colors_firefox,
    images: images_firefox
  },
  {
    cache_key: "mozilla.org/en-GB/firefox/new",
    places_url: "https://www.mozilla.org/en-GB/firefox/new",
    favicon_url: "https://www.mozilla.org/media/img/firefox/favicon.dc6635050bf5.ico",
    description: "Download Mozilla Firefox, a free Web browser. Firefox is created by a global non-profit dedicated to putting individuals in control online. Get Firefox for Windows, Mac OS X, Linux, Android and iOS today!",
    title: "Browse Freely",
    media: {type: "video", url: "https://www.mozilla.org/media/video/firefox.mp4"},
    expired_at: 2550891600000, // "2050-01-01 00:00:00",
    metadata_source: "Embedly",
    provider_name: "Mozilla",
    type: "html",
    favicon_colors: favicon_colors_firefox,
    images: images_firefox
  }
];

const gMigrationV1Fixture = [
  {
    version: "1.0.0",
    description: "A dummy migration as a sentinel",
    statements: []
  },
  {
    version: "1.0.1",
    description: "A test migration",
    statements: ["ALTER TABLE page_metadata ADD COLUMN foo VARCHAR(32)"]
  },
  {
    version: "1.0.2",
    description: "One more test migration",
    statements: [
      `CREATE TABLE IF NOT EXISTS test_table_temp (
        id INTEGER PRIMARY KEY,
        col1 VARCHAR(32)
      )`,
      "ALTER TABLE test_table_temp RENAME TO test_table"
    ]
  }
];

const gMigrationV2Fixture = [
  ...gMigrationV1Fixture,
  {
    version: "1.0.3",
    description: "The third test migration",
    statements: [
      "ALTER TABLE test_table ADD COLUMN bar VARCHAR(32)"
    ]
  }
];

exports.metadataFixture = gMetadataFixture;
exports.migrationV1Fixture = gMigrationV1Fixture;
exports.migrationV2Fixture = gMigrationV2Fixture;
