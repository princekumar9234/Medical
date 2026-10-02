const axios = require('axios');

/**
 * Search medicine/product by name using OpenFDA API
 */
const searchByName = async (name) => {
  try {
    const url = `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${encodeURIComponent(name)}"&limit=1`;
    const response = await axios.get(url, { timeout: 8000 });
    const results = response.data?.results?.[0];

    if (!results) return null;

    return {
      productName:
        results.openfda?.brand_name?.[0] ||
        results.openfda?.generic_name?.[0] ||
        name,
      manufacturer: results.openfda?.manufacturer_name?.[0] || 'Unknown',
      category: results.openfda?.product_type?.[0] || 'Drug',
      activeIngredients:
        results.active_ingredient?.map((s) =>
          s.replace(/<[^>]+>/g, '').trim()
        ) || [],
      usageInfo: results.indications_and_usage?.[0]?.replace(/<[^>]+>/g, '').trim() || null,
      warnings: results.warnings?.slice(0, 3).map((w) => w.replace(/<[^>]+>/g, '').trim()) || [],
      generalInfo: results.description?.[0]?.replace(/<[^>]+>/g, '').trim() || null,
      source: 'U.S. FDA Drug Label Database',
    };
  } catch {
    return null;
  }
};

/**
 * Search product by barcode using Open Food Facts API
 */
const searchByBarcode = async (barcode) => {
  try {
    const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;
    const response = await axios.get(url, { timeout: 8000 });
    const product = response.data?.product;

    if (!product || response.data?.status === 0) return null;

    return {
      productName: product.product_name || 'Unknown Product',
      manufacturer: product.brands || 'Unknown',
      category: product.categories || 'Food & Beverage',
      activeIngredients: product.ingredients_text_en
        ? [product.ingredients_text_en.substring(0, 500)]
        : [],
      usageInfo: null,
      warnings: product.allergens ? [`Allergens: ${product.allergens}`] : [],
      generalInfo: product.generic_name || null,
      source: 'Open Food Facts',
    };
  } catch {
    return null;
  }
};

module.exports = { searchByName, searchByBarcode };
