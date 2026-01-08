import { useEffect, useMemo, useState } from "react";
import type { FoodBase } from "../types/food";
import { fetchPublicCatalog } from "../services/firestoreFoodCatalog";
import { subscribeCustomFoods } from "../services/firestoreCustomFoods";

export function useFoods(uid: string | null) {
  const [publicFoods, setPublicFoods] = useState<FoodBase[]>([]);
  const [customFoods, setCustomFoods] = useState<FoodBase[]>([]);
  const [loadingPublic, setLoadingPublic] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoadingPublic(true);
      const data = await fetchPublicCatalog(100);
      if (alive) setPublicFoods(data);
      setLoadingPublic(false);
    })();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!uid) return;
    const unsub = subscribeCustomFoods(uid, setCustomFoods);
    return unsub;
  }, [uid]);

  const allFoods = useMemo(() => {
    // custom มาก่อน เพื่อให้ user หาเจอง่าย
    return [...customFoods, ...publicFoods];
  }, [customFoods, publicFoods]);

  return { allFoods, publicFoods, customFoods, loadingPublic };
}
