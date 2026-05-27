async function test() {
  const barcode = '0028400040112'; // Lays Classic Chips EAN/UPC
  const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;
  
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'MuncherMacros/1.0' }
    });
    const data = await res.json();
    console.log("Status:", data.status);
    if (data.status === 1) {
      console.log("Product Name:", data.product.product_name);
      console.log("Nutriments keys:", Object.keys(data.product.nutriments || {}));
      console.log("Nutriments sample:", JSON.stringify(data.product.nutriments, null, 2));
    } else {
      console.log("Product not found");
    }
  } catch (err) {
    console.error("Error:", err);
  }
}
test();
