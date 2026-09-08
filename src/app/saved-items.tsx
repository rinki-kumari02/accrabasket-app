import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SavedItemsScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>

        <Text style={styles.title}>Saved Items</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.icon}>♡</Text>

        <Text style={styles.heading}>Saved Items</Text>

        <Text style={styles.message}>
          Your favourite products will appear here.
        </Text>

        <Pressable
          onPress={() => router.push('/products')}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Browse Products</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F7F4',
  },

  header: {
    height: 62,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    backgroundColor: '#176B45',
  },

  back: {
    width: 42,
  },

  backText: {
    fontSize: 34,
    color: '#FFF',
  },

  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
  },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  icon: {
    fontSize: 55,
    color: '#176B45',
    marginBottom: 15,
  },

  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: '#173D2D',
  },

  message: {
    fontSize: 14,
    color: '#718078',
    marginTop: 8,
    textAlign: 'center',
  },

  button: {
    marginTop: 25,
    backgroundColor: '#176B45',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
  },

  buttonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});