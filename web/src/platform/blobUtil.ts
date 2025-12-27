export const fetch = async (url: string, options?: any): Promise<any> => {
  const response = await window.fetch(url, options);
  return {
    path: () => url,
    blob: () => response.blob(),
    text: () => response.text(),
    json: () => response.json(),
  };
};

export const base64 = async (data: Blob): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(data);
  });
};

export default {
  fetch,
  base64,
  config: () => ({ fetch }),
};
