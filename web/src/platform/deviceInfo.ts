// Web stub for react-native-device-info
export default {
  getVersion: () => '1.0.0',
  getBuildNumber: () => '1',
  getUniqueId: () => 'web-device',
  getDeviceId: () => 'web',
  getSystemName: () => 'Web',
  getSystemVersion: () => navigator.userAgent,
  getBrand: () => 'Browser',
  getModel: () => navigator.platform,
  isTablet: () => false,
  getApplicationName: () => 'ManushiCoaching',
  getBundleId: () => 'com.manushicoaching.web',
  getDeviceName: () => Promise.resolve('Web Browser'),
  getUserAgent: () => Promise.resolve(navigator.userAgent),
};
