import { fetchSignInMethodsForEmail } from "firebase/auth";
import { auth } from "./firebase";

/**
 * return true ถ้า email ถูกใช้แล้ว
 */
export async function isEmailAlreadyInUse(email: string): Promise<boolean> {
  const methods = await fetchSignInMethodsForEmail(auth, email);
  return methods.length > 0;
}
