import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { getCategories } from '@/services/api';

type Category = {
  id: number;
  category_name: string;
  status?: number;
};

export default function AddProductScreen() {
  const router = useRouter();

  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);

  const [loading, setLoading] = useState(false);

  // Load Categories
  useEffect(() => {
    getCategories()
      .then((data) => {
        setCategories(data as Category[]);
      })
      .catch((error) => {
        console.log('Category loading error:', error);
        setCategories([]);
      });
  }, []);

  // Select Product Image
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  // Save Product
  const handleSave = async () => {
    if (!productName.trim()) {
      Alert.alert('Error', 'Product Name is required');
      return;
    }

    if (!price.trim()) {
      Alert.alert('Error', 'Price is required');
      return;
    }

    const numericPrice = parseFloat(price);

    if (Number.isNaN(numericPrice)) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    if (!categoryId) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/add-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_name: productName.trim(),
          price: numericPrice,
          description: description.trim(),
          category_id: categoryId,
          image: imageUri,
        }),
      });

      const data = await response.json();

      console.log('ADD PRODUCT RESPONSE:', data);

      if (response.ok && data.status !== 'error') {
        Alert.alert(
          'Success',
          'Product added successfully',
          [
            {
              text: 'OK',
              onPress: () => {
                router.replace('/products');
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'Error',
          data.message || 'Something went wrong'
        );
      }
    } catch (error) {
      console.log('ADD PRODUCT ERROR:', error);

      Alert.alert(
        'Error',
        'Server connection failed'
      );
    } finally {
      setLoading(false);
    }
  };

  // Cancel
  const handleCancel = () => {
    if (loading) {
      return;
    }

    router.replace('/products');
  };

  const selectedCategory = categories.find(
    (item) => Number(item.id) === categoryId
  );

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {/* Title */}
      <Text style={styles.title}>
        Add New Product
      </Text>

      {/* Product Image */}
      <TouchableOpacity
        style={styles.imageBox}
        onPress={pickImage}
        activeOpacity={0.8}
      >
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.imagePreview}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imageIcon}>
              ＋
            </Text>

            <Text style={styles.imageText}>
              Select Product Image
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Product Name */}
      <Text style={styles.label}>
        Product Name *
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Enter product name"
        placeholderTextColor="#999"
        value={productName}
        onChangeText={setProductName}
        autoCapitalize="sentences"
      />

      {/* Price */}
      <Text style={styles.label}>
        Price *
      </Text>

      <TextInput
        style={styles.input}
        placeholder="0.00"
        placeholderTextColor="#999"
        keyboardType="decimal-pad"
        value={price}
        onChangeText={setPrice}
      />

      {/* Description */}
      <Text style={styles.label}>
        Description
      </Text>

      <TextInput
        style={[
          styles.input,
          styles.textArea,
        ]}
        placeholder="Enter description"
        placeholderTextColor="#999"
        multiline
        numberOfLines={4}
        value={description}
        onChangeText={setDescription}
        textAlignVertical="top"
      />

      {/* Category */}
      <Text style={styles.label}>
        Category *
      </Text>

      <Pressable
        style={styles.categorySelect}
        onPress={() => setCategoryOpen((current) => !current)}
      >
        <Text
          style={[
            styles.categorySelectText,
            !selectedCategory && styles.placeholderText,
          ]}
        >
          {selectedCategory
            ? selectedCategory.category_name
            : 'Select Category'}
        </Text>

        <Text style={styles.categoryArrow}>
          {categoryOpen ? '⌃' : '⌄'}
        </Text>
      </Pressable>

      {/* Category List */}
      {categoryOpen && (
        <View style={styles.categoryList}>
          {categories.length === 0 ? (
            <Text style={styles.noCategoryText}>
              No categories available
            </Text>
          ) : (
            categories.map((item) => (
              <Pressable
                key={String(item.id)}
                style={[
                  styles.categoryOption,
                  categoryId === Number(item.id) &&
                    styles.categoryOptionActive,
                ]}
                onPress={() => {
                  setCategoryId(Number(item.id));
                  setCategoryOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.categoryOptionText,
                    categoryId === Number(item.id) &&
                      styles.categoryOptionTextActive,
                  ]}
                >
                  {item.category_name}
                </Text>

                {categoryId === Number(item.id) && (
                  <Text style={styles.check}>
                    ✓
                  </Text>
                )}
              </Pressable>
            ))
          )}
        </View>
      )}

      {/* Buttons */}
      <View style={styles.buttonRow}>

        {/* Cancel */}
        <TouchableOpacity
          style={[
            styles.cancelButton,
            loading && styles.disabledBtn,
          ]}
          onPress={handleCancel}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.cancelButtonText}>
            Cancel
          </Text>
        </TouchableOpacity>

        {/* Save */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            loading && styles.disabledBtn,
          ]}
          onPress={() => Alert.alert('Test', 'Save button clicked')}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>
              Save Product
            </Text>
          )}
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 26,
    paddingTop: 24,
    paddingBottom: 30,
    backgroundColor: '#fff',
  },

  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
    marginBottom: 26,
  },

  /* IMAGE BOX - 50% WIDTH */ 
  imageBox: {
    width: '50%',
    height: 220,
    alignSelf: 'flex-start',
    marginBottom: 28,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D5D5D5',
    borderStyle: 'dashed',
    backgroundColor: '#F8F9FA',
    overflow: 'hidden',
  },

  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
  },

  imageIcon: {
    fontSize: 34,
    color: '#007BFF',
    marginBottom: 6,
  },

  imageText: {
    color: '#007BFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  imagePreview: {
    width: '100%',
    height: '100%',
  },

  /* LABEL */
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
    marginBottom: 7,
  },

  /* INPUT */
  input: {
    width: '100%',
    height: 58,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 7,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    backgroundColor: '#fff',
    color: '#111',
    fontSize: 15,
  },

  textArea: {
    height: 110,
    paddingTop: 14,
    marginBottom: 20,
  },

  /* CATEGORY */
  categorySelect: {
    width: '100%',
    height: 58,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 7,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  categorySelectText: {
    color: '#333',
    fontSize: 15,
    flex: 1,
  },

  placeholderText: {
    color: '#999',
  },

  categoryArrow: {
    color: '#666',
    fontSize: 20,
    marginLeft: 10,
  },

  categoryList: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 7,
    backgroundColor: '#fff',
    marginTop: -14,
    marginBottom: 20,
    overflow: 'hidden',
  },

  categoryOption: {
    minHeight: 48,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },

  categoryOptionActive: {
    backgroundColor: '#EAF4F9',
  },

  categoryOptionText: {
    flex: 1,
    color: '#333',
    fontSize: 14,
  },

  categoryOptionTextActive: {
    color: '#087FF5',
    fontWeight: '700',
  },

  check: {
    color: '#087FF5',
    fontSize: 16,
    fontWeight: '700',
  },

  noCategoryText: {
    padding: 16,
    textAlign: 'center',
    color: '#777',
    fontSize: 14,
  },

  /* BUTTON ROW */
  buttonRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },

  /* CANCEL */
  cancelButton: {
    flex: 1,
    height: 58,
    backgroundColor: '#6C757D',
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  /* SAVE */
  saveButton: {
    flex: 1,
    height: 58,
    backgroundColor: '#087FF5',
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },

  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  disabledBtn: {
    opacity: 0.6,
  },
});