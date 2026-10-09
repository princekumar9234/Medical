import { useState, useEffect } from 'react';
import { 
  Search, 
  Pill, 
  Barcode, 
  Camera,
  AlertCircle, 
  Info, 
  Sparkles,
  Loader2,
  CheckCircle2,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { medicineService } from '../services/medicine.service';
import Button from '../../../components/ui/Button';
import BarcodeScannerModal from '../components/BarcodeScannerModal';
import MedicineDetailsModal from '../components/MedicineDetailsModal';
import MedicineCard from '../components/MedicineCard';
import RecentScans from '../components/RecentScans';

export const MedicineSearchPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [medicines, setMedicines] = useState([]);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerLoading, setScannerLoading] = useState(false);
  const [notFoundBarcode, setNotFoundBarcode] = useState(null);
  const [refreshHistoryTrigger, setRefreshHistoryTrigger] = useState(0);

  // Initial verified medicines fallback if offline
  const defaultMedicines = [
    {
      _id: 'med-1',
      brandName: 'Amoxil',
      genericName: 'Amoxicillin Trihydrate',
      category: 'Antibiotics / Penicillins',
      manufacturer: 'GlaxoSmithKline',
      barcode: '8901086001234',
      dosageForm: 'Oral Capsule 500mg',
      prescriptionRequired: true,
      clinicalUses: ['Bacterial respiratory tract infections', 'Otitis media', 'Streptococcal pharyngitis', 'Skin infections'],
      indications: ['Bacterial respiratory tract infections', 'Otitis media', 'Streptococcal pharyngitis', 'Skin infections'],
      dosage: 'Adults: 250mg to 500mg every 8 hours or 500mg to 875mg every 12 hours.',
      sideEffects: ['Nausea', 'Diarrhea', 'Skin rash', 'Headache'],
      contraindications: ['Hypersensitivity to beta-lactam antibiotics (penicillins/cephalosporins)'],
      storage: 'Store below 25°C in a dry place protected from direct sunlight.',
      source: 'MediQ Verified Drug DB',
    },
    {
      _id: 'med-2',
      brandName: 'Lipitor',
      genericName: 'Atorvastatin Calcium',
      category: 'Cardiovascular / Statins',
      manufacturer: 'Pfizer Inc.',
      barcode: '8901086005678',
      dosageForm: 'Oral Tablet 20mg',
      prescriptionRequired: true,
      clinicalUses: ['Primary hypercholesterolemia', 'Prevention of cardiovascular events in high-risk patients'],
      indications: ['Primary hypercholesterolemia', 'Prevention of cardiovascular events in high-risk patients'],
      dosage: 'Usually 10mg to 20mg once daily taken in the evening with or without food.',
      sideEffects: ['Muscle ache (myalgia)', 'Joint pain', 'Mild gastrointestinal discomfort', 'Elevated liver enzymes'],
      contraindications: ['Active liver disease', 'Unexplained persistent elevations in serum transaminases', 'Pregnancy and lactation'],
      storage: 'Store at 20°C to 25°C.',
      source: 'MediQ Verified Drug DB',
    },
    {
      _id: 'med-3',
      brandName: 'Glucophage',
      genericName: 'Metformin Hydrochloride',
      category: 'Antidiabetic Agents',
      manufacturer: 'Merck Healthcare',
      barcode: '8901086009876',
      dosageForm: 'Extended Release Tablet 500mg',
      prescriptionRequired: true,
      clinicalUses: ['Management of Type 2 Diabetes Mellitus as adjunct to diet and physical activity'],
      indications: ['Management of Type 2 Diabetes Mellitus as adjunct to diet and physical activity'],
      dosage: 'Starting dose 500mg once daily with evening meal, titrate according to glycemic response.',
      sideEffects: ['Abdominal discomfort', 'Metallic taste', 'Diarrhea', 'Decreased vitamin B12 absorption'],
      contraindications: ['Severe renal impairment (eGFR < 30 mL/min)', 'Acute metabolic acidosis', 'Severe dehydration'],
      storage: 'Keep container tightly closed, store below 30°C.',
      source: 'MediQ Verified Drug DB',
    },
    {
      _id: 'med-4',
      brandName: 'Tylenol Extra Strength',
      genericName: 'Acetaminophen / Paracetamol',
      category: 'Analgesics & Antipyretics',
      manufacturer: 'Johnson & Johnson',
      barcode: '8901086003412',
      dosageForm: 'Oral Tablet 500mg',
      prescriptionRequired: false,
      clinicalUses: ['Temporary relief of minor aches and pains due to headache, backache, arthritis, and reduction of fever'],
      indications: ['Temporary relief of minor aches and pains due to headache, backache, arthritis, and reduction of fever'],
      dosage: 'Adults: 500mg to 1000mg every 4 to 6 hours as needed. Do not exceed 4000mg in 24 hours.',
      sideEffects: ['Rare in therapeutic doses. Hepatotoxicity with overdose'],
      contraindications: ['Severe hepatic failure or active liver disease'],
      storage: 'Store at room temperature 15°C to 30°C.',
      source: 'MediQ Verified Drug DB',
    },
    {
      _id: 'med-5',
      brandName: 'Prilosec',
      genericName: 'Omeprazole',
      category: 'Gastrointestinal / Proton Pump Inhibitor',
      manufacturer: 'AstraZeneca',
      barcode: '8901086007721',
      dosageForm: 'Delayed-Release Capsule 20mg',
      prescriptionRequired: false,
      clinicalUses: ['Gastroesophageal reflux disease (GERD)', 'Gastric and duodenal ulcers', 'Zollinger-Ellison syndrome'],
      indications: ['Gastroesophageal reflux disease (GERD)', 'Gastric and duodenal ulcers', 'Zollinger-Ellison syndrome'],
      dosage: '20mg once daily in the morning, 30 minutes before breakfast.',
      sideEffects: ['Headache', 'Abdominal pain', 'Constipation', 'Flatulence'],
      contraindications: ['Concomitant administration with nelfinavir or rilpivirine'],
      storage: 'Store between 15°C and 30°C in light-resistant container.',
      source: 'MediQ Verified Drug DB',
    },
    {
      _id: 'med-6',
      brandName: 'Augmentin 625 Duo',
      genericName: 'Amoxicillin + Clavulanic Acid',
      category: 'Antibiotics / Penicillin Combinations',
      manufacturer: 'GlaxoSmithKline',
      barcode: '8901117001423',
      dosageForm: 'Oral Film-Coated Tablet',
      prescriptionRequired: true,
      clinicalUses: ['Acute bacterial sinusitis', 'Community-acquired pneumonia', 'Dental infections'],
      indications: ['Severe respiratory tract infections', 'Bacterial sinusitis & otitis media'],
      dosage: 'One 625mg tablet twice daily with food.',
      sideEffects: ['Diarrhea', 'Nausea', 'Vaginal candidiasis'],
      contraindications: ['History of penicillin-associated jaundice'],
      storage: 'Store below 25°C in moisture-proof packaging.',
      source: 'MediQ Verified Drug DB',
    },
    {
      _id: 'med-7',
      brandName: 'Pan 40 Tablet',
      genericName: 'Pantoprazole Sodium',
      category: 'Gastrointestinal / PPI',
      manufacturer: 'Alkem Laboratories Ltd.',
      barcode: '8901456789012',
      dosageForm: 'Gastro-resistant Tablet 40mg',
      prescriptionRequired: true,
      clinicalUses: ['Erosive esophagitis', 'GERD', 'Zollinger-Ellison syndrome'],
      indications: ['Acidity, heartburn and GERD'],
      dosage: '40mg once daily in the morning 30 minutes before food.',
      sideEffects: ['Headache', 'Diarrhea', 'Nausea'],
      contraindications: ['Hypersensitivity to pantoprazole'],
      storage: 'Store in cool and dry place away from direct sunlight.',
      source: 'MediQ Verified Drug DB',
    }
  ];

  // Fetch verified medicines from Backend on mount
  useEffect(() => {
    const loadMedicines = async () => {
      try {
        const res = await medicineService.getAllMedicines();
        const list = res.data?.data?.medicines;
        if (Array.isArray(list) && list.length > 0) {
          setMedicines(list);
        } else {
          setMedicines(defaultMedicines);
        }
      } catch {
        setMedicines(defaultMedicines);
      }
    };
    loadMedicines();
  }, []);

  // 1. Search by Brand / Generic Name
  const handleSearch = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!searchTerm.trim()) {
      try {
        const res = await medicineService.getAllMedicines();
        setMedicines(res.data?.data?.medicines || defaultMedicines);
      } catch {
        setMedicines(defaultMedicines);
      }
      return;
    }

    setIsSearching(true);
    try {
      const res = await medicineService.searchByName(searchTerm.trim());
      const list = res.data?.data?.medicines || [];
      if (list.length > 0) {
        setMedicines(list);
      } else {
        const filtered = defaultMedicines.filter(
          (m) =>
            m.brandName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setMedicines(filtered);
      }
    } catch {
      const filtered = defaultMedicines.filter(
        (m) =>
          m.brandName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.genericName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setMedicines(filtered);
    } finally {
      setIsSearching(false);
    }
  };

  // 2. Barcode Lookup (Common core for camera scanner and manual entry)
  const lookupBarcode = async (barcodeVal) => {
    const clean = String(barcodeVal || '').trim();
    if (!clean) {
      toast.error('Please enter a barcode number.');
      return;
    }

    setScannerLoading(true);
    setNotFoundBarcode(null);
    const toastId = toast.loading('Finding medicine information...');

    try {
      const res = await medicineService.searchByBarcode(clean);
      const data = res.data;

      if (data?.found && data?.data?.medicine) {
        toast.success(`Found: ${data.data.medicine.brandName}`, { id: toastId });
        const med = data.data.medicine;
        setSelectedMedicine(med);

        // Prepend to visible list if not already present
        setMedicines((prev) => {
          const exists = prev.some((m) => m.barcode === med.barcode);
          if (exists) return prev;
          return [med, ...prev];
        });

        // Trigger scan history component to refresh
        setRefreshHistoryTrigger((prev) => prev + 1);
      } else {
        // Fallback local check in defaultMedicines if offline
        const localMatch = defaultMedicines.find((m) => m.barcode === clean);
        if (localMatch) {
          toast.success(`Found: ${localMatch.brandName}`, { id: toastId });
          setSelectedMedicine(localMatch);
          setRefreshHistoryTrigger((prev) => prev + 1);
        } else {
          toast.error('Medicine information not found.', { id: toastId });
          setNotFoundBarcode(clean);
          setRefreshHistoryTrigger((prev) => prev + 1);
        }
      }
    } catch (err) {
      console.error('Barcode lookup error:', err);
      // Fallback local check
      const localMatch = defaultMedicines.find((m) => m.barcode === clean);
      if (localMatch) {
        toast.success(`Found: ${localMatch.brandName}`, { id: toastId });
        setSelectedMedicine(localMatch);
      } else {
        toast.error('Medicine information could not be found for this barcode.', { id: toastId });
        setNotFoundBarcode(clean);
      }
    } finally {
      setScannerLoading(false);
    }
  };

  // 3. Manual Barcode Search Form Submit
  const handleBarcodeSearch = async (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) {
      setIsScannerOpen(true);
      return;
    }
    await lookupBarcode(barcodeInput.trim());
  };

  // Helper to extract clean GTIN/barcode from GS1 DataMatrix or QR code string
  const extractBarcodeFromScan = (raw) => {
    if (!raw) return '';
    const str = String(raw).trim();
    // 1. GS1 format with (01) GTIN identifier e.g. (01)08901117001423
    const matchParen = str.match(/\(01\)(\d{12,14})/);
    if (matchParen) return matchParen[1];

    // 2. GS1 raw string starting with 01 followed by 14 digits e.g. 0108901117001423...
    const matchRaw = str.match(/^01(\d{13,14})/);
    if (matchRaw) return matchRaw[1];

    // 3. URLs with barcode at the end
    if (str.startsWith('http://') || str.startsWith('https://')) {
      const parts = str.split('/');
      const last = parts[parts.length - 1];
      if (last && /^\d+$/.test(last)) return last;
    }

    return str;
  };

  // 4. Scanner Modal Callback
  const handleScanSuccess = async (scannedBarcode) => {
    setIsScannerOpen(false);
    const cleanCode = extractBarcodeFromScan(scannedBarcode);
    setBarcodeInput(cleanCode);
    await lookupBarcode(cleanCode);
  };

  const displayList = medicines.length > 0 ? medicines : defaultMedicines;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Search Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6">
        <div>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
            Verified Drug Database & Pharmacy Guide
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            Search Medicines, Dosage & Barcodes
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Access verified clinical indications, safety precautions, active ingredients, and barcode scanner lookups
          </p>
        </div>

        {/* Search Inputs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* By Brand or Generic */}
          <form onSubmit={handleSearch} className="lg:col-span-7 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by brand or generic name (e.g. Amoxicillin, Atorvastatin)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition-colors"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSearching}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-4 rounded-xl text-xs shrink-0 shadow-xs"
            >
              Search Drug
            </Button>
          </form>

          {/* By Barcode Input & Scanner */}
          <div className="lg:col-span-5 flex gap-2">
            <form onSubmit={handleBarcodeSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Barcode className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Scan / Enter Barcode (e.g. 8901086001234)..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition-colors font-mono"
                />
              </div>
              <Button
                type="submit"
                variant="outline"
                size="md"
                className="border-slate-300 text-slate-700 hover:bg-slate-50 py-2.5 px-3.5 rounded-xl text-xs shrink-0 font-medium"
              >
                Search
              </Button>
            </form>

            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => setIsScannerOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-3.5 sm:px-4 rounded-xl text-xs shrink-0 flex items-center gap-1.5 shadow-xs"
            >
              <Camera className="h-4 w-4" />
              <span>Scan Barcode</span>
            </Button>
          </div>

        </div>
      </div>

      {/* Loading Barcode Search Banner */}
      {scannerLoading && (
        <div className="bg-emerald-50 border border-emerald-200/90 rounded-2xl p-4 flex items-center gap-3 text-emerald-900">
          <Loader2 className="h-5 w-5 text-emerald-600 animate-spin shrink-0" />
          <div className="text-xs sm:text-sm">
            <strong>Searching across multiple databases...</strong>
            <span className="ml-1 text-emerald-700">Checking FDA, NIH RxNorm, UPC Registry & Open Food Facts simultaneously.</span>
          </div>
        </div>
      )}

      {/* Not Found Alert Banner */}
      {notFoundBarcode && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-900">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">No record found for barcode <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-200 text-amber-800">{notFoundBarcode}</code></p>
                <p className="text-xs text-amber-700 mt-1">
                  We searched across <strong>FDA Drug DB</strong>, <strong>NIH RxNorm</strong>, <strong>UPC Item Registry</strong>, and <strong>Open Food Facts</strong> — no matching pharmaceutical record was found.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setNotFoundBarcode(null)}
              className="text-amber-400 hover:text-amber-700 p-1 rounded-lg shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Suggestions */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white border border-amber-100 rounded-xl p-3">
              <p className="text-xs font-semibold text-amber-800 mb-1">💡 Try Name Search</p>
              <p className="text-xs text-amber-700">Enter the medicine name (brand or generic) in the left search box instead of barcode.</p>
              <button
                onClick={() => {
                  setNotFoundBarcode(null);
                  const nameInput = document.querySelector('input[placeholder*="brand or generic"]');
                  if (nameInput) nameInput.focus();
                }}
                className="mt-2 text-xs text-emerald-700 font-semibold hover:underline"
              >→ Search by Name</button>
            </div>
            <div className="bg-white border border-amber-100 rounded-xl p-3">
              <p className="text-xs font-semibold text-amber-800 mb-1">📦 Check Barcode Format</p>
              <p className="text-xs text-amber-700">Ensure the barcode is entered correctly. Indian barcodes usually start with <strong>890</strong> (EAN-13 format).</p>
            </div>
            <div className="bg-white border border-amber-100 rounded-xl p-3">
              <p className="text-xs font-semibold text-amber-800 mb-1">🏥 Consult a Pharmacist</p>
              <p className="text-xs text-amber-700">Some regional or hospital-specific medicines may not be in public databases. Always verify with a licensed pharmacist.</p>
            </div>
          </div>
        </div>
      )}

      {/* Medicines Results Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
          <span>Displaying verified pharmacology records ({displayList.length})</span>
          <span>FDA & CDSCO Regulated Formulations</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayList.map((med) => (
            <MedicineCard
              key={med._id || med.barcode}
              medicine={med}
              onSelect={(m) => setSelectedMedicine(m)}
            />
          ))}
        </div>
      </div>

      {/* Recent Barcode Scans Section (Requirement 10) */}
      <RecentScans
        onSelectMedicine={(m) => setSelectedMedicine(m)}
        refreshTrigger={refreshHistoryTrigger}
      />

      {/* Real-time Barcode Scanner Modal (Requirements 1 - 4) */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
        onManualEntryClick={() => {
          setIsScannerOpen(false);
          const barcodeInputEl = document.querySelector('input[placeholder*="Scan / Enter Barcode"]');
          if (barcodeInputEl) barcodeInputEl.focus();
        }}
      />

      {/* Detailed Medicine Details Modal (Requirement 7) */}
      <MedicineDetailsModal
        isOpen={!!selectedMedicine}
        onClose={() => setSelectedMedicine(null)}
        medicine={selectedMedicine}
      />

    </div>
  );
};

export default MedicineSearchPage;
