const axios = require('axios');
const Medicine = require('../models/Medicine');

// ─────────────────────────────────────────────────────────────────
// Helper: Format DB medicine into standard response
// ─────────────────────────────────────────────────────────────────
const formatDbMedicine = (m) => ({
  _id: m._id,
  medicineName: m.medicineName || m.brandName,
  brandName: m.brandName,
  genericName: m.genericName,
  activeIngredients: m.activeIngredients || [],
  strength: m.strength || 'Standard formulation',
  dosageForm: m.dosageForm || 'Oral',
  category: m.category || 'Pharmaceutical',
  manufacturer: m.manufacturer,
  barcode: m.barcode,
  prescriptionRequired: !!m.prescriptionRequired,
  indications: m.indications || [],
  clinicalUses: m.clinicalUses || m.indications || [],
  dosage: m.dosage || 'Consult prescribing doctor or packaging guide.',
  warnings: m.warnings || [],
  precautions: m.precautions || [],
  contraindications: m.contraindications || [],
  sideEffects: m.sideEffects || [],
  storage: m.storage || 'Store in a cool, dry place away from sunlight.',
  drugInteractions: m.drugInteractions || [],
  source: m.source || 'MediQ Verified Drug DB',
  lastUpdatedDate: m.lastUpdatedDate || m.updatedAt || new Date(),
});

// ─────────────────────────────────────────────────────────────────
// External API 1: OpenFDA (US drugs by NDC / barcode)
// ─────────────────────────────────────────────────────────────────
const fetchFromOpenFDA = async (barcode) => {
  const fdaUrl = `https://api.fda.gov/drug/label.json?search=openfda.package_ndc:"${encodeURIComponent(barcode)}"&limit=1`;
  const fdaRes = await axios.get(fdaUrl, { timeout: 7000 });
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
      barcode,
      prescriptionRequired: isRx,
      indications: result.indications_and_usage?.slice(0, 4).map((s) => s.replace(/<[^>]+>/g, '').trim()) || [],
      clinicalUses: result.purpose?.map((s) => s.replace(/<[^>]+>/g, '').trim()) || [],
      dosage: result.dosage_and_administration?.[0]?.replace(/<[^>]+>/g, '').substring(0, 500) || 'Refer to physician prescription',
      warnings: result.warnings?.slice(0, 3).map((w) => w.replace(/<[^>]+>/g, '').trim()) || [],
      precautions: result.precautions?.slice(0, 3).map((p) => p.replace(/<[^>]+>/g, '').trim()) || [],
      contraindications: result.contraindications?.slice(0, 3).map((c) => c.replace(/<[^>]+>/g, '').trim()) || [],
      sideEffects: result.adverse_reactions?.slice(0, 3).map((a) => a.replace(/<[^>]+>/g, '').trim()) || [],
      storage: result.storage_and_handling?.[0]?.replace(/<[^>]+>/g, '').trim() || 'Store as per packaging label',
      drugInteractions: result.drug_interactions?.slice(0, 3).map((d) => d.replace(/<[^>]+>/g, '').trim()) || [],
      source: 'U.S. FDA Drug Label Database',
      lastUpdatedDate: new Date(),
    };
  }
  return null;
};

// ─────────────────────────────────────────────────────────────────
// External API 2: RxNorm (NIH/NLM - Free, supports Indian brands)
// ─────────────────────────────────────────────────────────────────
const fetchFromRxNorm = async (barcode) => {
  // Try to find drug info by NDC code via RxNorm (NIH Free API)
  const rxNormUrl = `https://rxnav.nlm.nih.gov/REST/ndcstatus.json?ndc=${encodeURIComponent(barcode)}`;
  const rxRes = await axios.get(rxNormUrl, { timeout: 7000 });
  const ndcInfo = rxRes.data?.ndcStatus;

  if (ndcInfo && ndcInfo.rxcui) {
    const rxcui = ndcInfo.rxcui;
    // Fetch complete drug info using RXCUI
    const [propRes, ingRes] = await Promise.allSettled([
      axios.get(`https://rxnav.nlm.nih.gov/REST/rxcui/${rxcui}/allProperties.json?prop=all`, { timeout: 7000 }),
      axios.get(`https://rxnav.nlm.nih.gov/REST/rxcui/${rxcui}/related.json?tty=IN+BN`, { timeout: 7000 }),
    ]);

    const props = propRes.status === 'fulfilled' ? propRes.value.data?.propConceptGroup?.propConcept || [] : [];
    const related = ingRes.status === 'fulfilled' ? ingRes.value.data?.relatedGroup?.conceptGroup || [] : [];

    const getName = (type) => props.find((p) => p.propName === type)?.propValue || '';
    const brandName = getName('RxNorm Name') || getName('Brand Name') || barcode;
    const genericName = getName('DISPLAY_NAME') || getName('Active Ingredient') || brandName;

    const ingredients = related
      .filter((g) => g.tty === 'IN' || g.tty === 'BN')
      .flatMap((g) => g.conceptProperties || [])
      .map((c) => c.name)
      .filter(Boolean);

    return {
      _id: null,
      medicineName: brandName,
      brandName,
      genericName,
      activeIngredients: ingredients.length > 0 ? ingredients : [genericName],
      strength: getName('AVAILABLE_STRENGTH') || 'As labeled',
      dosageForm: getName('Dose Form') || 'Pharmaceutical',
      category: 'Verified Pharmaceutical (RxNorm/NIH)',
      manufacturer: getName('Labeler') || 'Pharmaceutical Manufacturer',
      barcode,
      prescriptionRequired: false,
      indications: ['Refer to prescribing information or pharmacist.'],
      clinicalUses: [],
      dosage: 'Consult physician or refer to package insert for dosage instructions.',
      warnings: ['Always follow prescribing physician recommendations.'],
      precautions: [],
      contraindications: [],
      sideEffects: [],
      storage: 'Store as per packaging label at room temperature.',
      drugInteractions: [],
      source: 'NIH RxNorm Drug Database (rxnav.nlm.nih.gov)',
      lastUpdatedDate: new Date(),
    };
  }
  return null;
};

// ─────────────────────────────────────────────────────────────────
// External API 3: UPC Item DB (generic barcode product lookup)
// ─────────────────────────────────────────────────────────────────
const fetchFromUPCItemDB = async (barcode) => {
  const upcUrl = `https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(barcode)}`;
  const upcRes = await axios.get(upcUrl, { timeout: 7000 });
  const item = upcRes.data?.items?.[0];

  if (item && item.title) {
    return {
      _id: null,
      medicineName: item.title,
      brandName: item.brand || item.title,
      genericName: item.description || item.title,
      activeIngredients: item.ingredients ? [item.ingredients.substring(0, 400)] : ['Listed on packaging label'],
      strength: item.size || 'Packaged quantity',
      dosageForm: item.category || 'Consumer packaged formulation',
      category: item.category || 'Consumer Healthcare / OTC',
      manufacturer: item.brand || 'Manufacturer on label',
      barcode,
      prescriptionRequired: false,
      indications: ['Consumer OTC health/pharmaceutical formulation'],
      clinicalUses: ['Supportive healthcare / nutritional wellness'],
      dosage: 'Follow instructions on package label.',
      warnings: ['Check packaging for safety information and allergen notices.'],
      precautions: ['Do not use if seal is broken or tampered with.'],
      contraindications: ['Known sensitivity or allergy to ingredients listed on packaging.'],
      sideEffects: ['Discontinue use if hypersensitivity occurs.'],
      storage: 'Store in a cool, dry place at room temperature.',
      drugInteractions: [],
      source: 'UPC Item DB — Global Barcode Registry',
      lastUpdatedDate: new Date(),
    };
  }
  return null;
};

// ─────────────────────────────────────────────────────────────────
// External API 4: Open Food Facts (OTC / health product barcode)
// ─────────────────────────────────────────────────────────────────
const fetchFromOpenFoodFacts = async (barcode) => {
  const offUrl = `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json`;
  const offRes = await axios.get(offUrl, { timeout: 7000 });
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
      barcode,
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
      source: 'Open Food Facts / Global Health Product Registry',
      lastUpdatedDate: new Date(),
    };
  }
  return null;
};

// ─────────────────────────────────────────────────────────────────
// MAIN: Search medicine by barcode
// Priority:
//   1. MongoDB (case-insensitive, exact + partial)
//   2. OpenFDA (US NDC)
//   3. RxNorm / NIH (free, supports many global drugs)
//   4. UPC Item DB (generic barcode registry)
//   5. Open Food Facts (OTC / consumer health)
// ─────────────────────────────────────────────────────────────────
const searchByBarcode = async (barcode) => {
  const cleanBarcode = String(barcode || '').trim();
  if (!cleanBarcode) return null;

  // ── Step 1: MongoDB — case-insensitive exact match ──
  const dbMedicine = await Medicine.findOne({
    barcode: { $regex: new RegExp(`^${cleanBarcode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
  });
  if (dbMedicine) return formatDbMedicine(dbMedicine);

  // ── Step 2: MongoDB — partial / fuzzy match (if barcode is partial) ──
  if (cleanBarcode.length >= 4) {
    const partialMatch = await Medicine.findOne({
      barcode: { $regex: new RegExp(cleanBarcode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
    });
    if (partialMatch) return formatDbMedicine(partialMatch);
  }

  // ── Step 3: External APIs (parallel for speed) ──
  const apiResults = await Promise.allSettled([
    fetchFromOpenFDA(cleanBarcode),
    fetchFromRxNorm(cleanBarcode),
    fetchFromUPCItemDB(cleanBarcode),
    fetchFromOpenFoodFacts(cleanBarcode),
  ]);

  for (const result of apiResults) {
    if (result.status === 'fulfilled' && result.value) {
      return result.value;
    }
  }

  // ── Step 4: Not found anywhere ──
  return null;
};

// ─────────────────────────────────────────────────────────────────
// Search medicines by name / keyword
// ─────────────────────────────────────────────────────────────────
const searchByName = async (query) => {
  const cleanQuery = String(query || '').trim();
  if (!cleanQuery) return [];

  // Search MongoDB first (full-text + regex)
  const regex = new RegExp(cleanQuery, 'i');
  const dbMedicines = await Medicine.find({
    $or: [
      { brandName: regex },
      { genericName: regex },
      { category: regex },
      { activeIngredients: regex },
      { medicineName: regex },
    ],
  }).limit(20);

  if (dbMedicines && dbMedicines.length > 0) {
    return dbMedicines.map(formatDbMedicine);
  }

  // If not in DB, try OpenFDA name search
  try {
    const fdaUrl = `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${encodeURIComponent(cleanQuery)}"+openfda.generic_name:"${encodeURIComponent(cleanQuery)}"&limit=5`;
    const fdaRes = await axios.get(fdaUrl, { timeout: 7000 });
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
          indications: r.indications_and_usage?.slice(0, 3).map((s) => s.replace(/<[^>]+>/g, '').trim()) || [],
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

  // Try RxNorm name search
  try {
    const rxNameUrl = `https://rxnav.nlm.nih.gov/REST/drugs.json?name=${encodeURIComponent(cleanQuery)}`;
    const rxRes = await axios.get(rxNameUrl, { timeout: 7000 });
    const groups = rxRes.data?.drugGroup?.conceptGroup || [];
    const drugs = groups.flatMap((g) => g.conceptProperties || []).slice(0, 5);

    if (drugs.length > 0) {
      return drugs.map((d, i) => ({
        _id: `rxnorm-${i}`,
        medicineName: d.name,
        brandName: d.name,
        genericName: d.synonym || d.name,
        activeIngredients: [d.name],
        strength: 'As labeled',
        dosageForm: d.tty || 'Pharmaceutical',
        category: 'Verified Pharmaceutical (RxNorm/NIH)',
        manufacturer: 'Pharmaceutical Manufacturer',
        barcode: d.rxcui || 'N/A',
        prescriptionRequired: false,
        indications: ['Refer to prescribing information or pharmacist.'],
        clinicalUses: [],
        dosage: 'Consult physician or refer to package insert.',
        warnings: ['Always follow prescribing physician recommendations.'],
        precautions: [],
        contraindications: [],
        sideEffects: [],
        storage: 'Store as per packaging label.',
        drugInteractions: [],
        source: 'NIH RxNorm Drug Database',
        lastUpdatedDate: new Date(),
      }));
    }
  } catch {
    // RxNorm name search returned nothing
  }

  return [];
};

// ─────────────────────────────────────────────────────────────────
// Get all medicines from MongoDB
// ─────────────────────────────────────────────────────────────────
const getAllMedicines = async () => {
  return await Medicine.find().sort({ brandName: 1 });
};

module.exports = {
  searchByBarcode,
  searchByName,
  getAllMedicines,
};
