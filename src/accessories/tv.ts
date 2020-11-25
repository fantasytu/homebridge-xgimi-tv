/**
 * v1.0
 *
 * @url http://github.com/fantasytu/homebridge-xgimi-tv
 * @author Fantasy Tu <f.tu@me.com>
 *
**/
'use strict';

import { MANUFACTURER, PLUGIN_NAME, PLATFORM_NAME, SIMPLE_API_PORT, COMPLEX_API_PORT, SIMPLE_APIS, COMPLEX_APIS } from '../settings';
import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';
import ping from "ping";
import dgram from 'dgram';

export class XGimiTeleVisionAccessory {
    public readonly Service: typeof Service;
    public readonly Characteristic: typeof Characteristic;

    public readonly log: Logger;
    public readonly config: PlatformConfig;
    public readonly api: API;

    public accessory: PlatformAccessory;

    private tvService;
    private speakerService;
    private homeScreenInputSource;
    private inputResources;

    constructor(log, config, api, accessory) {
        this.log = log;
        this.config = config;
        this.api = api;
        this.accessory = accessory;
        this.inputResources = [];

        // get service & characteristic
        this.Service = api.hap.Service;
        this.Characteristic = api.hap.Characteristic;
    }

    /**
     * REQUIRED - This must return an array of the services you want to expose.
     * This method must be named "getServices".
     */
    getServices() {

      this.tvService = this.accessory.getService(this.Service.Television);
      this.speakerService = this.accessory.getService(this.Service.TelevisionSpeaker);

        if(!this.tvService) {
          this.log.info('Adding tv service', this.accessory.displayName);
          this.createTvService();
        }

        if(!this.speakerService){
          this.log.info('Adding speaker service', this.accessory.displayName);
          this.createSpeakerService();
        }

        this.createInputSourceService();

        this.getTvStatus();
    }

    /**
     * Create TV Service
     */

    createTvService() {
      // get the name
      const tvName = this.config.name || 'XGimi TV';

      // add the tv service
      this.tvService = this.accessory.addService(this.Service.Television);

      // set the tv name
      this.tvService.setCharacteristic(this.Characteristic.ConfiguredName, tvName);

      // set sleep discovery characteristic
      this.tvService.setCharacteristic(this.Characteristic.SleepDiscoveryMode, this.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE);

      // set active identifier characteristic
      this.tvService.setCharacteristic(this.Characteristic.ActiveIdentifier, 0);

      // handle on / off events using the Active characteristic
      this.tvService.getCharacteristic(this.Characteristic.Active)
        .on('set', this.setPower.bind(this));

      // handle input source changes
      this.tvService.getCharacteristic(this.Characteristic.ActiveIdentifier)
        .on('set', this.setInputResource.bind(this));

      // handle remote control input
      this.tvService.getCharacteristic(this.Characteristic.RemoteKey)
        .on('set', this.setRemoteKey.bind(this));

      // this.tvService.getCharacteristic(this.Characteristic.PowerModeSelection)
      //   .on('set', this.setRemoteKey.bind(this, 'SETTINGS'));
    }

    /**
     * Create a speaker service to allow volume control
     */

    createSpeakerService() {
        this.speakerService = this.accessory.addService(this.Service.TelevisionSpeaker);

        this.speakerService
          .setCharacteristic(this.Characteristic.Active, this.Characteristic.Active.ACTIVE)
          .setCharacteristic(this.Characteristic.VolumeControlType, this.Characteristic.VolumeControlType.ABSOLUTE);

        // handle volume control
        this.speakerService.getCharacteristic(this.Characteristic.VolumeSelector)
          .on('set', this.setVolume.bind(this));
    }

    /**
     * Create TV Input Source Services
     * These are the inputs the user can select from.
     * When a user selected an input the corresponding Identifier Characteristic
     * is sent to the TV Service ActiveIdentifier Characteristic handler.
     */
    createInputSourceService() {
      var homeScreenInput = {
        "name"    : "Home Screen",
        "type"    : "HOME_SCREEN",
      };

      this.inputResources = [homeScreenInput, ...(this.config.inputs as Array<any>)];

      (this.inputResources as Array<any>).forEach((input, identifier) => {
        var name = input.name;
        var id = name.replace(/\s+/g, '').toLowerCase();
        var type = eval(`this.Characteristic.InputSourceType.${input.type}`);

        var inputSource = this.accessory.addService(this.Service.InputSource, id, name);
        inputSource = this.configInputSource(inputSource, name, identifier, type);

        this.tvService.addLinkedService(inputSource);
      });
    }

    configInputSource(inputSource, name, identifier, type) {

        return inputSource
                .setCharacteristic(this.Characteristic.Identifier, identifier)
                .setCharacteristic(this.Characteristic.ConfiguredName, name)
                .setCharacteristic(this.Characteristic.IsConfigured, this.Characteristic.IsConfigured.CONFIGURED)
                .setCharacteristic(this.Characteristic.InputSourceType, type);

    }

    getTvStatus() {
      this.log.info('Getting TV Status');
      this.getPower();
    }

    getPower() {
      var that = this;

      ping.sys.probe(this.config.host, function(isAlive){
        const currentPowerStatus = isAlive ? 1 : 0;
        that.tvService.setCharacteristic(that.Characteristic.Active, currentPowerStatus);

        that.log.info('Getting TV Status: power status => ' + (isAlive ? 'on' : 'off'));
      });
    }

    setPower(newValue, callback) {
      this.tvService.updateCharacteristic(this.Characteristic.Active, newValue);

      switch (newValue) {
        case this.Characteristic.Active.INACTIVE:
          this.sendMessage(COMPLEX_APIS['off']);
          this.log.info('Turning Off Tv');
          break;
        case this.Characteristic.Active.ACTIVE:
          this.sendMessage(COMPLEX_APIS['on']);
          this.log.info('Turning On Tv');
          break;
        default:
          break;
      }

      // don't forget to callback!
      callback(null);
    }

    async setInputResource(newValue, callback) {
      let powerStatus = (this.accessory.getService(this.Service.Television) as any).getCharacteristic(this.Characteristic.Active).value;

      // triggering waking up tv
      callback(null);

      if (!powerStatus) {
        this.log.info('Wait for TV turning on before send command..');
        await this.timeout(2000);
      }

      if (newValue == 0) {
          this.sendMessage(SIMPLE_APIS[this.Characteristic.RemoteKey.EXIT], true);
      }else{
          var inputSource = this.inputResources[newValue];

          if (inputSource.type === "APPLICATION" && inputSource.package) {
              this.sendMessage(COMPLEX_APIS['app'](inputSource.package));
          }
      }
      this.log.info('set Input Resource: ' + this.inputResources[newValue].name);
    }

    async setRemoteKey(newValue, callback) {
      let powerStatus = (this.accessory.getService(this.Service.Television) as any).getCharacteristic(this.Characteristic.Active).value;

      // triggering waking up tv
      callback(null);

      if (!powerStatus) {
        this.log.info('Wait for TV turning on before send command..');
        await this.timeout(2000);
      }

      if (SIMPLE_APIS[newValue]) {
        let api = SIMPLE_APIS[newValue];
        this.sendMessage(api, true);
      };

      this.log.info('set Remote Key Pressed: ' + newValue);
    }

    async setVolume(newValue, callback) {
      let powerStatus = (this.accessory.getService(this.Service.Television) as any).getCharacteristic(this.Characteristic.Active).value;

      // triggering waking up tv
      callback(null);

      if (!powerStatus) {
        this.log.info('Wait for TV turning on before send command..');
        await this.timeout(2000);
      }

      this.log.info('set VolumeSelector => setNewValue: ' + newValue);
    }

    sendMessage(api, simple_api = false) {

        var client = dgram.createSocket('udp4');
        var host = this.config.host as string;
        var port = simple_api ? SIMPLE_API_PORT : COMPLEX_API_PORT;
        var message = Buffer.from(api, 'utf8');
        var that = this;

        that.log.info('Sending UDP Message : ' + message);

        Promise.resolve(client.connect(port, host))
          .then((res) => { client.send(message) })
          .then((res) => { client.close() })
          .catch((err: any) => {
              if(err.code == 'EHOSTUNREACH' || err.code == 'EHOSTDOWN'){
                  that.log.warn('TV is not responding...');
                  that.getPower();
              }else{
                  that.log.warn('Error occured when sending message to tv');
              }
          });
    }

    timeout(ms) {
      return new Promise((res) => setTimeout(res, ms));
    }
}
