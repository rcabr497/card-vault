export function cropImageToRatio(file: File, ratio: number, outputWidth = 750): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      let sx: number, sy: number, sw: number, sh: number;
      if (iw / ih > ratio) {
        sh = ih;
        sw = ih * ratio;
        sx = (iw - sw) / 2;
        sy = 0;
      } else {
        sw = iw;
        sh = iw / ratio;
        sx = 0;
        sy = (ih - sh) / 2;
      }

      const canvas = document.createElement("canvas");
      canvas.width = outputWidth;
      canvas.height = outputWidth / ratio;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Canvas not supported."));
        return;
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (blob) resolve(blob);
          else reject(new Error("Crop failed."));
        },
        "image/jpeg",
        0.92
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Couldn't load image."));
    };
    img.src = url;
  });
}

export const TCG_CARD_RATIO = 2.5 / 3.5;
