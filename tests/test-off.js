async function test() {
  const codes = ['028400043815', '049000050103', '0049000050103'];
  for (const c of codes) {
    let offRes = await fetch(`https://world.openfoodfacts.org/api/v0/product/${c}.json`);
    let data = await offRes.json();
    console.log(`Status for ${c}:`, data.status);
    if (data.status === 1) {
      console.log("Product name:", data.product.product_name);
      console.log("Lang:", data.product.lang);
    }
  }
}
test();
