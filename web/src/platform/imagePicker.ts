interface ImagePickerResponse {
  assets?: Array<{
    uri: string;
    fileName: string;
    type: string;
    fileSize: number;
  }>;
  didCancel?: boolean;
  errorCode?: string;
  errorMessage?: string;
}

export const launchImageLibrary = (options?: any): Promise<ImagePickerResponse> => {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = options?.selectionLimit > 1;

    input.onchange = (event: any) => {
      const files = Array.from(event.target.files || []) as File[];
      if (files.length === 0) {
        resolve({ didCancel: true });
        return;
      }

      const assets = files.map(file => ({
        uri: URL.createObjectURL(file),
        fileName: file.name,
        type: file.type,
        fileSize: file.size,
      }));

      resolve({ assets });
    };

    input.oncancel = () => resolve({ didCancel: true });
    input.click();
  });
};

export const launchCamera = (): Promise<ImagePickerResponse> => {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';

    input.onchange = (event: any) => {
      const files = Array.from(event.target.files || []) as File[];
      if (files.length === 0) {
        resolve({ didCancel: true });
        return;
      }

      const file = files[0];
      resolve({
        assets: [{
          uri: URL.createObjectURL(file),
          fileName: file.name,
          type: file.type,
          fileSize: file.size,
        }],
      });
    };

    input.click();
  });
};

export default { launchImageLibrary, launchCamera };
