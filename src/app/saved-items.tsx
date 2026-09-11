import { Image } from 'expo-image';
import { Redirect, router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Category, getCategories, getSavedProducts, isAuthenticated, Product, toggleFavoriteProduct } from '@/services/api';

function productPrice(product: Product): string {
  const variant = Object.values(product.attribute || {})[0];
  const price = variant?.actual_price || variant?.price || product.price;
  return price ? String(price) : '—';
}

export default function SavedItemsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [removingIds, setRemovingIds] = useState<Set<number>>(new Set());

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const [savedProducts, categoryList] = await Promise.all([getSavedProducts(), getCategories()]);
      setProducts(savedProducts);
      setCategories(categoryList);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Saved items could not be loaded.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const categoryNames = useMemo(
    () => Object.fromEntries(categories.map((category) => [Number(category.id), category.category_name])) as Record<number, string>,
    [categories]
  );

  const removeSavedProduct = async (productId: number) => {
    if (removingIds.has(productId)) return;
    setRemovingIds((current) => new Set(current).add(productId));
    try {
      await toggleFavoriteProduct(productId);
      setProducts((current) => current.filter((product) => product.product_id !== productId));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'This item could not be removed.');
    } finally {
      setRemovingIds((current) => { const next = new Set(current); next.delete(productId); return next; });
    }
  };

  if (!isAuthenticated()) return <Redirect href="/" />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Saved Items</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#176B45" />
          <Text style={styles.stateText}>Loading your saved items…</Text>
        </View>
      ) : error && products.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Couldn’t load saved items</Text>
          <Text style={styles.stateText}>{error}</Text>
          <Pressable onPress={() => load()} style={styles.retry}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.content}>
          <Text style={styles.icon}>♡</Text>
          <Text style={styles.heading}>No saved items yet</Text>
          <Text style={styles.message}>Tap the heart on any product to save it here.</Text>
          <Pressable onPress={() => router.push('/products')} style={styles.button}>
            <Text style={styles.buttonText}>Browse Products</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.product_id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
          ListHeaderComponent={error ? <Text style={styles.inlineError}>{error}</Text> : null}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.thumb}>
                {item.image_url
                  ? <Image source={{ uri: item.image_url }} style={styles.thumbImage} contentFit="cover" transition={150} />
                  : <Text style={styles.thumbText}>{item.product_name.charAt(0).toUpperCase()}</Text>}
              </View>
              <View style={styles.copy}>
                <Text style={styles.name} numberOfLines={1}>{item.product_name}</Text>
                <Text style={styles.category} numberOfLines={1}>
                  {item.category_id ? categoryNames[Number(item.category_id)] || `Category ${item.category_id}` : 'Uncategorised'}
                </Text>
                <Text style={styles.price}>{productPrice(item)}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove ${item.product_name} from saved items`}
                disabled={removingIds.has(item.product_id)}
                onPress={() => removeSavedProduct(item.product_id)}
                style={styles.heartButton}
              >
                {removingIds.has(item.product_id)
                  ? <ActivityIndicator size="small" color="#C94A51" />
                  : <Text style={styles.heartFilled}>♥</Text>}
              </Pressable>
            </View>
          )}
        />
      )}
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

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 25 },
  stateText: { color: '#718078', fontSize: 12, textAlign: 'center', marginTop: 9 },
  errorTitle: { color: '#173D2D', fontSize: 17, fontWeight: '700' },
  retry: { marginTop: 15, backgroundColor: '#176B45', paddingHorizontal: 18, paddingVertical: 9, borderRadius: 8 },
  retryText: { color: '#FFF', fontWeight: '700' },
  inlineError: { color: '#C94A51', fontSize: 12, textAlign: 'center', paddingVertical: 8 },

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

  list: { padding: 14, paddingBottom: 30 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 14, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#E3EBE6', shadowColor: '#173D2D', shadowOpacity: 0.08, shadowRadius: 7, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  thumb: { width: 58, height: 58, borderRadius: 12, overflow: 'hidden', backgroundColor: '#E8F4EC', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  thumbImage: { width: '100%', height: '100%' },
  thumbText: { color: '#176B45', fontSize: 20, fontWeight: '900' },
  copy: { flex: 1, minWidth: 0 },
  name: { color: '#173D2D', fontSize: 14, fontWeight: '800' },
  category: { color: '#94A29B', fontSize: 11, marginTop: 3 },
  price: { color: '#13824F', fontSize: 13, fontWeight: '900', marginTop: 4 },
  heartButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  heartFilled: { fontSize: 22, color: '#C94A51' },
});
