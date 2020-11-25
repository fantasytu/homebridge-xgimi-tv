# Homebridge XGimiTv Plugin

<p align="center">
    <img src="https://repository-images.githubusercontent.com/315327563/b5f04180-2f76-11eb-8c6a-ce5276b842e6" height="300">
</p>

A plugin on [Homebridge](https://github.com/nfarina/homebridge) to bring **XGimi Smart Projector** to HomeKit.

**If you like this plugin, don't hesitate to "Star".**

## Installation

```
sudo npm i -g homebridge-xgimi-tv@latest
```

## Configuration

Configuration on Config UI X is *NOT YET* supported.

Please subscribe for future updates.

That being said, be sure to edit ```config.json``` before add TV into Home app.

### Example BASIC config
```javascript
{
    "bridge": {
        "name": "Homebridge ED57",
        "username": "0E:C6:1D:3E:ED:57",
        "port": 51995,
        "pin": "193-78-630"
    },
    "accessories": [],
    "platforms": [
        {
            "name": "Config",
            "port": 8581,
            "platform": "config"
        },
        {
            "platform" : "XGimiTeleVisionPlatform",
            "devices": [
                {
                  "name": "XGimi TV",
                  "host": "10.0.1.227",
                  "inputs": [
                    {
                      "name"    : "iQiyi",
                      "type"    : "APPLICATION",
                      "package" : "com.gitvjimi.video"
                    },
                    {
                      "name"    : "YouTube",
                      "type"    : "APPLICATION",
                      "package" : "com.liskovsoft.videomanager"
                    }
                  ],
                  "manufacturer": "XGimi",
                  "model": "H2",
                  "serialNumber": "DSXXXXXXXXXX",
                  "firmwareRevision": "1.0.0"
                }
            ]
        }
    ]
}
```

To get the **package** attribute, you can visit:
```
http://{{you_tv_ip}}:16741/data/data/com.xgimi.vcontrol/app_appDatas/list
```

## Tested On

* iOS 14
* Apple Home
* Homebridge 1.1.6

## Development Plan

* Speaker Accessory

## Troubleshooting

If you have any issue, contact me(**f.tu@me.com**) or just submit an [issues](https://github.com/fatedier/frp/issues).
