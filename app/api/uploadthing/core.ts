import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/session";

const f = createUploadthing();

const auth = async () => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) {
      return null;
    }

    const payload = await verifyToken(token);
    
    if (!payload) {
      return null;
    }

    const userRole = payload.role as string;
    const userId = payload.id as string;

    if (userRole !== "HEADTEACHER" && userRole !== "ADMIN" && userRole !== "TEACHER") {
      return null;
    }

    return { id: userId, role: userRole };
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
};

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({
    image: {
      /**
       * For full list of options and defaults, see the File Route API reference
       * @see https://docs.uploadthing.com/file-routes#route-config
       */
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    // Set permissions and file types for this FileRoute
    .middleware(async () => {
      // This code runs on your server before upload
      const user = await auth();

      // If you throw, the user will not be able to upload
      if (!user) throw new UploadThingError("Unauthorized");

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url", file.url);
      console.log("file data:", file);

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      // The file.url is automatically included in the response, but we can add metadata
      return { 
        uploadedBy: metadata.userId,
        fileUrl: file.url 
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
