/**
 * In-browser image compressor and resizer.
 * Generates two high-efficiency WebP blobs:
 * - thumb: max 480px, ~30-40KB (for rapid catalog grid loading)
 * - full: max 1280px, ~120-180KB (for high-detail swipe viewer)
 */

export interface CompressedPair {
  thumb: Blob;
  full: Blob;
}

function loadImage(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

function resizeToCanvas(
  img: HTMLImageElement,
  maxDimension: number
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  let { width, height } = img;

  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, width, height);

  return canvas;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas to blob conversion failed"));
      },
      "image/webp",
      quality
    );
  });
}

export async function compressImage(file: File | Blob): Promise<CompressedPair> {
  const img = await loadImage(file);

  // Generate thumbnail: max 480px, quality 0.82
  const thumbCanvas = resizeToCanvas(img, 480);
  const thumbBlob = await canvasToBlob(thumbCanvas, 0.82);

  // Generate full resolution: max 1280px, quality 0.85
  const fullCanvas = resizeToCanvas(img, 1280);
  const fullBlob = await canvasToBlob(fullCanvas, 0.85);

  return {
    thumb: thumbBlob,
    full: fullBlob,
  };
}
