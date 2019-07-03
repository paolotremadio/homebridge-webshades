const debug = require('debug')('homebridge-webshades/homekit-services/window-covering');

class WindowCoveringService {
  constructor(homekitService, homekitCharacteristic, name, setPosition) {
    debug('Creating window covering service');

    this.currentPosition = null;
    this.targetPosition = null;
    this.setPositionCallback = setPosition;
    this.setPositionDelayTimer = null;

    // Homekit service
    this.service = new homekitService.WindowCovering(name);

    this.service
      .getCharacteristic(homekitCharacteristic.CurrentPosition)
      .on('get', callback => callback(null, this.getCurrentPosition()));

    this.service
      .getCharacteristic(homekitCharacteristic.TargetPosition)
      .on('get', callback => callback(null, this.getTargetPosition()))
      .on('set', this.setTargetPosition.bind(this));

    this.homekitCharacteristic = homekitCharacteristic;
  }

  getService() {
    debug('getService()');

    return this.service;
  }

  updateState({ position, targetPosition }) {
    debug('updateState()', { position, targetPosition });

    if (position !== undefined && position !== null) {
      this.currentPosition = position;
    }

    if (targetPosition !== undefined && targetPosition !== null) {
      this.targetPosition = targetPosition;
    }

    this.updateHomekitState();
  }

  updateHomekitState() {
    debug('updateHomekitState()');

    const { homekitCharacteristic } = this;

    this.service
      .getCharacteristic(homekitCharacteristic.CurrentPosition)
      .updateValue(this.getCurrentPosition());

    this.service
      .getCharacteristic(homekitCharacteristic.TargetPosition)
      .updateValue(this.getTargetPosition());
  }

  getCurrentPosition() {
    return this.currentPosition;
  }

  getTargetPosition() {
    return this.targetPosition;
  }

  setTargetPosition(position, callback) {
    debug('setTargetPosition()', { position });

    this.targetPosition = position;
    this.updateHomekitState();

    // Homekit fires every time the slide is moved.
    // Wait few seconds before actually setting the position.
    // This stops too many consecutive API requests from happening.
    clearTimeout(this.setPositionDelayTimer);
    this.setPositionDelayTimer = setTimeout(
      () => {
        debug('setTargetPosition(): firing after delay', { position });
        this.setPositionCallback(position);
      },
      4000,
    );

    callback();
  }
}

module.exports = WindowCoveringService;
