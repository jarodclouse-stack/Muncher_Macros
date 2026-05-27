async function test() {
  const barcode = '0028400040112'; // Cheetos Crunchy
  const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;
  
  const res = await fetch(url, {
    headers: { 'User-Agent': 'MuncherMacros/1.0' }
  });
  const data = await res.json();
  const p = data.product;
  
  const n = p.nutriments || {};
  
  const getVal = (keys, scale = 1, roundDecs = 1) => {
    for (const key of keys) {
      if (n[key] !== undefined && n[key] !== null) {
        const val = Number(n[key]);
        if (Number.isFinite(val)) {
          const scaled = val * scale;
          const factor = Math.pow(10, roundDecs);
          return Math.round(scaled * factor) / factor;
        }
      }
    }
    return 0;
  };

  const cal = n['energy-kcal_100g'] || (n['energy-kcal_value'] || 0);
  const prot = n['proteins_100g'] || 0;
  const carb = n['carbohydrates_100g'] || 0;
  const fat = n['fat_100g'] || 0;

  const food = {
    name: (p.brands ? p.brands + ' ' : '') + (p.product_name_en || p.product_name || 'Unknown Item'),
    serving: '100g',
    sQty: 100,
    sUnit: 'g',
    cal: Math.round(cal),
    p: Math.round(prot * 10) / 10,
    c: Math.round(carb * 10) / 10,
    f: Math.round(fat * 10) / 10,
    fb: getVal(['fiber_100g', 'fiber'], 1, 1),
    sugars: getVal(['sugars_100g', 'sugars'], 1, 1),
    sat: getVal(['saturated-fat_100g', 'saturated-fat'], 1, 1),
    trans: getVal(['trans-fat_100g', 'trans-fat'], 1, 1),
    mono: getVal(['monounsaturated-fat_100g', 'monounsaturated-fat'], 1, 1),
    poly: getVal(['polyunsaturated-fat_100g', 'polyunsaturated-fat'], 1, 1),
    chol: getVal(['cholesterol_100g', 'cholesterol'], 1000, 0),
    Sodium: getVal(['sodium_100g', 'sodium'], 1000, 0),
    Potassium: getVal(['potassium_100g', 'potassium'], 1000, 0),
    Calcium: getVal(['calcium_100g', 'calcium'], 1000, 0),
    Iron: getVal(['iron_100g', 'iron'], 1000, 1),
    'Vitamin C': getVal(['vitamin-c_100g', 'vitamin-c'], 1000, 1),
    'Vitamin A': getVal(['vitamin-a_100g', 'vitamin-a'], 1000000, 0),
    'Vitamin D': getVal(['vitamin-d_100g', 'vitamin-d'], 1000000, 1),
    'Vitamin B1': getVal(['vitamin-b1_100g', 'vitamin-b1'], 1000, 2),
    'Vitamin B2': getVal(['vitamin-b2_100g', 'vitamin-b2'], 1000, 2),
    'Vitamin B3': getVal(['vitamin-b3_100g', 'vitamin-b3'], 1000, 2),
    'Vitamin B5': getVal(['vitamin-b5_100g', 'vitamin-b5'], 1000, 2),
    'Vitamin B6': getVal(['vitamin-b6_100g', 'vitamin-b6'], 1000, 2),
    'Vitamin B12': getVal(['vitamin-b12_100g', 'vitamin-b12'], 1000000, 2),
    'Vitamin E': getVal(['vitamin-e_100g', 'vitamin-e'], 1000, 1),
    'Vitamin K': getVal(['vitamin-k_100g', 'vitamin-k'], 1000000, 0),
    Magnesium: getVal(['magnesium_100g', 'magnesium'], 1000, 0),
    Zinc: getVal(['zinc_100g', 'zinc'], 1000, 1),
    Phosphorus: getVal(['phosphorus_100g', 'phosphorus'], 1000, 0),
    Manganese: getVal(['manganese_100g', 'manganese'], 1000, 2),
    Selenium: getVal(['selenium_100g', 'selenium'], 1000000, 0),
    Copper: getVal(['copper_100g', 'copper'], 1000, 3),
    barcode: p.code || p._id,
    _src: 'off'
  };

  console.log("Mapped food result:");
  console.log(JSON.stringify(food, null, 2));
}
test();
