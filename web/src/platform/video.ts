import React from 'react';

// Use HTML5 video element for web
export const Video = (props: any) => {
  return React.createElement('video', {
    src: props.source?.uri,
    controls: true,
    style: { width: '100%', height: '100%', ...props.style },
    autoPlay: props.paused === false,
    muted: props.muted,
    loop: props.repeat,
  });
};

export default Video;
