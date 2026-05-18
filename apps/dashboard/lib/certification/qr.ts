import QRCode from "qrcode";

function getPublicAppUrl() {
  const url = process.env.NEXT_PUBLIC_APP_URL;

  if (!url) {
    throw new Error("NEXT_PUBLIC_APP_URL must be set.");
  }

  return url.replace(/\/$/, "");
}

export function getVerificationUrl(slug: string): string {
  return `${getPublicAppUrl()}/verify/${slug}`;
}

export async function generateVerificationQrSvg(slug: string): Promise<string> {
  const verificationUrl = getVerificationUrl(slug);

  return QRCode.toString(verificationUrl, {
    type: "svg",
    width: 420,
    margin: 1,
    errorCorrectionLevel: "M"
  });
}
