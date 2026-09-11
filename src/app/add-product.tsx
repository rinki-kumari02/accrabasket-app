import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { Category, getCategories } from '@/services/api';

type Attribute = { name: string; quantity: string; unit: string; commission_type: string; commission_value: string; discount_type: string; discount_value: string };

const NEW_ATTRIBUTE: Attribute = { name: '', quantity: '', unit: 'Piece', commission_type: 'flat', commission_value: '0.00', discount_type: '', discount_value: '' };

type TextFieldConfig = { key: string; label: string; placeholder: string; value: string; onChangeText: (value: string) => void; keyboardType?: 'default' | 'decimal-pad'; maxLength?: number; autoCapitalize?: 'sentences' };
type TextAreaConfig = { key: string; label: string; placeholder: string; value: string; onChangeText: (value: string) => void };
type AttributeFieldConfig = { field: keyof Attribute; label: string; placeholder: string; keyboardType?: 'numeric' };

const ATTRIBUTE_FIELDS: AttributeFieldConfig[] = [
  { field: 'name', label: 'Name', placeholder: 'Attribute name' },
  { field: 'quantity', label: 'Quantity', placeholder: 'Quantity', keyboardType: 'numeric' },
  { field: 'unit', label: 'Unit', placeholder: 'Piece / Kg / grams' },
];

async function buildProductFormData(values: { productName: string; price: number; categoryId: number; itemCode: string; description: string; nutrition: string; brandName: string }, attributes: Attribute[], imageUri: string | null) {
  const formData = new FormData();
  const fields: Record<string, string> = {
    product_name: values.productName,
    category_id: String(values.categoryId),
    promotion_id: '',
    item_code: values.itemCode,
    product_desc: values.description,
    nutrition: values.nutrition,
    tax_id: '',
    brand_name: values.brandName,
    product_discount_type: '',
    product_discount_value: '',
    hotdeals: '0',
    offers: '0',
    new_arrival: '0',
    status: '1',
    price: String(values.price),
    index: String(attributes.length),
  };
  Object.entries(fields).forEach(([key, value]) => formData.append(key, value));

  attributes.forEach((attribute) => {
    formData.append('attribute_id[]', '');
    formData.append('attribute_name[]', attribute.name);
    formData.append('attribute_unit[]', attribute.unit);
    formData.append('attribute_quantity[]', attribute.quantity);
    formData.append('attribute_commission_type[]', attribute.commission_type || 'flat');
    formData.append('attribute_commission_value[]', attribute.commission_value || '0.00');
    formData.append('attribute_discount_type[]', attribute.discount_type || '');
    formData.append('attribute_discount_value[]', attribute.discount_value || '');
  });

  if (imageUri) {
    const imageBlob = await (await fetch(imageUri)).blob();
    formData.append('product_img[]', new File([imageBlob], 'product.jpg', { type: imageBlob.type || 'image/jpeg' }));
  }

  return formData;
}

export default function AddProductScreen() {
  const router = useRouter();

  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [itemCode, setItemCode] = useState('');
  const [brandName, setBrandName] = useState('');
  const [nutrition, setNutrition] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.7 });
      if (!result.canceled) setImageUri(result.assets[0].uri);
    } catch {
      Alert.alert('Error', 'Unable to select image.');
    }
  };

  const addAttribute = () => setAttributes((current) => [...current, { ...NEW_ATTRIBUTE }]);
  const updateAttribute = (index: number, field: keyof Attribute, value: string) =>
    setAttributes((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)));
  const removeAttribute = (index: number) => setAttributes((current) => current.filter((_, itemIndex) => itemIndex !== index));

  const handleSave = async () => {
    if (!productName.trim()) return Alert.alert('Error', 'Product Name is required');
    if (!price.trim()) return Alert.alert('Error', 'Price is required');
    const numericPrice = parseFloat(price);
    if (Number.isNaN(numericPrice)) return Alert.alert('Error', 'Please enter a valid price');
    if (!categoryId) return Alert.alert('Error', 'Please select a category');

    setLoading(true);
    try {
      const formData = await buildProductFormData(
        { productName: productName.trim(), price: numericPrice, categoryId, itemCode: itemCode.trim(), description: description.trim(), nutrition: nutrition.trim(), brandName: brandName.trim() },
        attributes,
        imageUri
      );

      const response = await fetch('/api/add-product', { method: 'POST', credentials: 'include', body: formData });
      const text = await response.text();

      if (response.status >= 400) {
        let message = 'Product could not be saved.';
        try {
          const errorData = JSON.parse(text);
          message = errorData.message || errorData.msg || message;
        } catch {}
        Alert.alert('Error', message);
        return;
      }

      let result: any = null;
      try { result = JSON.parse(text); } catch {}

      if (result && (result.status === 'fail' || result.status === false || result.status === 'error')) {
        Alert.alert('Error', result.msg || result.message || 'Product could not be saved.');
        return;
      }

      Alert.alert('Success', 'Product added successfully.', [{ text: 'OK', onPress: () => router.replace('/products') }]);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Server connection failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (loading) return;
    router.replace('/products');
  };

  const selectedCategory = categories.find((item) => Number(item.id) === categoryId);
  const visibleCategories = categories.filter((item) => item.status === undefined || Number(item.status) === 1);

  const textFields: TextFieldConfig[] = [
    { key: 'productName', label: 'Product Name *', placeholder: 'Enter product name', value: productName, onChangeText: setProductName, autoCapitalize: 'sentences' },
    { key: 'price', label: 'Price *', placeholder: '0.00', value: price, onChangeText: setPrice, keyboardType: 'decimal-pad' },
    { key: 'itemCode', label: 'Item Code', placeholder: 'Enter item code', value: itemCode, onChangeText: setItemCode, maxLength: 10 },
    { key: 'brandName', label: 'Brand Name', placeholder: 'Enter brand name', value: brandName, onChangeText: setBrandName },
  ];
  const textAreaFields: TextAreaConfig[] = [
    { key: 'description', label: 'Description', placeholder: 'Enter description', value: description, onChangeText: setDescription },
    { key: 'nutrition', label: 'Nutrition', placeholder: 'Enter nutrition information', value: nutrition, onChangeText: setNutrition },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Add New Product</Text>

      <TouchableOpacity style={styles.imageBox} onPress={pickImage} activeOpacity={0.8}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imageIcon}>＋</Text>
            <Text style={styles.imageText}>Select Product Image</Text>
          </View>
        )}
      </TouchableOpacity>

      {textFields.map(({ key, label, ...inputProps }) => (
        <View key={key}>
          <Text style={styles.label}>{label}</Text>
          <TextInput style={styles.input} placeholderTextColor="#999" {...inputProps} />
        </View>
      ))}

      {textAreaFields.map(({ key, label, ...inputProps }) => (
        <View key={key}>
          <Text style={styles.label}>{label}</Text>
          <TextInput style={[styles.input, styles.textArea]} placeholderTextColor="#999" multiline numberOfLines={4} textAlignVertical="top" {...inputProps} />
        </View>
      ))}

      <Text style={styles.label}>Category *</Text>
      <Pressable style={styles.categorySelect} onPress={() => setCategoryOpen((current) => !current)}>
        <Text style={[styles.categorySelectText, !selectedCategory && styles.placeholderText]}>{selectedCategory ? selectedCategory.category_name : 'Select Category'}</Text>
        <Text style={styles.categoryArrow}>{categoryOpen ? '⌃' : '⌄'}</Text>
      </Pressable>

      {categoryOpen && (
        <View style={styles.categoryList}>
          {visibleCategories.length === 0 ? (
            <Text style={styles.noCategoryText}>No categories available</Text>
          ) : (
            visibleCategories.map((item) => {
              const active = categoryId === Number(item.id);
              return (
                <Pressable key={String(item.id)} style={[styles.categoryOption, active && styles.categoryOptionActive]} onPress={() => { setCategoryId(Number(item.id)); setCategoryOpen(false); }}>
                  <Text style={[styles.categoryOptionText, active && styles.categoryOptionTextActive]}>{item.category_name}</Text>
                  {active && <Text style={styles.check}>✓</Text>}
                </Pressable>
              );
            })
          )}
        </View>
      )}

      <View style={styles.attributeHeader}>
        <Text style={styles.sectionTitle}>Attributes</Text>
        <Pressable style={styles.addAttributeButton} onPress={addAttribute}>
          <Text style={styles.addAttributeText}>+ Add Attribute</Text>
        </Pressable>
      </View>

      {attributes.map((attribute, index) => (
        <View key={index} style={styles.attributeCard}>
          <View style={styles.attributeTop}>
            <Text style={styles.attributeTitle}>Attribute {index + 1}</Text>
            <Pressable onPress={() => removeAttribute(index)}>
              <Text style={styles.removeText}>Remove</Text>
            </Pressable>
          </View>

          {ATTRIBUTE_FIELDS.map(({ field, label, placeholder, keyboardType }) => (
            <View key={field}>
              <Text style={styles.smallLabel}>{label}</Text>
              <TextInput
                style={styles.smallInput}
                placeholder={placeholder}
                placeholderTextColor="#999"
                keyboardType={keyboardType}
                value={attribute[field]}
                onChangeText={(value) => updateAttribute(index, field, value)}
              />
            </View>
          ))}
        </View>
      ))}

      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.cancelButton, loading && styles.disabledBtn]} onPress={handleCancel} disabled={loading} activeOpacity={0.8}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.saveButton, loading && styles.disabledBtn]} onPress={handleSave} disabled={loading} activeOpacity={0.8}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Product</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 26, paddingTop: 24, paddingBottom: 30, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '700', color: '#111', marginBottom: 26 },
  imageBox: { width: '50%', height: 220, alignSelf: 'flex-start', marginBottom: 28, borderRadius: 10, borderWidth: 1, borderColor: '#D5D5D5', borderStyle: 'dashed', backgroundColor: '#F8F9FA', overflow: 'hidden' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 15 },
  imageIcon: { fontSize: 34, color: '#007BFF', marginBottom: 6 },
  imageText: { color: '#007BFF', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  imagePreview: { width: '100%', height: '100%' },
  label: { fontSize: 14, fontWeight: '600', color: '#111', marginBottom: 7 },
  input: { width: '100%', height: 58, borderWidth: 1, borderColor: '#D0D0D0', borderRadius: 7, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 20, backgroundColor: '#fff', color: '#111', fontSize: 15 },
  textArea: { height: 110, paddingTop: 14, marginBottom: 20 },
  categorySelect: { width: '100%', height: 58, borderWidth: 1, borderColor: '#D0D0D0', borderRadius: 7, paddingHorizontal: 16, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  categorySelectText: { color: '#333', fontSize: 15, flex: 1 },
  placeholderText: { color: '#999' },
  categoryArrow: { color: '#666', fontSize: 20, marginLeft: 10 },
  categoryList: { width: '100%', borderWidth: 1, borderColor: '#D0D0D0', borderRadius: 7, backgroundColor: '#fff', marginTop: -14, marginBottom: 20, overflow: 'hidden' },
  categoryOption: { minHeight: 48, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#EEEEEE' },
  categoryOptionActive: { backgroundColor: '#EAF4F9' },
  categoryOptionText: { flex: 1, color: '#333', fontSize: 14 },
  categoryOptionTextActive: { color: '#087FF5', fontWeight: '700' },
  check: { color: '#087FF5', fontSize: 16, fontWeight: '700' },
  noCategoryText: { padding: 16, textAlign: 'center', color: '#777', fontSize: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111' },
  attributeHeader: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 15 },
  addAttributeButton: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 7, backgroundColor: '#087FF5' },
  addAttributeText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  attributeCard: { width: '100%', borderWidth: 1, borderColor: '#DDDDDD', borderRadius: 8, padding: 15, marginBottom: 15, backgroundColor: '#FAFAFA' },
  attributeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  attributeTitle: { fontSize: 15, fontWeight: '700', color: '#111' },
  removeText: { color: '#D9534F', fontSize: 13, fontWeight: '600' },
  smallLabel: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 6 },
  smallInput: { width: '100%', height: 48, borderWidth: 1, borderColor: '#D0D0D0', borderRadius: 7, paddingHorizontal: 12, marginBottom: 12, backgroundColor: '#fff', color: '#111' },
  buttonRow: { width: '100%', flexDirection: 'row', gap: 12, marginTop: 12 },
  cancelButton: { flex: 1, height: 58, backgroundColor: '#6C757D', borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  cancelButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  saveButton: { flex: 1, height: 58, backgroundColor: '#087FF5', borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  disabledBtn: { opacity: 0.6 },
});
