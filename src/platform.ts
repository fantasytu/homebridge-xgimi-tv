/**
 * v1.0
 *
 * @url http://github.com/fantasytu/homebridge-xgimi-tv
 * @author Fantasy Tu <f.tu@me.com>
 *
**/
'use strict';

import { MANUFACTURER, PLUGIN_NAME, PLATFORM_NAME} from './settings';
import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic} from 'homebridge';
import { XGimiTeleVisionAccessory } from './accessories/tv';

export class XGimiTeleVisionPlatform implements DynamicPlatformPlugin {
    public readonly Service: typeof Service;
    public readonly Characteristic: typeof Characteristic;

    public readonly log: Logger;
    public readonly config: PlatformConfig;
    public readonly api: API;

    // this is used to track restored cached accessories
    public accessories: PlatformAccessory[];

    constructor(log, config, api) {
        this.log = log;
        this.config = config;
        this.api = api;

        this.accessories = [];

        // get service & characteristic
        this.Service = api.hap.Service;
        this.Characteristic = api.hap.Characteristic;
        /**
         * Platforms should wait until the "didFinishLaunching" event has fired before
         * registering any new accessories.
         */
        api.on('didFinishLaunching', () => {
          (this.config.devices as Array<any>).forEach(deviceConfig => {
              this.discoverDevices(deviceConfig);
          });
          this.removeOldDevices();
        });
    }

    /**
     * REQUIRED - Homebridge will call the "configureAccessory" method once for every cached
     * accessory restored
     */
    configureAccessory(accessory) {
        const deviceConfig = (this.config.devices as Array<any>).filter(
          (deviceConfig) => this.api.hap.uuid.generate(deviceConfig.name + deviceConfig.host) == accessory.UUID
        );

        if (deviceConfig){
          this.log.info('Configuring accessory...', accessory.displayName);
          this.setupAccessory(accessory, deviceConfig);
        }

        this.accessories.push(accessory);
    }

    removeAccessory(accessory) {
    		this.log.info('Removing accessory...');
    		this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
  	}

    discoverDevices(deviceConfig) {
        // get the name
        const tvName = deviceConfig.name;

        // get the host
        const tvHost = deviceConfig.host;

        // generate a UUID
        const uuid = this.api.hap.uuid.generate(tvName + tvHost);

        // check the accessory was not restored from cache
        const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

        if (!existingAccessory) {
          // create a new accessory
          const tvAccessory = new this.api.platformAccessory(tvName, uuid);

          // setup the accessory
          this.setupAccessory(tvAccessory, deviceConfig);

          // publish as external accessory
          this.api.publishExternalAccessories(PLUGIN_NAME, [tvAccessory]);
        }
    }

    removeOldDevices() {
        this.log.info('Cleaning old devices...');

        // maps of devices by UUID
        const deviceUUIDMap = (this.config.devices as Array<any>).map(
          (deviceConfig) => this.api.hap.uuid.generate(deviceConfig.name + deviceConfig.host)
        );

        // remove devices that are not listed in config
        this.accessories.forEach(accessory => {

          const oldAccessory = !deviceUUIDMap.includes(accessory.UUID);

          try {
            if (oldAccessory) {
              this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
            }
          } catch(err) {
            // fallout
          }
        });

        // filter empty accessories
        this.accessories = this.accessories.filter(accessory => accessory != null);
    }

    setupAccessory(accessory, config) {
        accessory.on('identify', () => {
          this.log.info('Identify requested.', accessory.displayName);
        });

        accessory.category = this.api.hap.Categories.TELEVISION;

        let accessoryInfo = accessory.getService(this.Service.AccessoryInformation);

        const packageConf = require('../package.json');
        const version = packageConf.version;
        const manufacturer = config.manufacturer ?? this.config.manufacturer ?? MANUFACTURER;
        const model = config.model ?? PLATFORM_NAME;
        const serialNumber = config.serialNumber ?? PLATFORM_NAME;

        if (accessoryInfo) {
          accessoryInfo.setCharacteristic(this.Characteristic.Manufacturer, manufacturer);
          accessoryInfo.setCharacteristic(this.Characteristic.Model, model);
          accessoryInfo.setCharacteristic(this.Characteristic.SerialNumber, serialNumber);
          accessoryInfo.setCharacteristic(this.Characteristic.FirmwareRevision, version);
        }

        const tvAccessory = new XGimiTeleVisionAccessory(this.log, config, this.api, accessory);
        tvAccessory.getServices();
    }
}
