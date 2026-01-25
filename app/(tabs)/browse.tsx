import { View, Text } from "react-native";

export default function BrowseScreen() {
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: "800" }}>Browse</Text>
      <Text style={{ opacity: 0.7, marginTop: 8 }}>
        Joinable activities will be shown here.
      </Text>
    </View>
  );
}
