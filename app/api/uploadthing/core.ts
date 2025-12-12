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

const authWithParent = async () => {
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

    if (!["HEADTEACHER", "ADMIN", "TEACHER", "PARENT"].includes(userRole)) {
      return null;
    }

    return { id: userId, role: userRole };
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
};

export const ourFileRouter = {
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
    .middleware(async () => {
      const user = await auth();

      if (!user) throw new UploadThingError("Unauthorized");

      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url", file.url);
      console.log("file data:", file);

      return { 
        uploadedBy: metadata.userId,
        fileUrl: file.url 
      };
    }),

  documentUploader: f({
    pdf: { maxFileSize: "16MB", maxFileCount: 1 },
    "application/msword": { maxFileSize: "16MB", maxFileCount: 1 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { maxFileSize: "16MB", maxFileCount: 1 },
    "application/vnd.ms-excel": { maxFileSize: "16MB", maxFileCount: 1 },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { maxFileSize: "16MB", maxFileCount: 1 },
    "text/plain": { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const user = await auth();
      if (!user) throw new UploadThingError("Unauthorized");
      if (user.role !== "HEADTEACHER" && user.role !== "ADMIN") {
        throw new UploadThingError("Only administrators can upload documents");
      }
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Document upload complete for userId:", metadata.userId);
      console.log("file url", file.url);
      return { 
        uploadedBy: metadata.userId,
        fileUrl: file.url,
        fileName: file.name,
      };
    }),

  medicalDocumentUploader: f({
    pdf: { maxFileSize: "10MB", maxFileCount: 1 },
    image: { maxFileSize: "5MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const user = await authWithParent();
      if (!user) throw new UploadThingError("Unauthorized");
      return { userId: user.id, role: user.role };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Medical document upload complete for userId:", metadata.userId);
      console.log("file url", file.url);
      return { 
        uploadedBy: metadata.userId,
        fileUrl: file.url,
        fileName: file.name,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
