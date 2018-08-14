# Overview

```
Module Name: Datawrkz Bidder Adapter
Module Type: Bidder Adapter
Maintainer: vishal@datawrkz.com, anand@datawrkz.com
```

# Description

Connects to Datawrkz exchange for bids.

# Sample Ad Unit: For Publishers
```
    var adUnits = [
        {
            code: 'test-div-1',
            mediaTypes: {
                banner: {
                    sizes: [[300, 250]],  // a display size
                }
            },
            bids: [
                {
                    bidder: "datawrkz",
                    params: {
                        placement: 12345
                    }
                }
            ]
        },{
            code: 'test-div-2',
            mediaTypes: {
                banner: {
                    sizes: [[320, 50]],   // a mobile size
                }
            },
            bids: [
                {
                    bidder: "datawrkz",
                    params: {
                        placement: 67890
                    }
                }
            ]
        }
    ];
```