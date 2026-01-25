import { View, Text } from "react-native";

export default function CreatedScreen() {
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: "800" }}>Created</Text>
      <Text style={{ opacity: 0.7, marginTop: 8 }}>
        Activities you created will be shown here.
      </Text>
    </View>
  );
}
