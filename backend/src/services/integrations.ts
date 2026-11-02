import crypto from 'node:crypto';

const cloudinaryReady = () => Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
export async function persistImages(images: string[]) {
  if (!cloudinaryReady()) return images;
  const output: string[] = [];
  for (const image of images) {
    if (!image.startsWith('data:image/')) { output.push(image); continue; }
    const form = new FormData();
    form.append('file', image);
    form.append('api_key', process.env.CLOUDINARY_API_KEY!);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    form.append('timestamp', timestamp);
    const signature = crypto.createHash('sha1').update(`timestamp=${timestamp}${process.env.CLOUDINARY_API_SECRET}`).digest('hex');
    form.append('signature', signature);
    const response = await fetch(`https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: form });
    if (!response.ok) throw new Error('Cloudinary upload failed');
    const payload = await response.json() as { secure_url?: string };
    if (payload.secure_url) output.push(payload.secure_url);
  }
  return output;
}

export const razorpayReady = () => Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
export async function createRazorpayOrder(amount: number, receipt: string) {
  if (!razorpayReady()) return null;
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
  const response = await fetch('https://api.razorpay.com/v1/orders', { method: 'POST', headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: Math.round(amount * 100), currency: 'INR', receipt, payment_capture: 1 }) });
  if (!response.ok) throw new Error('Razorpay order creation failed');
  return response.json() as Promise<{ id: string; amount: number; currency: string; status: string }>;
}
export async function verifyRazorpayPayment(orderId: string, paymentId: string, signature: string) {
  if (!razorpayReady()) throw new Error('Razorpay credentials are not configured');
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!).update(`${orderId}|${paymentId}`).digest('hex');
  const expectedBytes = Buffer.from(expected); const signatureBytes = Buffer.from(signature);
  if (expectedBytes.length !== signatureBytes.length || !crypto.timingSafeEqual(expectedBytes, signatureBytes)) throw new Error('Invalid Razorpay signature');
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
  const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, { headers: { Authorization: `Basic ${auth}` } });
  if (!response.ok) throw new Error('Razorpay payment lookup failed');
  const payment = await response.json() as { status?: string; order_id?: string };
  if (payment.order_id !== orderId || !['captured', 'authorized'].includes(payment.status || '')) throw new Error('Payment has not been captured');
  return payment;
}
