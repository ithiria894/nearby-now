import { View, Text } from "react-native";

export default function HistoryScreen() {
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: "800" }}>History</Text>
      <Text style={{ opacity: 0.7, marginTop: 8 }}>
        Rooms you left will be shown here.
      </Text>
    </View>
  );
}
