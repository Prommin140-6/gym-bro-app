import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

/**
 * Upload profile photo and return downloadURL
 * - path: profile_photos/{uid}.jpg
 * - overwrite old photo safely
 */
export async function uploadProfilePhoto(
  uid: string,
  localUri: string
): Promise<string> {
  // แปลง local uri → blob
  const res = await fetch(localUri);
  const blob = await res.blob();

  const photoRef = ref(storage, `profile_photos/${uid}.jpg`);
  await uploadBytes(photoRef, blob, {
    contentType: "image/jpeg",
  });

  const url = await getDownloadURL(photoRef);
  return url;
}
