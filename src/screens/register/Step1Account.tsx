import React, { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RegisterWizardParamList } from "../../navigation/RegisterWizardStack";
import { WizardProgress } from "../../components/WizardProgress";
import { useOnboarding } from "../../services/OnboardingContext";
import { isEmailAlreadyInUse } from "../../services/authChecks";

type Props = NativeStackScreenProps<RegisterWizardParamList, "Step1Account">;

function mapFirebaseError(code?: string) {
  switch (code) {
    case "auth/invalid-email":
      return "รูปแบบอีเมลไม่ถูกต้อง";
    case "auth/network-request-failed":
      return "เน็ตมีปัญหา กรุณาลองใหม่";
    case "auth/too-many-requests":
      return "ลองใหม่ภายหลัง (พยายามหลายครั้งเกินไป)";
    default:
      return "ตรวจสอบอีเมลไม่สำเร็จ กรุณาลองใหม่";
  }
}

export default function Step1Account({ navigation }: Props) {
  const { draft, setDraft } = useOnboarding();
  const [error, setError] = useState<string | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);

  const emailTrim = useMemo(() => draft.email.trim(), [draft.email]);

  const validateLocal = () => {
    if (!emailTrim) return "กรุณากรอกอีเมล";
    if (!emailTrim.includes("@")) return "รูปแบบอีเมลไม่ถูกต้อง";
    if (!draft.password) return "กรุณากรอกรหัสผ่าน";
    if (draft.password.length < 6) return "รหัสผ่านต้องอย่างน้อย 6 ตัวอักษร";
    if (draft.confirmPassword !== draft.password) return "รหัสผ่านไม่ตรงกัน";
    return null;
  };

  const next = async () => {
    const v = validateLocal();
    if (v) {
      setError(v);
      return;
    }

    setCheckingEmail(true);
    setError(null);

    try {
      const used = await isEmailAlreadyInUse(emailTrim);
      if (used) {
        setError("อีเมลนี้ถูกใช้งานแล้ว");
        return;
      }
      navigation.navigate("Step2BasicInfo");
    } catch (e: any) {
      setError(mapFirebaseError(e?.code));
    } finally {
      setCheckingEmail(false);
    }
  };

  const canNext = !checkingEmail;

  return (
    <View style={{ flex: 1, padding: 16, justifyContent: "center", gap: 10 }}>
      <WizardProgress step={1} total={6} />
      <Text style={{ fontSize: 24, fontWeight: "800" }}>Create Account</Text>

      <TextInput
        placeholder="email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={draft.email}
        onChangeText={(t) => setDraft((d) => ({ ...d, email: t }))}
        style={input}
      />
      <TextInput
        placeholder="password"
        secureTextEntry
        value={draft.password}
        onChangeText={(t) => setDraft((d) => ({ ...d, password: t }))}
        style={input}
      />
      <TextInput
        placeholder="confirm password"
        secureTextEntry
        value={draft.confirmPassword}
        onChangeText={(t) => setDraft((d) => ({ ...d, confirmPassword: t }))}
        style={input}
      />

      {error ? <Text style={{ color: "#d00" }}>{error}</Text> : null}

      <Pressable onPress={next} style={[btn, !canNext && { opacity: 0.5 }]} disabled={!canNext}>
        {checkingEmail ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <ActivityIndicator />
            <Text style={btnText}>Checking...</Text>
          </View>
        ) : (
          <Text style={btnText}>Next</Text>
        )}
      </Pressable>
    </View>
  );
}

const input = {
  borderWidth: 1,
  borderColor: "#999",
  borderRadius: 10,
  paddingHorizontal: 12,
  paddingVertical: 12,
  fontSize: 16,
} as const;

const btn = { backgroundColor: "#111", padding: 14, borderRadius: 12, alignItems: "center" } as const;
const btnText = { color: "white", fontWeight: "700" } as const;
