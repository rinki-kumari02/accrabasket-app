export async function POST(request: Request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const body = await request.json();

  const addProductUrl = 'https://crtup.in/basketapi/index.php/application/product';

  const merchantParameters = JSON.stringify({
    method: 'add_product',
    ...body,
  });

  try {
    const response = await fetch(addProductUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader,
      },
      body: merchantParameters,
    });

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    return Response.json({ status: 'error', message: 'Failed to add product' }, { status: 500 });
  }
}