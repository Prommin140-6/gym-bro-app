import { Text, TextInput } from "react-native";

// ใช้ any เพื่อให้ TS ยอมรับ defaultProps (RN types รุ่นใหม่ไม่ประกาศไว้)
const RNText: any = Text;
const RNTextInput: any = TextInput;

/* ---------- Text ---------- */
RNText.defaultProps = RNText.defaultProps ?? {};
RNText.defaultProps.style = [
  RNText.defaultProps.style,
  {
    fontFamily: "Inter-Regular",
    color: "#111827", 
  },
];

/* ---------- TextInput ---------- */
RNTextInput.defaultProps = RNTextInput.defaultProps ?? {};
RNTextInput.defaultProps.style = [
  RNTextInput.defaultProps.style,
  {
    fontFamily: "Inter-Regular",
  },
];
