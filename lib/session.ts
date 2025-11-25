import { jwtVerify } from 'jose';

const secretKey = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'default_secret_key_change_me'
);

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload;
  } catch (error) {
    console.error('Failed to verify session:', error);
    return null;
  }
}

