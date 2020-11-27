/**
 * v1.0.2
 *
 * @url http://github.com/fantasytu/homebridge-xgimi-tv
 * @author Fantasy Tu <f.tu@me.com>
 *
**/
'use strict';

import Characteristic from 'homebridge';

export const MANUFACTURER = 'XGimi';

export const PLUGIN_NAME = 'homebridge-xgimi-tv';
export const PLATFORM_NAME = 'XGimiTeleVisionPlatform';

export const SIMPLE_API_PORT = 16735;
export const COMPLEX_API_PORT = 16750;

export const SIMPLE_APIS = {
    'power' : 'KEYPRESSES:116',
    'vol+'  : 'KEYPRESSES:115',  //vol+  - Characteristic.VolumeSelector.INCREMENT
    'vol-'  : 'KEYPRESSES:114',  //vol-  - Characteristic.VolumeSelector.DECREMENT
    15      : 'KEYPRESSES:139',  //menu  - Characteristic.RemoteKey.INFORMATION
    9       : 'KEYPRESSES:48',   //back  - Characteristic.RemoteKey.BACK
    11      : 'KEYPRESSES:49',   //ok    - Characteristic.RemoteKey.PLAY_PAUSE
    8       : 'KEYPRESSES:49',   //ok    - Characteristic.RemoteKey.SELECT
    5       : 'KEYPRESSES:38',   //down  - Characteristic.RemoteKey.ARROW_DOWN
    4       : 'KEYPRESSES:36',   //up    - Characteristic.RemoteKey.ARROW_UP
    6       : 'KEYPRESSES:50',   //left  - Characteristic.RemoteKey.ARROW_LEFT
    7       : 'KEYPRESSES:37',   //right - Characteristic.RemoteKey.ARROW_RIGHT
    10      : 'KEYPRESSES:35'    //home  - Characteristic.RemoteKey.EXIT
};

export const COMPLEX_APIS = {
    'off'      : '{"controlCmd" : {"delayTime":0,"mode":6,"time":0,"type":2}, "action" : 20000}',
    'on'       : '{"controlCmd" : {"delayTime":0,"mode":6,"time":0,"type":4}, "action" : 20000}',
    'app'      : (appid) => `{"controlCmd" : {"data" : ${appid}, "type" : 1, "mode" : 7, "time" : 0}, "action" : 20000}`
};
