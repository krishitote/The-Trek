import React, { useState } from "react";
import { View, TextInput, Button, Text, Alert } from "react-native";
import { useAuth } from "../context/AuthContext";

export default function RegisterScreen({ navigation }: any) {
  const { register } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    try {
      await register({ username, email, password });
    } catch {
      Alert.alert("Error", "Registration failed");
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 10 }}>Register</Text>
      <TextInput placeholder="Username" value={username} onChangeText={setUsername} style={{ borderWidth: 1, marginBottom: 8, padding: 8 }} />
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={{ borderWidth: 1, marginBottom: 8, padding: 8 }} />
      <TextInput placeholder="Password" value={password} secureTextEntry onChangeText={setPassword} style={{ borderWidth: 1, marginBottom: 8, padding: 8 }} />
      <Button title="Register" onPress={handleRegister} />
      <Text onPress={() => navigation.navigate("Login")} style={{ marginTop: 10, color: "blue" }}>Back to Login</Text>
    </View>
  );
}
