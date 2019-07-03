const axios = require('axios');
const debug = require('debug')('homebridge-webshades/adapter/webshades');

class WebshadesAdapter {
  constructor({ baseUrl, deviceId }) {
    debug(`Using "webshades" adapter - ${baseUrl} - ${deviceId}`);

    this.baseUrl = baseUrl;
    this.deviceId = deviceId;

    this.pollingMs = 300000; // 5 minutes
    this.tolerancePercentage = 5; // 5%
    this.batteryService = true;

    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 15000,
    });
  }

  getPollingMs() {
    return this.pollingMs;
  }

  hasBatteryService() {
    return this.batteryService;
  }

  getCurrentPositionTolerancePercentage() {
    return this.tolerancePercentage;
  }

  async getStatus() {
    debug('getStatus()');

    const response = await this.client.get('/status', { deviceId: this.deviceId });

    const { success, status } = response.data;

    if (!success) {
      debug('getStatus(): failed');
      throw new Error('Request failed');
    }

    debug('getStatus(): success', status);
    return status;
  }

  async setPosition(position) {
    debug('setPosition()', { position });

    const response = await this
      .client
      .post(
        '/position',
        {
          deviceId: this.deviceId,
          position,
        },
      );

    const { success } = response.data;

    if (!success) {
      debug('setPosition(): failed');
      throw new Error('Request failed');
    }

    debug('setPosition(): success');
    return true;
  }
}

module.exports = WebshadesAdapter;
