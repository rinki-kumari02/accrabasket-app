/*
 * Expo API routes run on the server, where request.formData() returns a
 * standard Web FormData/File. TypeScript infers React Native's client-side
 * FormData polyfill (uri-based, no .get()) here instead, so read it back
 * through the real shape it actually has at runtime.
 */
type WebFormDataValue = string | File;
type WebFormData = {
  get(name: string): WebFormDataValue | null;
  getAll(name: string): WebFormDataValue[];
};

export async function POST(request: Request) {
  try {
    const incomingFormData = (await request.formData()) as unknown as WebFormData;

    /*
     * Same admin session used by Edit Product
     * (see src/app/api/product-save+api.ts).
     */
    const cookieHeader = request.headers.get('cookie') || '';
    const sessionMatch = cookieHeader.match(/(?:^|;\s*)accrabasket_admin=([^;]+)/);

    if (!sessionMatch) {
      return Response.json(
        { status: 'error', message: 'Admin session required.' },
        { status: 401 }
      );
    }

    const upstreamCookie = decodeURIComponent(sessionMatch[1]);

    const productName = String(incomingFormData.get('product_name') || '');
    const categoryId = String(incomingFormData.get('category_id') || '');

    if (!productName || !categoryId) {
      return Response.json(
        { status: 'error', message: 'Product name and category are required.' },
        { status: 400 }
      );
    }

    /*
     * Old AccraBasket admin controller:
     *
     * Save Product
     *      ↓
     * admin/product/saveproduct
     *      ↓
     * empty "id" = create new product, non-empty "id" = update
     *
     * This is the exact same endpoint Edit Product already uses
     * successfully (product-save+api.ts) — Add Product just posts
     * it with an empty id and a product image attached.
     */
    const form = new FormData();

    form.set('id', '');
    form.set('product_name', productName);
    form.set('category_id', categoryId);
    form.set('promotion_id', String(incomingFormData.get('promotion_id') || ''));
    form.set('item_code', String(incomingFormData.get('item_code') || ''));
    form.set('product_desc', String(incomingFormData.get('product_desc') || ''));
    form.set('nutrition', String(incomingFormData.get('nutrition') || ''));
    form.set('tax_id', String(incomingFormData.get('tax_id') || ''));
    form.set('brand_name', String(incomingFormData.get('brand_name') || ''));
    form.set('product_discount_type', String(incomingFormData.get('product_discount_type') || ''));
    form.set('product_discount_value', String(incomingFormData.get('product_discount_value') || ''));
    form.set('hotdeals', String(incomingFormData.get('hotdeals') || '0'));
    form.set('offers', String(incomingFormData.get('offers') || '0'));
    form.set('new_arrival', String(incomingFormData.get('new_arrival') || '0'));
    form.set('status', String(incomingFormData.get('status') || '1'));
    form.set('price', String(incomingFormData.get('price') || '0'));

    const attributeIds = incomingFormData.getAll('attribute_id[]');
    const attributeNames = incomingFormData.getAll('attribute_name[]');
    const attributeUnits = incomingFormData.getAll('attribute_unit[]');
    const attributeQuantities = incomingFormData.getAll('attribute_quantity[]');
    const commissionTypes = incomingFormData.getAll('attribute_commission_type[]');
    const commissionValues = incomingFormData.getAll('attribute_commission_value[]');
    const discountTypes = incomingFormData.getAll('attribute_discount_type[]');
    const discountValues = incomingFormData.getAll('attribute_discount_value[]');

    form.set('index', String(attributeNames.length));

    attributeNames.forEach((name, index) => {
      form.append('attribute_id[]', String(attributeIds[index] || ''));
      form.append('attribute_name[]', String(name || ''));
      form.append('attribute_unit[]', String(attributeUnits[index] || ''));
      form.append('attribute_quantity[]', String(attributeQuantities[index] || ''));
      form.append('attribute_commission_type[]', String(commissionTypes[index] || 'flat'));
      form.append('attribute_commission_value[]', String(commissionValues[index] || '0.00'));
      form.append('attribute_discount_type[]', String(discountTypes[index] || ''));
      form.append('attribute_discount_value[]', String(discountValues[index] || ''));
    });

    /*
     * Product image(s) — forwarded as real multipart files, not base64.
     */
    for (const image of incomingFormData.getAll('product_img[]')) {
      if (image && typeof image !== 'string') {
        form.append('product_img[]', image, image.name || 'product.jpg');
      }
    }

    const apiUrl = 'https://crtup.in/accrabasket/admin/product/saveproduct';

    console.log('BASKET API METHOD:', 'POST (admin saveproduct, empty id = add)');
    console.log('BASKET API URL:', apiUrl);

    /*
     * IMPORTANT: do not set Content-Type manually here either —
     * fetch generates the correct multipart boundary for FormData.
     */
    const upstream = await fetch(apiUrl, {
      method: 'POST',
      headers: { Cookie: upstreamCookie },
      body: form,
      redirect: 'manual',
    });

    console.log('BASKET API STATUS:', upstream.status);

    const responseText = await upstream.text().catch(() => '');

    console.log('BASKET API RESPONSE:', responseText || '(empty body — likely a redirect on success)');

    if (upstream.status >= 400) {
      return Response.json(
        { status: 'error', message: 'AccraBasket rejected the product.' },
        { status: upstream.status }
      );
    }

    /*
     * Success: the legacy controller redirects back to its HTML product
     * page (redirect: 'manual' means we see that redirect status here
     * rather than following it), so treat anything under 400 as success —
     * same handling as product-save+api.ts.
     */
    return Response.json({ status: 'success' });
  } catch (error) {
    console.log('ADD PRODUCT API ERROR:', error);

    return Response.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to add product',
      },
      { status: 500 }
    );
  }
}
