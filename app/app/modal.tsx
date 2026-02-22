import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { Colors, Radius } from '@/constants/theme';

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>AgroMap</Text>
      <Text style={styles.sub}>Smart Farm Planning App</Text>
      <Link href="/(tabs)" dismissTo asChild>
        <TouchableOpacity style={styles.btn}>
          <Text style={styles.btnText}>Go to App</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg, padding: 20 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.primary },
  sub: { color: Colors.textMuted, marginTop: 8, marginBottom: 24 },
  btn: { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingHorizontal: 28, paddingVertical: 14 },
  btnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
});
