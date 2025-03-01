// export a function that outputs the platform
import { Platform } from "react-native";

export const platformIsAndoid = () => {
  return Platform.OS === "android";
};

export const platformIsIphone = () => {
  return Platform.OS === "ios";
};
