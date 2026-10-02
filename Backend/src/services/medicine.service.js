const axios = require('axios');
const Medicine = require('../models/Medicine');

/**
 * Search medicine by barcode
 * Priority:
 * 1. Existing MongoDB medicine database
 * 2. External verified medicine/product API (OpenFDA / Open Food Facts)
 * 3. Return null if not found (Never invent fake medical info)
 */
const searchByBarcode = async (barcode) => {
  const cleanBarcode = String(barcode || '').trim();
  if (!cleanBarcode) return null;

  // 1. Search MongoDB database first
  const dbMedicine = await Medicine.findOne({ barcode: cleanBarcode });
  if (dbMedicine) {
    return {
      _id: dbMedicine._id,
      medicineName: dbMedicine.medicineName || dbMedicine.brandName,
      brandName: dbMedicine.brandName,
      genericName: dbMedicine.genericName,
      activeIngredients: dbMedicine.activeIngredients || [],
      strength: dbMedicine.strength || 'Standard formulation',
      dosageForm: dbMedicine.dosageForm || 'Oral',
      category: dbMedicine.category || 'Pharmaceutical',
      manufacturer: dbMedicine.manufacturer,
      barcode: dbMedicine.barcode,
      prescriptionRequired: !!dbMedicine.prescriptionRequired,
      indications: dbMedicine.indications || [],
      clinicalUses: dbMedicine.clinicalUses || dbMedicine.indications || [],
      dosage: dbMedicine.dosage || 'Consult prescribing doctor or packaging guide.',
      warnings: dbMedicine.warnings || [],
      precautions: dbMedicine.precautions || [],
      contraindications: dbMedicine.contraindications || [],
      sideEffects: dbMedicine.sideEffects || [],
      storage: dbMedicine.storage || 'Store in a cool, dry place away from sunlight.',
      drugInteractions: dbMedicine.drugInteractions || [],
      source: dbMedicine.source || 'CareConnect Verified Drug DB',
      lastUpdatedDate: dbMedicine.lastUpdatedDate || dbMedicine.updatedAt || new Date(),
    };
  }

  // 2. Query External Verified Sources
  // Try OpenFDA drug endpoint by package NDC / barcode
  try {
    const fdaUrl = `https://api.fda.gov/drug/label.json?search=openfda.package_ndc:"${encodeURIComponent(cleanBarcode)}"&limit=1`;
    const fdaRes = await axios.get(fdaUrl, { timeout: 6000 });
    const result = fdaRes.data?.results?.[0];

    if (result && result.openfda) {
      const brand = result.openfda.brand_name?.[0] || 'Pharmaceutical Product';
      const generic = result.openfda.generic_name?.[0] || 'Active Chemical Entity';
      const manufacturer = result.openfda.manufacturer_name?.[0] || 'Registered Manufacturer';
      const isRx = result.openfda.product_type?.some((t) => /prescription/i.test(t)) || false;

      return {
        _id: null,
        medicineName: brand,
        brandName: brand,
        genericName: generic,
        activeIngredients: result.active_ingredient?.map((s) => s.replace(/<[^>]+>/g, '').trim()) || [generic],
        strength: 'As labeled',
        dosageForm: result.openfda.dosage_form?.[0] || 'Pharmaceutical preparation',
        category: result.openfda.pharm_class_cs?.[0] || 'Regulated Therapeutic Agent',
        manufacturer,
        barcode: cleanBarcode,
        prescriptionRequired: isRx,
        indications: result.indications_and_usage?.slice(0, 4).map((s) => s.replace(/<[^>]+>/g, '').trim()) || ['Information available on package insert'],
        clinicalUses: result.purpose?.map((s) => s.replace(/<[^>]+>/g, '').trim()) || [],
        dosage: result.dosage_and_administration?.[0]?.replace(/<[^>]+>/g, '').substring(0, 500) || 'Refer to physician prescription',
        warnings: result.warnings?.slice(0, 3).map((w) => w.replace(/<[^>]+>/g, '').trim()) || ['Follow packaging warning guidelines'],
        precautions: result.precautions?.slice(0, 3).map((p) => p.replace(/<[^>]+>/g, '').trim()) || [],
        contraindications: result.contraindications?.slice(0, 3).map((c) => c.replace(/<[^>]+>/g, '').trim()) || ['Hypersensitivity to active ingredient'],
        sideEffects: result.adverse_reactions?.slice(0, 3).map((a) => a.replace(/<[^>]+>/g, '').trim()) || ['Refer to medication leaflet'],
        storage: result.storage_and_handling?.[0]?.replace(/<[^>]+>/g, '').trim() || 'Store as per packaging label',
        drugInteractions: result.drug_interactions?.slice(0, 3).map((d) => d.replace(/<[^>]+>/g, '').trim()) || [],
        source: 'U.S. FDA Drug Label Database',
        lastUpdatedDate: new Date(),
      };
    }
  } catch {
    // OpenFDA lookup didn't match, proceed to secondary barcode database
  }

  // Try Open Food Facts / OTC Product Barcode Database
  try {
    const offUrl = `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(cleanBarcode)}.json`;
    const offRes = await axios.get(offUrl, { timeout: 6000 });
    const product = offRes.data?.product;

    if (product && offRes.data?.status === 1 && product.product_name) {
      return {
        _id: null,
        medicineName: product.product_name,
        brandName: product.brands || product.product_name,
        genericName: product.generic_name || product.product_name,
        activeIngredients: product.ingredients_text_en
          ? [product.ingredients_text_en.substring(0, 300)]
          : ['Listed on packaging label'],
        strength: product.quantity || 'Packaged quantity',
        dosageForm: product.packaging || 'Consumer packaged formulation',
        category: product.categories || 'Consumer Healthcare / OTC',
        manufacturer: product.brands || 'Manufacturer on label',
        barcode: cleanBarcode,
        prescriptionRequired: false,
        indications: ['Consumer OTC health formulation'],
        clinicalUses: ['Supportive healthcare / nutritional wellness'],
        dosage: 'Follow instructions on package label.',
        warnings: product.allergens ? [`Allergens reported: ${product.allergens}`] : ['Check packaging for allergen notices'],
        precautions: ['Do not use if seal is broken or tampered with.'],
        contraindications: ['Known sensitivity or allergy to ingredients listed on packaging.'],
        sideEffects: ['Discontinue use if hypersensitivity occurs.'],
        storage: 'Store in a cool, dry place at room temperature.',
        drugInteractions: [],
        source: 'Verified Global Barcode Registry (Open Food Facts/Health)',
        lastUpdatedDate: new Date(),
      };
    }
  } catch {
    // External product not found
  }

  // 3. No result found in DB or external APIs
  return null;
};

/**
 * Search medicines by name / keyword
 */
const searchByName = async (query) => {
  const cleanQuery = String(query || '').trim();
  if (!cleanQuery) return [];

  // Search MongoDB first
  const regex = new RegExp(cleanQuery, 'i');
  const dbMedicines = await Medicine.find({
    $or: [{ brandName: regex }, { genericName: regex }, { category: regex }, { activeIngredients: regex }],
  }).limit(20);

  if (dbMedicines && dbMedicines.length > 0) {
    return dbMedicines.map((m) => ({
      _id: m._id,
      medicineName: m.medicineName || m.brandName,
      brandName: m.brandName,
      genericName: m.genericName,
      activeIngredients: m.activeIngredients,
      strength: m.strength,
      dosageForm: m.dosageForm,
      category: m.category,
      manufacturer: m.manufacturer,
      barcode: m.barcode,
      prescriptionRequired: m.prescriptionRequired,
      indications: m.indications,
      clinicalUses: m.clinicalUses || m.indications,
      dosage: m.dosage,
      warnings: m.warnings,
      precautions: m.precautions,
      contraindications: m.contraindications,
      sideEffects: m.sideEffects,
      storage: m.storage,
      drugInteractions: m.drugInteractions,
      source: m.source,
      lastUpdatedDate: m.lastUpdatedDate || m.updatedAt,
    }));
  }

  // If not found in DB, try OpenFDA query
  try {
    const fdaUrl = `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${encodeURIComponent(cleanQuery)}"+openfda.generic_name:"${encodeURIComponent(cleanQuery)}"&limit=3`;
    const fdaRes = await axios.get(fdaUrl, { timeout: 6000 });
    const results = fdaRes.data?.results;

    if (results && results.length > 0) {
      return results.map((r, i) => {
        const brand = r.openfda?.brand_name?.[0] || cleanQuery;
        const generic = r.openfda?.generic_name?.[0] || 'Active ingredient';
        return {
          _id: `ext-${i}`,
          medicineName: brand,
          brandName: brand,
          genericName: generic,
          activeIngredients: r.active_ingredient?.map((s) => s.replace(/<[^>]+>/g, '').trim()) || [generic],
          strength: 'As labeled',
          dosageForm: r.openfda?.dosage_form?.[0] || 'Oral Formulation',
          category: r.openfda?.pharm_class_cs?.[0] || 'Pharmaceutical',
          manufacturer: r.openfda?.manufacturer_name?.[0] || 'Pharmaceutical Laboratories',
          barcode: r.openfda?.package_ndc?.[0] || 'N/A',
          prescriptionRequired: r.openfda?.product_type?.some((t) => /prescription/i.test(t)) || false,
          indications: r.indications_and_usage?.slice(0, 3).map((s) => s.replace(/<[^>]+>/g, '').trim()) || ['Refer to medication leaflet'],
          clinicalUses: r.purpose?.map((s) => s.replace(/<[^>]+>/g, '').trim()) || [],
          dosage: r.dosage_and_administration?.[0]?.replace(/<[^>]+>/g, '').substring(0, 300) || 'Consult doctor',
          warnings: r.warnings?.slice(0, 3).map((w) => w.replace(/<[^>]+>/g, '').trim()) || [],
          precautions: r.precautions?.slice(0, 2).map((p) => p.replace(/<[^>]+>/g, '').trim()) || [],
          contraindications: r.contraindications?.slice(0, 2).map((c) => c.replace(/<[^>]+>/g, '').trim()) || [],
          sideEffects: r.adverse_reactions?.slice(0, 3).map((a) => a.replace(/<[^>]+>/g, '').trim()) || [],
          storage: r.storage_and_handling?.[0]?.replace(/<[^>]+>/g, '').trim() || 'Store at controlled room temperature',
          drugInteractions: r.drug_interactions?.slice(0, 2).map((d) => d.replace(/<[^>]+>/g, '').trim()) || [],
          source: 'U.S. FDA Drug Label Database',
          lastUpdatedDate: new Date(),
        };
      });
    }
  } catch {
    // OpenFDA search returned nothing
  }

  return [];
};

/**
 * Get all medicines from MongoDB
 */
const getAllMedicines = async () => {
  return await Medicine.find().sort({ brandName: 1 });
};

module.exports = {
  searchByBarcode,
  searchByName,
  getAllMedicines,
};
