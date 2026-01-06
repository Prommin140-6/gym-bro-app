import React, { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../types/navigation";
import { useAuth } from "../services/AuthContext";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

function mapFirebaseError(code?: string) {
  switch (code) {
    case "auth/invalid-email":
      return "อีเมลไม่ถูกต้อง";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
    case "auth/too-many-requests":
      return "ลองใหม่ภายหลัง (พยายามหลายครั้งเกินไป)";
    case "auth/network-request-failed":
      return "เน็ตมีปัญหา กรุณาลองใหม่";
    default:
      return "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่";
  }
}

export default function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const emailTrim = useMemo(() => email.trim(), [email]);
  const canSubmit = emailTrim.length > 0 && password.length >= 6 && !submitting;

  const validate = () => {
    if (!emailTrim) return "กรุณากรอกอีเมล";
    if (!emailTrim.includes("@")) return "รูปแบบอีเมลไม่ถูกต้อง";
    if (!password) return "กรุณากรอกรหัสผ่าน";
    if (password.length < 6) return "รหัสผ่านต้องอย่างน้อย 6 ตัวอักษร";
    return null;
  };

  const onSubmit = async () => {
    const v = validate();
    if (v) {
      setErrorText(v);
      return;
    }

    setSubmitting(true);
    setErrorText(null);

    try {
      await login(emailTrim, password);
      // ✅ ไม่ต้อง navigate เอง RootNavigator จะสลับไป MainTabs ให้
    } catch (e: any) {
      setErrorText(mapFirebaseError(e?.code));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="email"
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />

      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="password"
        secureTextEntry
        style={styles.input}
      />

      {errorText ? <Text style={styles.error}>{errorText}</Text> : null}

      <Pressable
        onPress={onSubmit}
        disabled={!canSubmit}
        style={[styles.button, !canSubmit && styles.buttonDisabled]}
      >
        <Text style={styles.buttonText}>{submitting ? "Signing in..." : "Login"}</Text>
      </Pressable>

      <Pressable onPress={() => navigation.navigate("Register")}>
        <Text style={styles.link}>ไปหน้า Register</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, justifyContent: "center", gap: 12 },
  title: { fontSize: 28, fontWeight: "800", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#999",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  error: { color: "#d00", marginTop: 4 },
  button: {
    backgroundColor: "#111",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: "white", fontSize: 16, fontWeight: "700" },
  link: { marginTop: 10, textAlign: "center", textDecorationLine: "underline" },
});
