import QRCode from 'qrcode';

export const generateQRDataUrl = async (
  text: string,
  options?: {
    size?: number;
    color?: string;
    bgColor?: string;
  }
): Promise<string> => {
  const { size = 300, color = '#1e9e62', bgColor = '#ffffff' } = options || {};

  return QRCode.toDataURL(text, {
    width: size,
    margin: 1,
    color: {
      dark: color,
      light: bgColor,
    },
    errorCorrectionLevel: 'M',
  });
};

export const generateQRCanvas = async (
  text: string,
  canvas: HTMLCanvasElement,
  options?: {
    size?: number;
    color?: string;
    bgColor?: string;
  }
): Promise<void> => {
  const { size = 300, color = '#1e9e62', bgColor = '#ffffff' } = options || {};

  return new Promise((resolve, reject) => {
    QRCode.toCanvas(canvas, text, {
      width: size,
      margin: 1,
      color: {
        dark: color,
        light: bgColor,
      },
      errorCorrectionLevel: 'M',
    }, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};
