import { AwsClient } from "aws4fetch";

function getR2Client() {
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    throw new Error("Missing R2 credentials in environment variables");
  }

  return new AwsClient({
    accessKeyId,
    secretAccessKey,
    service: "s3",
    region: "auto",
  });
}

const R2_BUCKET = process.env.R2_BUCKET || "khanom-center";
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;

export function getR2Endpoint(): string {
  if (!R2_ACCOUNT_ID) {
    throw new Error("Missing R2_ACCOUNT_ID");
  }
  return `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
}

/**
 * Creates presigned PUT URLs for both thumb ('/t') and full ('/f') variants of an image key.
 * Valid for 15 minutes (900 seconds).
 */
export async function getPresignedUploadUrls(imageKey: string): Promise<{
  imageKey: string;
  thumbUploadUrl: string;
  fullUploadUrl: string;
}> {
  const client = getR2Client();
  const endpoint = getR2Endpoint();

  const thumbUrl = new URL(`${endpoint}/${R2_BUCKET}/${imageKey}/t`);
  thumbUrl.searchParams.set("X-Amz-Expires", "900");

  const fullUrl = new URL(`${endpoint}/${R2_BUCKET}/${imageKey}/f`);
  fullUrl.searchParams.set("X-Amz-Expires", "900");

  const thumbPresigned = await client.sign(thumbUrl.toString(), {
    method: "PUT",
    aws: { signQuery: true },
  });

  const fullPresigned = await client.sign(fullUrl.toString(), {
    method: "PUT",
    aws: { signQuery: true },
  });

  return {
    imageKey,
    thumbUploadUrl: thumbPresigned.url,
    fullUploadUrl: fullPresigned.url,
  };
}

/**
 * Deletes both variants of an image key from R2.
 */
export async function deleteImageFromR2(imageKey: string): Promise<boolean> {
  try {
    const client = getR2Client();
    const endpoint = getR2Endpoint();

    await Promise.all([
      client.fetch(`${endpoint}/${R2_BUCKET}/${imageKey}/t`, { method: "DELETE" }),
      client.fetch(`${endpoint}/${R2_BUCKET}/${imageKey}/f`, { method: "DELETE" }),
    ]);

    return true;
  } catch (error) {
    console.error(`Failed to delete image ${imageKey} from R2:`, error);
    return false;
  }
}
