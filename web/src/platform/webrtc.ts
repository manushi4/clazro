// Native WebRTC is available in browsers
export const RTCPeerConnection = (window as any).RTCPeerConnection;
export const RTCSessionDescription = (window as any).RTCSessionDescription;
export const mediaDevices = navigator.mediaDevices;

export default {
  RTCPeerConnection,
  RTCSessionDescription,
  mediaDevices,
};
