import imageType from 'image-type';

export function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
export function fileToArrayBuffer(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsArrayBuffer(file);
  });
}
export async function digestFileSHA256(buffer) {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}
export function readImageType(buffer) {
  if (buffer)
    return imageType(Buffer.from(buffer));
  return null;
}
export function catchAxiosError(promise) {
  return promise.catch((e) => {
    if (e.response?.status !== 404) {
      // eslint-disable-next-line no-console
      console.error(JSON.stringify(e));
      throw e;
    }
  });
}
