require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const Medicine = require('./models/Medicine');

const initialMedicines = [
  {
    medicineName: 'Amoxil 500mg',
    brandName: 'Amoxil',
    genericName: 'Amoxicillin Trihydrate',
    activeIngredients: ['Amoxicillin Trihydrate (500mg)'],
    strength: '500 mg',
    dosageForm: 'Oral Capsule',
    category: 'Antibiotics / Penicillins',
    manufacturer: 'GlaxoSmithKline',
    barcode: '8901086001234',
    prescriptionRequired: true,
    clinicalUses: [
      'Bacterial respiratory tract infections',
      'Acute otitis media',
      'Streptococcal pharyngitis',
      'Skin and soft tissue infections',
      'Urinary tract infections',
    ],
    indications: [
      'Bacterial respiratory tract infections',
      'Otitis media',
      'Streptococcal pharyngitis',
      'Skin infections',
    ],
    dosage: 'Adults: 250mg to 500mg every 8 hours, or 500mg to 875mg every 12 hours depending on infection severity.',
    warnings: [
      'Anaphylactic reactions may occur in patients allergic to beta-lactams.',
      'Clostridioides difficile-associated diarrhea (CDAD) has been reported with antibiotic use.',
    ],
    precautions: [
      'Maintain adequate fluid intake to prevent amoxicillin crystalluria.',
      'Adjust dosage in patients with renal impairment.',
    ],
    contraindications: [
      'Hypersensitivity to amoxicillin or any penicillin class antibiotics',
      'History of amoxicillin-associated jaundice/hepatic dysfunction',
    ],
    sideEffects: [
      'Diarrhea',
      'Nausea and vomiting',
      'Skin rash / urticaria',
      'Headache',
      'Mild stomach pain',
    ],
    storage: 'Store below 25°C in a dry place protected from direct moisture and light.',
    drugInteractions: [
      'Probenecid (decreases renal tubular secretion of amoxicillin)',
      'Warfarin / Oral anticoagulants (may increase bleeding time)',
      'Methotrexate (may decrease clearance)',
    ],
    source: 'MediQ Verified Drug DB (FDA/CDSCO)',
    lastUpdatedDate: new Date(),
  },
  {
    medicineName: 'Lipitor 20mg',
    brandName: 'Lipitor',
    genericName: 'Atorvastatin Calcium',
    activeIngredients: ['Atorvastatin Calcium (20mg)'],
    strength: '20 mg',
    dosageForm: 'Film-Coated Oral Tablet',
    category: 'Cardiovascular / HMG-CoA Reductase Inhibitors (Statins)',
    manufacturer: 'Pfizer Inc.',
    barcode: '8901086005678',
    prescriptionRequired: true,
    clinicalUses: [
      'Primary hypercholesterolemia and mixed dyslipidemia',
      'Prevention of cardiovascular disease, myocardial infarction, and stroke in high-risk patients',
    ],
    indications: [
      'Primary hypercholesterolemia',
      'Prevention of cardiovascular events in high-risk patients',
    ],
    dosage: 'Initial dose 10mg to 20mg once daily in the evening. Dose range 10mg to 80mg once daily.',
    warnings: [
      'Rhabdomyolysis and myopathy risk; immediately report unexplained muscle pain or weakness.',
      'Liver enzyme abnormalities may occur; periodic liver function tests are advised.',
    ],
    precautions: [
      'Avoid excessive consumption of grapefruit juice (> 1.2 liters daily).',
      'Caution in heavy alcohol consumers or individuals with hepatic history.',
    ],
    contraindications: [
      'Active liver disease or unexplained persistent elevation of serum transaminases',
      'Pregnancy and nursing mothers (Category X)',
      'Known hypersensitivity to atorvastatin',
    ],
    sideEffects: [
      'Myalgia (muscle ache)',
      'Arthralgia (joint pain)',
      'Mild diarrhea / dyspepsia',
      'Nasopharyngitis',
    ],
    storage: 'Store at controlled room temperature 20°C to 25°C (68°F to 77°F).',
    drugInteractions: [
      'Cyclosporine, clarithromycin, itraconazole (markedly increases atorvastatin plasma concentration)',
      'Gemfibrozil and other fibrates (increased myopathy risk)',
    ],
    source: 'MediQ Verified Drug DB (FDA/CDSCO)',
    lastUpdatedDate: new Date(),
  },
  {
    medicineName: 'Glucophage 500mg',
    brandName: 'Glucophage',
    genericName: 'Metformin Hydrochloride',
    activeIngredients: ['Metformin Hydrochloride (500mg)'],
    strength: '500 mg',
    dosageForm: 'Extended Release Tablet',
    category: 'Antidiabetic Agents / Biguanides',
    manufacturer: 'Merck Healthcare',
    barcode: '8901086009876',
    prescriptionRequired: true,
    clinicalUses: [
      'Management of Type 2 Diabetes Mellitus as adjunct to diet and physical activity',
      'Reduction of diabetic complications and cardiovascular risks',
    ],
    indications: [
      'Type 2 Diabetes Mellitus management',
      'Insulin resistance regulation',
    ],
    dosage: 'Start with 500mg once daily with evening meal; titrate in 500mg increments up to 2000mg daily as prescribed.',
    warnings: [
      'Lactic acidosis: rare but serious metabolic complication. Risk increases with renal impairment, sepsis, and alcohol.',
      'Discontinue immediately before radiologic procedures using iodinated contrast.',
    ],
    precautions: [
      'Assess kidney function (eGFR) prior to initiation and at least annually thereafter.',
      'Monitor Vitamin B12 levels during prolonged therapy.',
    ],
    contraindications: [
      'Severe renal impairment (eGFR below 30 mL/min/1.73m²)',
      'Acute or chronic metabolic acidosis, including diabetic ketoacidosis',
      'Severe heart failure, shock, or severe acute respiratory insufficiency',
    ],
    sideEffects: [
      'Gastrointestinal distress (nausea, flatulence, abdominal cramping)',
      'Metallic taste in mouth',
      'Diarrhea',
      'Decreased vitamin B12 absorption',
    ],
    storage: 'Keep container tightly closed. Store at 15°C to 30°C away from excessive humidity.',
    drugInteractions: [
      'Cimetidine and cationic drugs excreted by renal tubular secretion',
      'Alcohol (increases risk of lactic acidosis)',
    ],
    source: 'MediQ Verified Drug DB (FDA/CDSCO)',
    lastUpdatedDate: new Date(),
  },
  {
    medicineName: 'Tylenol Extra Strength 500mg',
    brandName: 'Tylenol Extra Strength',
    genericName: 'Acetaminophen / Paracetamol',
    activeIngredients: ['Acetaminophen (500mg)'],
    strength: '500 mg',
    dosageForm: 'Oral Tablet',
    category: 'Analgesics & Antipyretics',
    manufacturer: 'Johnson & Johnson',
    barcode: '8901086003412',
    prescriptionRequired: false,
    clinicalUses: [
      'Temporary relief of minor aches and pains due to headache, muscle aches, backache, and toothache',
      'Fever reduction',
    ],
    indications: [
      'Headache, toothache, muscle aches',
      'Mild to moderate pain relief',
      'Fever reduction',
    ],
    dosage: 'Adults: 1 to 2 tablets (500mg - 1000mg) every 4 to 6 hours as needed. Maximum 4000mg per 24 hours.',
    warnings: [
      'Severe liver damage may occur if exceeding 4000mg in 24 hours or taken with 3+ alcoholic drinks daily.',
      'Check all other medications to avoid accidental acetaminophen overdose.',
    ],
    precautions: [
      'Do not use with any other drug containing acetaminophen.',
      'Ask doctor before use if you have chronic liver disease.',
    ],
    contraindications: [
      'Severe active hepatic disease or severe hepatic impairment',
      'Known hypersensitivity to acetaminophen/paracetamol',
    ],
    sideEffects: [
      'Rare at recommended dosage',
      'Allergic skin reactions (rare)',
      'Hepatotoxicity with accidental or chronic overdose',
    ],
    storage: 'Store between 20°C and 25°C. Avoid high temperature and humidity.',
    drugInteractions: [
      'Warfarin (frequent high-dose acetaminophen can prolong INR)',
      'Alcohol (potentiates hepatotoxicity)',
    ],
    source: 'MediQ Verified Drug DB (FDA/CDSCO)',
    lastUpdatedDate: new Date(),
  },
  {
    medicineName: 'Prilosec 20mg',
    brandName: 'Prilosec',
    genericName: 'Omeprazole',
    activeIngredients: ['Omeprazole Magnesium (20.6mg equivalent to 20mg Omeprazole)'],
    strength: '20 mg',
    dosageForm: 'Delayed-Release Capsule',
    category: 'Gastrointestinal / Proton Pump Inhibitor (PPI)',
    manufacturer: 'AstraZeneca',
    barcode: '8901086007721',
    prescriptionRequired: false,
    clinicalUses: [
      'Gastroesophageal reflux disease (GERD) with erosive esophagitis',
      'Duodenal and active benign gastric ulcers',
      'Hypersecretory conditions like Zollinger-Ellison syndrome',
    ],
    indications: [
      'Frequent heartburn relief (occurring 2 or more days a week)',
      'Erosive esophagitis healing',
      'Acid reflux management',
    ],
    dosage: '20mg once daily taken 30 to 60 minutes before breakfast with a full glass of water. Swallow whole.',
    warnings: [
      'May increase risk of bone fractures (hip, wrist, spine) with high dose or long-term therapy (> 1 year).',
      'Hypomagnesemia risk during prolonged use.',
    ],
    precautions: [
      'Do not crush or chew capsules or delayed-release pellets.',
      'Symptomatic response does not preclude the presence of gastric malignancy.',
    ],
    contraindications: [
      'Concomitant administration with rilpivirine-containing products',
      'Known hypersensitivity to substituted benzimidazoles',
    ],
    sideEffects: [
      'Headache',
      'Abdominal pain',
      'Constipation or diarrhea',
      'Flatulence',
      'Dizziness',
    ],
    storage: 'Store between 15°C and 30°C in a dry place protected from light and moisture.',
    drugInteractions: [
      'Clopidogrel (omeprazole inhibits CYP2C19, potentially lowering antiplatelet effect)',
      'Diazepam, phenytoin, methotrexate (clearance may be reduced)',
    ],
    source: 'MediQ Verified Drug DB (FDA/CDSCO)',
    lastUpdatedDate: new Date(),
  },
  {
    medicineName: 'Augmentin 625 Duo',
    brandName: 'Augmentin',
    genericName: 'Amoxicillin + Clavulanic Acid',
    activeIngredients: ['Amoxicillin (500mg)', 'Clavulanic Acid (125mg)'],
    strength: '625 mg',
    dosageForm: 'Oral Film-Coated Tablet',
    category: 'Antibiotics / Penicillin Combinations',
    manufacturer: 'GlaxoSmithKline',
    barcode: '8901117001423',
    prescriptionRequired: true,
    clinicalUses: [
      'Acute bacterial sinusitis',
      'Community-acquired pneumonia and acute bronchitis exacerbations',
      'Skin and soft tissue infections caused by beta-lactamase producing strains',
      'Dental abscesses and complicated UTI',
    ],
    indications: [
      'Severe respiratory tract infections',
      'Bacterial sinusitis & otitis media',
      'Beta-lactamase resistant infections',
    ],
    dosage: 'One 625mg tablet twice daily or three times daily at the start of a meal to minimize gastrointestinal intolerance.',
    warnings: [
      'Hepatic dysfunction, including hepatitis and cholestatic jaundice, has been associated with clavulanate.',
      'Serious hypersensitivity reactions in penicillin-allergic patients.',
    ],
    precautions: [
      'Take at start of meals to improve absorption and reduce GI side effects.',
      'Prolonged use may result in fungal or bacterial superinfections.',
    ],
    contraindications: [
      'History of amoxicillin/clavulanate-associated jaundice or hepatic dysfunction',
      'Hypersensitivity to penicillins or cephalosporins',
    ],
    sideEffects: [
      'Diarrhea and loose stools',
      'Nausea and abdominal discomfort',
      'Vaginal candidiasis',
      'Skin rashes',
    ],
    storage: 'Store below 25°C in moisture-proof packaging.',
    drugInteractions: [
      'Allopurinol (increased incidence of rash)',
      'Oral contraceptives (possible reduced efficacy)',
    ],
    source: 'MediQ Verified Drug DB (FDA/CDSCO)',
    lastUpdatedDate: new Date(),
  },
  {
    medicineName: 'Pan 40 Tablet',
    brandName: 'Pan 40',
    genericName: 'Pantoprazole Sodium',
    activeIngredients: ['Pantoprazole Sodium (40mg)'],
    strength: '40 mg',
    dosageForm: 'Gastro-resistant Tablet',
    category: 'Gastrointestinal / Proton Pump Inhibitor',
    manufacturer: 'Alkem Laboratories Ltd.',
    barcode: '8901456789012',
    prescriptionRequired: true,
    clinicalUses: [
      'Erosive esophagitis and gastroesophageal reflux disease',
      'Zollinger-Ellison syndrome and pathological hypersecretion',
      'Prevention of NSAID-induced peptic ulcers',
    ],
    indications: [
      'Acidity, heartburn and GERD',
      'Peptic ulcer treatment and prophylaxis',
    ],
    dosage: '40mg once daily taken 30 to 60 minutes before morning breakfast.',
    warnings: [
      'Clostridium difficile-associated diarrhea has been reported.',
      'Bone fractures and hypomagnesemia with long-term use.',
    ],
    precautions: [
      'Swallow tablet whole; do not chew, split, or crush.',
      'Check magnesium and Vitamin B12 levels during prolonged therapy.',
    ],
    contraindications: [
      'Hypersensitivity to pantoprazole or substituted benzimidazoles',
      'Co-administration with rilpivirine',
    ],
    sideEffects: [
      'Headache',
      'Diarrhea',
      'Nausea and vomiting',
      'Flatulence',
    ],
    storage: 'Store in cool and dry place away from direct sunlight.',
    drugInteractions: [
      'Atazanavir and nelfinavir (decreased absorption)',
      'Methotrexate (potential toxicity)',
    ],
    source: 'MediQ Verified Drug DB (FDA/CDSCO)',
    lastUpdatedDate: new Date(),
  },
];

async function seedMedicines() {
  try {
    const mongoUri = process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB for medicine seeding...');

    for (const med of initialMedicines) {
      await Medicine.findOneAndUpdate(
        { barcode: med.barcode },
        { $set: med },
        { upsert: true, new: true }
      );
      console.log(`💊 Seeded/Updated: ${med.brandName} (${med.barcode})`);
    }

    console.log('✅ Medicine seeding completed successfully!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Medicine seeding failed:', error);
    process.exit(1);
  }
}

seedMedicines();
