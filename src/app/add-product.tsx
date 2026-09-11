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

type Attribute = {
  name: string;
  quantity: string;
  unit: string;
  commission_type: string;
  commission_value: string;
  discount_type: string;
  discount_value: string;
};

export default function AddProductScreen() {
  const router = useRouter();

  // Product fields
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [itemCode, setItemCode] = useState('');
  const [brandName, setBrandName] = useState('');
  const [nutrition, setNutrition] = useState('');

  // Image
  const [imageUri, setImageUri] = useState<string | null>(null);

  // Categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);

  // Attributes
  const [attributes, setAttributes] = useState<Attribute[]>([]);

  // Loading
  const [loading, setLoading] = useState(false);

  /*
   * Load categories
   */
  useEffect(() => {
    console.log('LOADING CATEGORIES...');

    getCategories()
      .then((data) => {
        console.log('CATEGORIES LOADED:', data);
        setCategories(data as Category[]);
      })
      .catch((error) => {
        console.log('CATEGORY LOADING ERROR:', error);
        setCategories([]);
      });
  }, []);

  /*
   * Pick product image
   */
  const pickImage = async () => {
    try {
      console.log('OPENING IMAGE PICKER');

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          quality: 0.7,
        });

      console.log('IMAGE PICKER RESULT:', result);

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
        console.log(
          'IMAGE SELECTED:',
          result.assets[0].uri
        );
      }
    } catch (error) {
      console.log('IMAGE PICKER ERROR:', error);

      Alert.alert(
        'Error',
        'Unable to select image.'
      );
    }
  };

  /*
   * Add one attribute
   */
  const addAttribute = () => {
    setAttributes((current) => [
      ...current,
      {
        name: '',
        quantity: '',
        unit: 'Piece',
        commission_type: 'flat',
        commission_value: '0.00',
        discount_type: '',
        discount_value: '',
      },
    ]);
  };

  /*
   * Update attribute
   */
  const updateAttribute = (
    index: number,
    field: keyof Attribute,
    value: string
  ) => {
    setAttributes((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  /*
   * Remove attribute
   */
  const removeAttribute = (index: number) => {
    setAttributes((current) =>
      current.filter(
        (_, itemIndex) =>
          itemIndex !== index
      )
    );
  };

  /*
   * SAVE PRODUCT
   */
  const handleSave = async () => {
  console.log('================================');
  console.log('SAVE PRODUCT CLICKED');
  console.log('================================');

  // Product name validation
  if (!productName.trim()) {
    Alert.alert('Error', 'Product Name is required');
    return;
  }

  // Price validation
  if (!price.trim()) {
    Alert.alert('Error', 'Price is required');
    return;
  }

  const numericPrice = parseFloat(price);

  if (Number.isNaN(numericPrice)) {
    Alert.alert(
      'Error',
      'Please enter a valid price'
    );
    return;
  }

  // Category validation
  if (!categoryId) {
    Alert.alert(
      'Error',
      'Please select a category'
    );
    return;
  }

  console.log('ALL VALIDATIONS PASSED');

  setLoading(true);

  try {
    console.log(
      'STARTING ADD PRODUCT API CALL'
    );

    const formData = new FormData();

    /*
     * Product details
     */
    formData.append(
      'product_name',
      productName.trim()
    );

    formData.append(
      'category_id',
      String(categoryId)
    );

    formData.append(
      'promotion_id',
      ''
    );

    formData.append(
      'item_code',
      itemCode.trim()
    );

    formData.append(
      'product_desc',
      description.trim()
    );

    formData.append(
      'nutrition',
      nutrition.trim()
    );

    formData.append(
      'tax_id',
      ''
    );

    formData.append(
      'brand_name',
      brandName.trim()
    );

    /*
     * Discount
     */
    formData.append(
      'product_discount_type',
      ''
    );

    formData.append(
      'product_discount_value',
      ''
    );

    /*
     * Product flags
     */
    formData.append(
      'hotdeals',
      '0'
    );

    formData.append(
      'offers',
      '0'
    );

    formData.append(
      'new_arrival',
      '0'
    );

    formData.append(
      'status',
      '1'
    );

    /*
     * Price
     */
    formData.append(
      'price',
      String(numericPrice)
    );

    /*
     * Attribute count
     */
    formData.append(
      'index',
      String(attributes.length)
    );

    /*
     * Attributes
     */
    attributes.forEach(
      (attribute) => {
        formData.append(
          'attribute_id[]',
          ''
        );

        formData.append(
          'attribute_name[]',
          attribute.name
        );

        formData.append(
          'attribute_unit[]',
          attribute.unit
        );

        formData.append(
          'attribute_quantity[]',
          attribute.quantity
        );

        formData.append(
          'attribute_commission_type[]',
          attribute.commission_type ||
            'flat'
        );

        formData.append(
          'attribute_commission_value[]',
          attribute.commission_value ||
            '0.00'
        );

        formData.append(
          'attribute_discount_type[]',
          attribute.discount_type || ''
        );

        formData.append(
          'attribute_discount_value[]',
          attribute.discount_value || ''
        );
      }
    );

    /*
     * Product image
     *
     * Web browser me blob URL ko actual
     * File/Blob me convert karna zaroori hai.
     */
    if (imageUri) {
      console.log(
        'PREPARING PRODUCT IMAGE'
      );

      const imageResponse =
        await fetch(imageUri);

      const imageBlob =
        await imageResponse.blob();

      const imageFile = new File(
        [imageBlob],
        'product.jpg',
        {
          type:
            imageBlob.type ||
            'image/jpeg',
        }
      );

      formData.append(
        'product_img[]',
        imageFile
      );

      console.log(
        'PRODUCT IMAGE ADDED'
      );
    }

    console.log(
      'FORM DATA CREATED'
    );

    console.log(
      'CALLING /api/add-product'
    );

    /*
     * IMPORTANT:
     * Content-Type manually mat lagana.
     * Browser khud multipart boundary set karega.
     */
    const response = await fetch(
      '/api/add-product',
      {
        method: 'POST',

        credentials: 'include',

        body: formData,
      }
    );

    console.log(
      'API REQUEST COMPLETED'
    );

    console.log(
      'HTTP STATUS:',
      response.status
    );

    const text =
      await response.text();

    console.log(
      'ADD PRODUCT RESPONSE:',
      text
    );

    /*
     * HTTP error
     */
    if (response.status >= 400) {
      let message =
        'Product could not be saved.';

      try {
        const errorData =
          JSON.parse(text);

        message =
          errorData.message ||
          errorData.msg ||
          message;
      } catch {
        // response JSON nahi hai
      }

      Alert.alert(
        'Error',
        message
      );

      return;
    }

    /*
     * Parse API response
     */
    let result: any = null;

    try {
      result = JSON.parse(text);
    } catch {
      console.log(
        'Response JSON nahi hai:',
        text
      );
    }

    console.log(
      'PARSED RESPONSE:',
      result
    );

    /*
     * API failure
     */
    if (
      result &&
      (
        result.status === 'fail' ||
        result.status === false ||
        result.status === 'error'
      )
    ) {
      Alert.alert(
        'Error',
        result.msg ||
          result.message ||
          'Product could not be saved.'
      );

      return;
    }

    /*
     * Success
     */
    console.log(
      'PRODUCT SAVE SUCCESS'
    );

    Alert.alert(
      'Success',
      'Product added successfully.',
      [
        {
          text: 'OK',

          onPress: () => {
            router.replace(
              '/products'
            );
          },
        },
      ]
    );
  } catch (error) {
    console.log(
      '================================'
    );

    console.log(
      'ADD PRODUCT ERROR:',
      error
    );

    console.log(
      '================================'
    );

    Alert.alert(
      'Error',
      error instanceof Error
        ? error.message
        : 'Server connection failed.'
    );
  } finally {
    setLoading(false);
  }
};
  /*
   * Cancel
   */
  const handleCancel = () => {
    if (loading) {
      return;
    }

    router.replace(
      '/products'
    );
  };

  const selectedCategory =
    categories.find(
      (item) =>
        Number(item.id) ===
        categoryId
    );

  return (
    <ScrollView
      contentContainerStyle={
        styles.container
      }
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
            source={{
              uri: imageUri,
            }}
            style={
              styles.imagePreview
            }
            resizeMode="cover"
          />
        ) : (
          <View
            style={
              styles.imagePlaceholder
            }
          >
            <Text
              style={styles.imageIcon}
            >
              ＋
            </Text>

            <Text
              style={styles.imageText}
            >
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
        onChangeText={
          setProductName
        }
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

      {/* Item Code */}

      <Text style={styles.label}>
        Item Code
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Enter item code"
        placeholderTextColor="#999"
        value={itemCode}
        onChangeText={setItemCode}
        maxLength={10}
      />

      {/* Brand Name */}

      <Text style={styles.label}>
        Brand Name
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Enter brand name"
        placeholderTextColor="#999"
        value={brandName}
        onChangeText={setBrandName}
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
        onChangeText={
          setDescription
        }
        textAlignVertical="top"
      />

      {/* Nutrition */}

      <Text style={styles.label}>
        Nutrition
      </Text>

      <TextInput
        style={[
          styles.input,
          styles.textArea,
        ]}
        placeholder="Enter nutrition information"
        placeholderTextColor="#999"
        multiline
        numberOfLines={4}
        value={nutrition}
        onChangeText={setNutrition}
        textAlignVertical="top"
      />

      {/* Category */}

      <Text style={styles.label}>
        Category *
      </Text>

      <Pressable
        style={
          styles.categorySelect
        }
        onPress={() =>
          setCategoryOpen(
            (current) =>
              !current
          )
        }
      >
        <Text
          style={[
            styles.categorySelectText,
            !selectedCategory &&
              styles.placeholderText,
          ]}
        >
          {selectedCategory
            ? selectedCategory.category_name
            : 'Select Category'}
        </Text>

        <Text
          style={
            styles.categoryArrow
          }
        >
          {categoryOpen
            ? '⌃'
            : '⌄'}
        </Text>
      </Pressable>

      {/* Category List */}

      {categoryOpen && (
        <View
          style={
            styles.categoryList
          }
        >
          {categories.length ===
          0 ? (
            <Text
              style={
                styles.noCategoryText
              }
            >
              No categories
              available
            </Text>
          ) : (
            categories
              .filter(
                (item) =>
                  item.status ===
                    undefined ||
                  Number(
                    item.status
                  ) === 1
              )
              .map((item) => (
                <Pressable
                  key={String(
                    item.id
                  )}
                  style={[
                    styles.categoryOption,
                    categoryId ===
                      Number(
                        item.id
                      ) &&
                      styles.categoryOptionActive,
                  ]}
                  onPress={() => {
                    setCategoryId(
                      Number(
                        item.id
                      )
                    );

                    setCategoryOpen(
                      false
                    );
                  }}
                >
                  <Text
                    style={[
                      styles.categoryOptionText,
                      categoryId ===
                        Number(
                          item.id
                        ) &&
                        styles.categoryOptionTextActive,
                    ]}
                  >
                    {
                      item.category_name
                    }
                  </Text>

                  {categoryId ===
                    Number(
                      item.id
                    ) && (
                    <Text
                      style={
                        styles.check
                      }
                    >
                      ✓
                    </Text>
                  )}
                </Pressable>
              ))
          )}
        </View>
      )}

      {/* Attributes */}

      <View
        style={
          styles.attributeHeader
        }
      >
        <Text
          style={styles.sectionTitle}
        >
          Attributes
        </Text>

        <Pressable
          style={
            styles.addAttributeButton
          }
          onPress={
            addAttribute
          }
        >
          <Text
            style={
              styles.addAttributeText
            }
          >
            + Add Attribute
          </Text>
        </Pressable>
      </View>

      {attributes.map(
        (attribute, index) => (
          <View
            key={index}
            style={
              styles.attributeCard
            }
          >
            <View
              style={
                styles.attributeTop
              }
            >
              <Text
                style={
                  styles.attributeTitle
                }
              >
                Attribute {index + 1}
              </Text>

              <Pressable
                onPress={() =>
                  removeAttribute(
                    index
                  )
                }
              >
                <Text
                  style={
                    styles.removeText
                  }
                >
                  Remove
                </Text>
              </Pressable>
            </View>

            <Text
              style={
                styles.smallLabel
              }
            >
              Name
            </Text>

            <TextInput
              style={
                styles.smallInput
              }
              placeholder="Attribute name"
              placeholderTextColor="#999"
              value={
                attribute.name
              }
              onChangeText={(
                value
              ) =>
                updateAttribute(
                  index,
                  'name',
                  value
                )
              }
            />

            <Text
              style={
                styles.smallLabel
              }
            >
              Quantity
            </Text>

            <TextInput
              style={
                styles.smallInput
              }
              placeholder="Quantity"
              placeholderTextColor="#999"
              keyboardType="numeric"
              value={
                attribute.quantity
              }
              onChangeText={(
                value
              ) =>
                updateAttribute(
                  index,
                  'quantity',
                  value
                )
              }
            />

            <Text
              style={
                styles.smallLabel
              }
            >
              Unit
            </Text>

            <TextInput
              style={
                styles.smallInput
              }
              placeholder="Piece / Kg / grams"
              placeholderTextColor="#999"
              value={
                attribute.unit
              }
              onChangeText={(
                value
              ) =>
                updateAttribute(
                  index,
                  'unit',
                  value
                )
              }
            />
          </View>
        )
      )}

      {/* Buttons */}

      <View
        style={styles.buttonRow}
      >
        {/* Cancel */}

        <TouchableOpacity
          style={[
            styles.cancelButton,
            loading &&
              styles.disabledBtn,
          ]}
          onPress={
            handleCancel
          }
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text
            style={
              styles.cancelButtonText
            }
          >
            Cancel
          </Text>
        </TouchableOpacity>

        {/* Save */}

        <TouchableOpacity
          style={[
            styles.saveButton,
            loading &&
              styles.disabledBtn,
          ]}
          onPress={
            handleSave
          }
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator
              color="#fff"
            />
          ) : (
            <Text
              style={
                styles.saveButtonText
              }
            >
              Save Product
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles =
  StyleSheet.create({
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

    label: {
      fontSize: 14,
      fontWeight: '600',
      color: '#111',
      marginBottom: 7,
    },

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

    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#111',
    },

    attributeHeader: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 10,
      marginBottom: 15,
    },

    addAttributeButton: {
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 7,
      backgroundColor: '#087FF5',
    },

    addAttributeText: {
      color: '#fff',
      fontSize: 13,
      fontWeight: '700',
    },

    attributeCard: {
      width: '100%',
      borderWidth: 1,
      borderColor: '#DDDDDD',
      borderRadius: 8,
      padding: 15,
      marginBottom: 15,
      backgroundColor: '#FAFAFA',
    },

    attributeTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },

    attributeTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: '#111',
    },

    removeText: {
      color: '#D9534F',
      fontSize: 13,
      fontWeight: '600',
    },

    smallLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: '#333',
      marginBottom: 6,
    },

    smallInput: {
      width: '100%',
      height: 48,
      borderWidth: 1,
      borderColor: '#D0D0D0',
      borderRadius: 7,
      paddingHorizontal: 12,
      marginBottom: 12,
      backgroundColor: '#fff',
      color: '#111',
    },

    buttonRow: {
      width: '100%',
      flexDirection: 'row',
      gap: 12,
      marginTop: 12,
    },

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