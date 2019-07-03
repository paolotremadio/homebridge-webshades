const debug = require('debug')('homebridge-webshades');

const HttpApi = require('./api');
const AdapterWebshades = require('./adapters/webshades');
const HomekitServiceWindowCovering = require('./homekit-services/window-covering');
const HomekitServiceBattery = require('./homekit-services/battery');

let Service;
let Characteristic;

/**
 * About WindowCover position: 100 is fully open, 0 is fully closed
 */
class HomebridgeWebshades {
  constructor(log, config) {
    this.log = log;
    this.name = config.name;


    // Pick adapter
    const { adapter, adapterConfig } = config;

    switch (adapter) {
      case 'webshades':
        this.adapter = new AdapterWebshades(adapterConfig);
        break;

      default:
        throw new Error('Adapter unknown');
    }


    // Set internal state
    this.lastState = null;
    this.statusPollTimer = null;

    // Initialise Services
    this.windowCoveringService = new HomekitServiceWindowCovering(
      Service,
      Characteristic,
      this.name,
      this.setPosition.bind(this),
    );

    this.batteryService = new HomekitServiceBattery(
      Service,
      Characteristic,
    );


    // Poll for status and start timer
    debug('constructor(): poll for status');
    this.pollForStatus();


    // Start APIs
    if (config.api) {
      HttpApi(
        config.api.host,
        config.api.port,
        {
          getStatus: async () => this.lastState,
          setPosition: async position => this.setPosition(position),
        },
      );
    }
  }

  getServices() {
    return [
      this.windowCoveringService.getService(),
      this.adapter.hasBatteryService() ? this.batteryService.getService() : null,
    ].filter(el => el);
  }

  updateState(state) {
    debug('updateState(): current state is:', this.lastState);
    debug('updateState(): requested state is:', state);

    this.lastState = { ...this.lastState, ...state };

    let { position, targetPosition } = this.lastState;

    if (position !== undefined && position !== null) {
      // Set current position as default target
      if (targetPosition === undefined || targetPosition === null) {
        targetPosition = position;
      }

      // If current position is within TOLERANCE from TARGET, use TARGET
      const positionDifference = Math.abs(targetPosition - position);
      if (positionDifference <= this.adapter.getCurrentPositionTolerancePercentage()) {
        position = targetPosition;
      }
    }

    this.lastState = { ...this.lastState, position, targetPosition };
    debug('updateState(): applied state:', this.lastState);

    this.windowCoveringService.updateState(this.lastState);
    this.batteryService.updateState(this.lastState);
  }

  async setPosition(position) {
    debug('setPosition()', { position });
    this.log('Setting position', { position });

    this.updateState({ position, targetPosition: position });

    try {
      // Set position
      await this.adapter.setPosition(position);

      // Reset polling timer, wait a full interval (as the position has just changed)
      this.scheduleNextPollForStatus();

      debug('setPosition(): success');
    } catch (error) {
      this.log('Error in setting position', error.toString());
      debug('setPosition(): failed', error);
    }
  }

  async pollForStatus() {
    debug('pollForStatus()');

    try {
      const status = await this.adapter.getStatus();
      debug('pollForStatus(): success', status);
      this.updateState(status);
    } catch (error) {
      this.log('Could not update state.', error.toString());
      debug('pollForStatus(): failed', error);
    }

    this.scheduleNextPollForStatus();
  }

  scheduleNextPollForStatus() {
    debug('scheduleNextPollForStatus(): resetting timer and schedule again');

    clearTimeout(this.statusPollTimer);
    setTimeout(
      () => {
        debug('scheduleNextPollForStatus(): timer is up, poll for status');
        this.pollForStatus();
      },
      this.adapter.getPollingMs(),
    );
  }
}

module.exports = (homebridge) => {
  Service = homebridge.hap.Service; // eslint-disable-line
  Characteristic = homebridge.hap.Characteristic; // eslint-disable-line
  homebridge.registerAccessory('homebridge-webshades', 'Webshades', HomebridgeWebshades);
};
