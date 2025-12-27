// Web Push can be implemented here
// For now, providing no-op implementation

const messaging = () => ({
  getToken: async () => null,
  onMessage: () => () => {},
  onNotificationOpenedApp: () => () => {},
  setBackgroundMessageHandler: () => {},
  getInitialNotification: async () => null,
  requestPermission: async () => 1, // Authorized
});

export default messaging;
