import React, { useMemo, useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RegisterWizardParamList } from "../../navigation/RegisterWizardStack";

import { WizardProgress } from "../../components/WizardProgress";
import { Screen } from "../../components/ui/Screen";
import { Card } from "../../components/ui/Card";
import { TextField } from "../../components/ui/TextField";
import { PrimaryButton } from "../../components/ui/PrimaryButton";

import { useOnboarding } from "../../services/OnboardingContext";
import { isEmailAlreadyInUse } from "../../services/authChecks";
import { COLORS } from "../../theme/colors";

type Props = NativeStackScreenProps<RegisterWizardParamList, "Step1Account">;

function mapFirebaseError(code?: string) {
  switch (code) {
    case "auth/invalid-email":
      return "Invalid email format";
    case "auth/network-request-failed":
      return "Network error. Please try again.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    default:
      return "Unable to check email. Please try again.";
  }
}

export default function Step1Account({ navigation }: Props) {
  const { draft, setDraft } = useOnboarding();
  const [error, setError] = useState<string | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);

  const emailTrim = useMemo(() => draft.email.trim(), [draft.email]);

  const validateLocal = () => {
    if (!emailTrim) return "Please enter your email";
    if (!emailTrim.includes("@")) return "Invalid email format";
    if (!draft.password) return "Please enter your password";
    if (draft.password.length < 6) return "Password must be at least 6 characters";
    if (draft.confirmPassword !== draft.password) return "Passwords do not match";
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
        setError("This email is already in use");
        return;
      }
      navigation.navigate("Step2BasicInfo");
    } catch (e: any) {
      setError(mapFirebaseError(e?.code));
    } finally {
      setCheckingEmail(false);
    }
  };

  return (
    <Screen>
      <View style={{ flex: 1, padding: 16, justifyContent: "center", gap: 14 }}>
        <WizardProgress step={1} total={6} />

        <View style={{ gap: 4 }}>
          <Text style={{ color: COLORS.text, fontSize: 26, fontWeight: "900" }}>
            Create Account
          </Text>
          <Text style={{ color: COLORS.subtext, fontWeight: "700" }}>
            Sign up with email and password
          </Text>
        </View>

        <Card style={{ gap: 12 }}>
          <TextField
            label="Email"
            value={draft.email}
            onChange={(t) => setDraft((d) => ({ ...d, email: t }))}
            placeholder="you@example.com"
            keyboardType="email-address"
          />

          <TextField
            label="Password"
            value={draft.password}
            onChange={(t) => setDraft((d) => ({ ...d, password: t }))}
            placeholder="••••••••"
            secureTextEntry
          />

          <TextField
            label="Confirm password"
            value={draft.confirmPassword}
            onChange={(t) => setDraft((d) => ({ ...d, confirmPassword: t }))}
            placeholder="••••••••"
            secureTextEntry
          />

          {error ? (
            <Text style={{ color: COLORS.danger, fontWeight: "800" }}>{error}</Text>
          ) : null}

          <PrimaryButton title={checkingEmail ? "Checking..." : "Next"} onPress={next} disabled={checkingEmail} />

          {checkingEmail ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, justifyContent: "center" }}>
              <ActivityIndicator />
              <Text style={{ color: COLORS.subtext, fontWeight: "700" }}>Checking email...</Text>
            </View>
          ) : null}
        </Card>

        {/* optional back to login (if you want) */}
        <Pressable onPress={() => navigation.getParent()?.goBack?.()} hitSlop={10}>
          <Text style={{ color: COLORS.subtext, textAlign: "center", textDecorationLine: "underline" }}>
            Back to Login
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
