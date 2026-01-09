import React, { useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../types/navigation";

import { Screen } from "../components/ui/Screen";
import { Card } from "../components/ui/Card";
import { TextField } from "../components/ui/TextField";
import { PrimaryButton } from "../components/ui/PrimaryButton";

import { useAuth } from "../services/AuthContext";
import { COLORS } from "../theme/colors";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

function mapFirebaseError(code?: string) {
  switch (code) {
    case "auth/invalid-email":
      return "Invalid email";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect email or password";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    case "auth/network-request-failed":
      return "Network error. Please try again.";
    default:
      return "Sign in failed. Please try again.";
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
    if (!emailTrim) return "Please enter your email";
    if (!emailTrim.includes("@")) return "Invalid email format";
    if (!password) return "Please enter your password";
    if (password.length < 6) return "Password must be at least 6 characters";
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
      // RootNavigator จะสลับไป MainTabs ให้เอง
    } catch (e: any) {
      setErrorText(mapFirebaseError(e?.code));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <View style={{ flex: 1, padding: 16, justifyContent: "center", gap: 14 }}>
        {/* Header */}
        <View style={{ gap: 6, marginBottom: 6 }}>
          <Text style={{ color: COLORS.text, fontSize: 30, fontWeight: "900" }}>
            Welcome to GymBroApp
          </Text>
          <Text style={{ color: COLORS.subtext, fontWeight: "700" }}>
            Sign in to continue
          </Text>
        </View>

        {/* Form card */}
        <Card style={{ gap: 12 }}>
          <TextField
            label="Email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
          />

          <TextField
            label="Password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            secureTextEntry
          />

          {errorText ? (
            <View
              style={{
                borderWidth: 1,
                borderColor: "rgba(255,77,77,0.35)",
                backgroundColor: "rgba(255,77,77,0.08)",
                padding: 10,
                borderRadius: 12,
              }}
            >
              <Text style={{ color: COLORS.danger, fontWeight: "800" }}>
                {errorText}
              </Text>
            </View>
          ) : null}

          <PrimaryButton
            title={submitting ? "Signing in..." : "Login"}
            onPress={onSubmit}
            disabled={!canSubmit}
          />

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: COLORS.border, opacity: 0.9 }} />

          <Pressable
            onPress={() => navigation.navigate("Register")}
            style={styles.linkBtn}
            hitSlop={10}
          >
            <Text style={styles.linkText}>
              Don&apos;t have an account?{" "}
              <Text style={{ color: COLORS.primary, fontWeight: "900" }}>
                Create one
              </Text>
            </Text>
          </Pressable>
        </Card>

        {/* Small footer */}
        <Text style={{ color: COLORS.subtext, textAlign: "center", fontWeight: "700" }}>
          Gym Bro • Nutrition Tracker
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  linkBtn: {
    alignItems: "center",
    paddingVertical: 6,
  },
  linkText: {
    color: COLORS.subtext,
    fontWeight: "800",
  },
});
