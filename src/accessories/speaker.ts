/**
 * v1.0.2
 *
 * @url http://github.com/fantasytu/homebridge-xgimi-tv
 * @author Fantasy Tu <f.tu@me.com>
 *
**/
'use strict';

import { MANUFACTURER, PLUGIN_NAME, PLATFORM_NAME, SIMPLE_API_PORT, COMPLEX_API_PORT, SIMPLE_APIS, COMPLEX_APIS } from '../settings';
import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';
import ping from "ping";
import { DgramAsPromised } from "dgram-as-promised";

export class XGimiTvSpeakerAccessory {
    public readonly Service: typeof Service;
    public readonly Characteristic: typeof Characteristic;

    public readonly log: Logger;
    public readonly config: PlatformConfig;
    public readonly api: API;

    public accessory: PlatformAccessory;

    private service;

    constructor(log, config, api, accessory) {
        this.log = log;
        this.config = config;
        this.api = api;
        this.accessory = accessory;

        // get service & characteristic
        this.Service = api.hap.Service;
        this.Characteristic = api.hap.Characteristic;
    }

    /**
     * REQUIRED - This must return an array of the services you want to expose.
     * This method must be named "getServices".
     */
    getServices() {

        this.service = this.accessory.getService(this.Service.Speaker);

        if(!this.service) {
          this.log.info('Adding speaker service', this.accessory.displayName + ' Speaker');
          this.service = this.accessory.addService(this.Service.Speaker, this.accessory.displayName + ' Speaker', this.accessory.displayName + ' Speaker');
        }

        if(!this.service.testCharacteristic(this.Characteristic.Volume))
        this.service.addCharacteristic(this.Characteristic.Volume);

        this.service.getCharacteristic(this.Characteristic.Mute)
          .on('set', this.switchMute.bind(this));

        this.service.getCharacteristic(this.Characteristic.Volume)
          .on('set', this.setVolume.bind(this));
    }

    getPower() {
      var that = this;

      ping.sys.probe(this.config.host, function(isAlive){
        const currentPowerStatus = isAlive ? 1 : 0;
        that.service.setCharacteristic(that.Characteristic.Active, currentPowerStatus);

        that.log.info('Getting TV Status: power status => ' + (isAlive ? 'on' : 'off'));
      });
    }

    switchMute(newValue, callback) {
      this.log.info('switch Mute : ' + newValue);

      // don't forget to callback!
      callback(null);
    }

    setVolume(newValue, callback) {
      this.log.info('set VolumeSelector => setNewValue: ' + newValue);

      // don't forget to callback!
      callback(null);
    }

    async sendMessage(api, simple_api = false) {

        var client = DgramAsPromised.createSocket('udp4');
        var host = this.config.host as string;
        var port = simple_api ? SIMPLE_API_PORT : COMPLEX_API_PORT;
        var message = Buffer.from(api, 'utf8');

        this.log.info('Sending UDP Message : ' + message);

        try {
          const pingResult = await ping.promise.probe(host, { timeout: 3 });
          if (pingResult.alive) {
            await client.send(message, port, host);
          }else{
            this.log.warn('TV is not responding...');
            (this.accessory.getService(this.Service.Television) as any).updateCharacteristic(this.Characteristic.Active, this.Characteristic.Active.INACTIVE);
          }
        } catch (error) {
            this.log.warn(error.message);
        }

    }
}
