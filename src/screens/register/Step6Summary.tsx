import React, { useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RegisterWizardParamList } from "../../navigation/RegisterWizardStack";
import { WizardProgress } from "../../components/WizardProgress";
import { useOnboarding } from "../../services/OnboardingContext";
import { useAuth } from "../../services/AuthContext";
import { db } from "../../services/firebase";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import {
  activityMultiplier,
  calcBMR,
  calcBMI,
  calcTDEE,
  healthAdviceThai,
  recommendedCalories,
} from "../../utils/healthCalc";

type Props = NativeStackScreenProps<RegisterWizardParamList, "Step6Summary">;

function mapFirebaseError(code?: string) {
  switch (code) {
    case "auth/email-already-in-use":
      return "อีเมลนี้ถูกใช้งานแล้ว";
    case "auth/invalid-email":
      return "อีเมลไม่ถูกต้อง";
    case "auth/weak-password":
      return "รหัสผ่านอ่อนเกินไป (อย่างน้อย 6 ตัวอักษร)";
    case "auth/network-request-failed":
      return "เน็ตมีปัญหา กรุณาลองใหม่";
    default:
      return "สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่";
  }
}

export default function Step6Summary({ navigation }: Props) {
  const { draft, reset } = useOnboarding();
  const { register } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsed = useMemo(() => {
    // assume validate มาแล้วจาก steps ก่อนหน้า
    const sex = draft.sex!;
    const heightCm = Number(draft.heightCm);
    const weightKg = Number(draft.weightKg);
    const age = Number(draft.age);
    const bodyFatPercent = draft.bodyFatPercent!;
    const exerciseStyle = draft.exerciseStyle!;
    const goal = draft.goal!;

    const bmi = calcBMI(heightCm, weightKg);
    const bmr = calcBMR(sex, heightCm, weightKg, age);
    const mult = activityMultiplier(exerciseStyle);
    const tdee = calcTDEE(bmr, mult);
    const cal = recommendedCalories(tdee, goal);
    const advice = healthAdviceThai({ bmi, goal, exerciseStyle });

    return { sex, heightCm, weightKg, age, bodyFatPercent, exerciseStyle, goal, bmi, bmr, tdee, cal, mult, advice };
  }, [draft]);

  const onFinish = async () => {
    setSubmitting(true);
    setError(null);

    try {
      // 1) create auth user
      const email = draft.email.trim();
      const password = draft.password;
      await register(email, password);

      // 2) after register, auth currentUser should exist
      // (ถ้าอยากชัวร์สุด ใช้ import { auth } แล้วอ่าน auth.currentUser)
      // แต่เราจะอ่านจาก firebase/auth getAuth(app) ก็ได้
      const { getAuth } = await import("firebase/auth");
      const { app } = await import("../../services/firebase");
      const user = getAuth(app).currentUser;

      if (!user) throw new Error("NO_USER");

      // 3) save to firestore users/{uid}
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),

        sex: parsed.sex,
        heightCm: parsed.heightCm,
        weightKg: parsed.weightKg,
        age: parsed.age,

        bodyFatPercent: parsed.bodyFatPercent,
        exerciseStyle: parsed.exerciseStyle,
        activityMultiplier: parsed.mult,
        goal: parsed.goal,

        bmi: parsed.bmi,
        bmr: parsed.bmr,
        tdee: parsed.tdee,
        caloriesRecommended: parsed.cal,

        onboardingCompleted: true,
      });

      // 4) reset draft + go back to auth stack root
      reset();
      // RootNavigator จะสลับไป MainTabs เองเพราะ user login แล้ว
    } catch (e: any) {
      if (e?.message === "NO_USER") setError("สมัครสำเร็จแต่ไม่พบผู้ใช้ กรุณาลองใหม่");
      else setError(mapFirebaseError(e?.code));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <WizardProgress step={6} total={6} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text style={{ fontSize: 24, fontWeight: "800" }}>Summary</Text>

        <Card label="BMI" value={`${parsed.bmi}`} />
        <Card label="BMR (Mifflin-St Jeor)" value={`${parsed.bmr} kcal/day`} />
        <Card label="TDEE" value={`${parsed.tdee} kcal/day`} />
        <Card label="แนะนำแคล/วัน" value={`${parsed.cal} kcal/day`} />

        <View style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 14, padding: 12, gap: 8 }}>
          <Text style={{ fontWeight: "800" }}>คำแนะนำ</Text>
          <Text style={{ lineHeight: 20 }}>{parsed.advice}</Text>
        </View>

        {error ? <Text style={{ color: "#d00" }}>{error}</Text> : null}

        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable onPress={() => navigation.goBack()} style={[btn, ghost]} disabled={submitting}>
            <Text style={[btnText, { color: "#111" }]}>Back</Text>
          </Pressable>
          <Pressable onPress={onFinish} style={[btn, { flex: 1 }]} disabled={submitting}>
            <Text style={btnText}>{submitting ? "Saving..." : "Finish"}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 14, padding: 12 }}>
      <Text style={{ fontWeight: "800" }}>{label}</Text>
      <Text style={{ marginTop: 6, fontSize: 16 }}>{value}</Text>
    </View>
  );
}

const btn = { flex: 1, backgroundColor: "#111", padding: 14, borderRadius: 12, alignItems: "center" } as const;
const ghost = { backgroundColor: "transparent", borderWidth: 1, borderColor: "#111" } as const;
const btnText = { color: "white", fontWeight: "700" } as const;
