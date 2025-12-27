export const Camera = () => null;
export const useCameraDevice = () => null;
export const useCameraPermission = () => ({ hasPermission: false, requestPermission: async () => false });

export default {
  Camera,
  useCameraDevice,
  useCameraPermission,
};
