/**
 * v1.3.1
 *
 * @url http://github.com/fantasytu/homebridge-xgimi-tv
 * @author Fantasy Tu <f.tu@me.com>
 *
**/
'use strict';

import { PLUGIN_NAME } from './settings';
import { XGimiTeleVisionPlatform } from "./platform";

export = (api) => {
  api.registerPlatform(PLUGIN_NAME, 'XGimiTeleVisionPlatform', XGimiTeleVisionPlatform, true);
}
