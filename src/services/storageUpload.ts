import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

export async function uploadCustomFoodImage(uid: string, localUri: string) {
  const resp = await fetch(localUri);
  const blob = await resp.blob();

  const filename = `custom_foods/${uid}/${Date.now()}.jpg`;
  const storageRef = ref(storage, filename);

  await uploadBytes(storageRef, blob);
  return await getDownloadURL(storageRef);
}
