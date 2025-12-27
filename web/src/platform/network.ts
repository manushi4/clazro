// Web stub for @react-native-community/netinfo

export type NetInfoStateType =
  | 'unknown'
  | 'none'
  | 'wifi'
  | 'cellular'
  | 'bluetooth'
  | 'ethernet'
  | 'wimax'
  | 'vpn'
  | 'other';

export interface NetInfoState {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  type: NetInfoStateType;
  details: null;
}

type NetInfoListener = (state: NetInfoState) => void;

const getState = (): NetInfoState => ({
  isConnected: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isInternetReachable: typeof navigator !== 'undefined' ? navigator.onLine : true,
  type: (typeof navigator !== 'undefined' && navigator.onLine) ? 'wifi' : 'none',
  details: null,
});

const addEventListener = (listener: NetInfoListener) => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleOnline = () => listener(getState());
  const handleOffline = () => listener(getState());

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Call listener with initial state
  setTimeout(() => listener(getState()), 0);

  // Return unsubscribe function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

const fetch = (): Promise<NetInfoState> => Promise.resolve(getState());

const NetInfo = {
  addEventListener,
  fetch,
};

export default NetInfo;
