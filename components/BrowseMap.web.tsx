import { Pressable, Text, View } from "react-native";
import type { ActivityCardActivity } from "./ActivityCard";

type Props = {
  items: ActivityCardActivity[];
  onPressCard: (activity: ActivityCardActivity) => void;
  onRequestList?: () => void;
};

export default function BrowseMap({ onRequestList }: Props) {
  return (
    <View style={{ flex: 1, padding: 16, gap: 10 }}>
      <Text style={{ opacity: 0.8 }}>
        Map view is not supported on web. Switch to List to continue.
      </Text>
      <Pressable
        onPress={onRequestList}
        style={{
          paddingVertical: 10,
          paddingHorizontal: 12,
          borderRadius: 10,
          borderWidth: 1,
          alignSelf: "flex-start",
        }}
      >
        <Text style={{ fontWeight: "700" }}>Go to List</Text>
      </Pressable>
    </View>
  );
}
