import React from 'react';

// Use iframe for PDF viewing on web
const Pdf = (props: any) => {
  return React.createElement('iframe', {
    src: props.source?.uri,
    style: { width: '100%', height: '100%', border: 'none', ...props.style },
  });
};

export default Pdf;
