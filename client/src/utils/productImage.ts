const readDataUrl = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = () => reject(new Error('Image could not be read'));
  reader.readAsDataURL(blob);
});

const render = async (image: ImageBitmap, maximum: number, quality: number): Promise<Blob> => {
  const scale = Math.min(1, maximum / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.width * scale)); canvas.height = Math.max(1, Math.round(image.height * scale));
  canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
  if (!blob) throw new Error('Image could not be compressed');
  return blob;
};

export const productImageToDataUrl = async (file: File): Promise<string> => {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Choose a JPEG, PNG, or WebP image');
  const image = await createImageBitmap(file);
  try {
    let blob = await render(image, 800, 0.82);
    if (blob.size > 350_000) blob = await render(image, 600, 0.68);
    if (blob.size > 360_000) throw new Error('Image is too detailed. Choose a smaller image');
    return await readDataUrl(blob);
  } finally { image.close(); }
};
