'use strict';

const { createStorageService } = require('./services/storage.js');
const { toDateKey } = require('./utils/date.js');

App({
  onLaunch() {
    this.storage = createStorageService(wx, () => toDateKey(new Date()));
    this.storage.getState();
  },
  globalData: {
    version: '7.0.0-native',
  },
});
