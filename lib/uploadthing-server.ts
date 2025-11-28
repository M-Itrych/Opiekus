import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export function extractFileKey(url: string): string | null {
  try {
    const utfsMatch = url.match(/utfs\.io\/f\/([a-zA-Z0-9_-]+)/);
    if (utfsMatch) return utfsMatch[1];

    const ufsMatch = url.match(/\.ufs\.sh\/f\/([a-zA-Z0-9_-]+)/);
    if (ufsMatch) return ufsMatch[1];

    const uploadthingMatch = url.match(/uploadthing\.com\/([a-zA-Z0-9_-]+)/);
    if (uploadthingMatch) return uploadthingMatch[1];

    return null;
  } catch {
    return null;
  }
}

export async function deleteFileFromUploadThing(url: string): Promise<boolean> {
  try {
    const fileKey = extractFileKey(url);
    if (!fileKey) {
      console.warn("Could not extract file key from URL:", url);
      return false;
    }

    await utapi.deleteFiles(fileKey);
    return true;
  } catch (error) {
    console.error("Error deleting file from UploadThing:", error);
    return false;
  }
}

export async function deleteFilesFromUploadThing(urls: string[]): Promise<number> {
  const fileKeys: string[] = [];

  for (const url of urls) {
    const key = extractFileKey(url);
    if (key) fileKeys.push(key);
  }

  if (fileKeys.length === 0) return 0;

  try {
    await utapi.deleteFiles(fileKeys);
    return fileKeys.length;
  } catch (error) {
    console.error("Error deleting files from UploadThing:", error);
    return 0;
  }
}
