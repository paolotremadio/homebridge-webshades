const debug = require('debug')('homebridge-webshades/homekit-services/battery');

class BatteryService {
  constructor(homekitService, homekitCharacteristic) {
    debug('Creating battery service');

    this.batteryLevel = null;

    // Homekit service
    this.service = new homekitService.BatteryService('Battery level');

    this.service
      .getCharacteristic(homekitCharacteristic.BatteryLevel)
      .on('get', callback => callback(null, this.getBatteryLevel()));

    this.service
      .getCharacteristic(homekitCharacteristic.ChargingState)
      .on('get', callback => callback(null, homekitCharacteristic.ChargingState.NOT_CHARGEABLE));

    this.service
      .getCharacteristic(homekitCharacteristic.StatusLowBattery)
      .on('get', callback => callback(null, this.getStatusLowBattery()));

    this.homekitCharacteristic = homekitCharacteristic;
  }

  getService() {
    debug('getService()');

    return this.service;
  }

  updateState({ battery }) {
    debug('updateState()', { battery });

    if (battery !== undefined && battery !== null) {
      this.batteryLevel = battery;
      this.updateHomekitState();
    }
  }

  updateHomekitState() {
    debug('updateHomekitState()');
    const { homekitCharacteristic } = this;

    this.service
      .getCharacteristic(homekitCharacteristic.BatteryLevel)
      .updateValue(this.getBatteryLevel());

    this.service
      .getCharacteristic(homekitCharacteristic.StatusLowBattery)
      .updateValue(this.getStatusLowBattery());
  }

  getBatteryLevel() {
    return this.batteryLevel;
  }

  getStatusLowBattery() {
    const { homekitCharacteristic } = this;

    if (this.batteryLevel > 20) {
      return homekitCharacteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL;
    }

    return homekitCharacteristic.StatusLowBattery.BATTERY_LEVEL_LOW;
  }
}

module.exports = BatteryService;
