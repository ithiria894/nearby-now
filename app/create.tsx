import { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { router } from "expo-router";

export default function CreateScreen() {
  const [text, setText] = useState("");

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: "600" }}>What do you want to do right now?</Text>

      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="e.g. ramen / karaoke / club"
        style={{ borderWidth: 1, borderRadius: 12, padding: 12 }}
      />

      <Pressable
        onPress={() => router.replace("/room/demo")}
        style={{ backgroundColor: "black", padding: 12, borderRadius: 12 }}
      >
        <Text style={{ color: "white", textAlign: "center" }}>Post invite</Text>
      </Pressable>
    </View>
  );
}
