import { useEffect, useState } from "react";
import { subscribeUserProfile, type UserProfileDoc } from "../services/firestoreProfile";

export function useUserProfile(uid: string | null) {
  const [profile, setProfile] = useState<UserProfileDoc>({ weight_kg: 66 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setProfile({ weight_kg: 66 });
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = subscribeUserProfile(uid, (p) => {
      setProfile(p);
      setLoading(false);
    });

    return unsub;
  }, [uid]);

  return { profile, loading };
}
