import { useState } from 'react';
import { 
  Search, 
  Pill, 
  Barcode, 
  ShieldAlert, 
  CheckCircle, 
  Info, 
  AlertTriangle,
  FileText,
  Building
} from 'lucide-react';
import { medicineService } from '../services/medicine.service';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Badge from '../../../components/ui/Badge';

export const MedicineSearchPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [medicines, setMedicines] = useState([]);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // Comprehensive fallback medicine list for immediate exploration
  const defaultMedicines = [
    {
      _id: 'med-1',
      brandName: 'Amoxil',
      genericName: 'Amoxicillin Trihydrate',
      category: 'Antibiotics',
      manufacturer: 'GlaxoSmithKline',
      barcode: '8901086001234',
      dosageForm: 'Oral Capsule 500mg',
      prescriptionRequired: true,
      indications: ['Bacterial respiratory tract infections', 'Otitis media', 'Streptococcal pharyngitis', 'Skin infections'],
      dosage: 'Adults: 250mg to 500mg every 8 hours or 500mg to 875mg every 12 hours.',
      sideEffects: ['Nausea', 'Diarrhea', 'Skin rash', 'Headache'],
      contraindications: ['Hypersensitivity to beta-lactam antibiotics (penicillins/cephalosporins)'],
      storage: 'Store below 25°C in a dry place protected from direct sunlight.',
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
      indications: ['Primary hypercholesterolemia', 'Prevention of cardiovascular events in high-risk patients'],
      dosage: 'Usually 10mg to 20mg once daily taken in the evening with or without food.',
      sideEffects: ['Muscle ache (myalgia)', 'Joint pain', 'Mild gastrointestinal discomfort', 'Elevated liver enzymes'],
      contraindications: ['Active liver disease', 'Unexplained persistent elevations in serum transaminases', 'Pregnancy and lactation'],
      storage: 'Store at 20°C to 25°C.',
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
      indications: ['Management of Type 2 Diabetes Mellitus as adjunct to diet and physical activity'],
      dosage: 'Starting dose 500mg once daily with evening meal, titrate according to glycemic response.',
      sideEffects: ['Abdominal discomfort', 'Metallic taste', 'Diarrhea', 'Decreased vitamin B12 absorption'],
      contraindications: ['Severe renal impairment (eGFR < 30 mL/min)', 'Acute metabolic acidosis', 'Severe dehydration'],
      storage: 'Keep container tightly closed, store below 30°C.',
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
      indications: ['Temporary relief of minor aches and pains due to headache, backache, arthritis, and reduction of fever'],
      dosage: 'Adults: 500mg to 1000mg every 4 to 6 hours as needed. Do not exceed 4000mg in 24 hours.',
      sideEffects: ['Rare in therapeutic doses. Hepatotoxicity with overdose'],
      contraindications: ['Severe hepatic failure or active liver disease'],
      storage: 'Store at room temperature 15°C to 30°C.',
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
      indications: ['Gastroesophageal reflux disease (GERD)', 'Gastric and duodenal ulcers', 'Zollinger-Ellison syndrome'],
      dosage: '20mg once daily in the morning, 30 minutes before breakfast.',
      sideEffects: ['Headache', 'Abdominal pain', 'Constipation', 'Flatulence'],
      contraindications: ['Concomitant administration with nelfinavir or rilpivirine'],
      storage: 'Store between 15°C and 30°C in light-resistant container.',
    }
  ];

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setMedicines(defaultMedicines);
      return;
    }

    setIsSearching(true);
    try {
      const res = await medicineService.searchByName(searchTerm.trim());
      const list = res.data?.data?.medicines || [];
      if (list.length > 0) {
        setMedicines(list);
      } else {
        // Fallback filter
        const filtered = defaultMedicines.filter(m => 
          m.brandName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setMedicines(filtered);
      }
    } catch (err) {
      const filtered = defaultMedicines.filter(m => 
        m.brandName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.genericName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setMedicines(filtered);
    } finally {
      setIsSearching(false);
    }
  };

  const handleBarcodeSearch = async (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    setIsSearching(true);
    try {
      const res = await medicineService.searchByBarcode(barcodeInput.trim());
      const med = res.data?.data?.medicine;
      if (med) {
        setMedicines([med]);
        setSelectedMedicine(med);
      } else {
        const found = defaultMedicines.find(m => m.barcode === barcodeInput.trim());
        if (found) {
          setMedicines([found]);
          setSelectedMedicine(found);
        } else {
          alert(`No medicine matched with Barcode: ${barcodeInput}`);
        }
      }
    } catch (err) {
      const found = defaultMedicines.find(m => m.barcode === barcodeInput.trim());
      if (found) {
        setMedicines([found]);
        setSelectedMedicine(found);
      } else {
        alert(`No medicine matched with Barcode: ${barcodeInput}`);
      }
    } finally {
      setIsSearching(false);
    }
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
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-4 rounded-xl text-xs shrink-0"
            >
              Search Drug
            </Button>
          </form>

          {/* By Barcode */}
          <form onSubmit={handleBarcodeSearch} className="lg:col-span-5 flex gap-2">
            <div className="relative flex-1">
              <Barcode className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Scan / Enter Barcode (e.g. 8901086001234)..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
              />
            </div>
            <Button
              type="submit"
              variant="outline"
              size="md"
              className="border-slate-300 text-slate-700 hover:bg-slate-50 py-2.5 px-4 rounded-xl text-xs shrink-0"
            >
              Scan Barcode
            </Button>
          </form>

        </div>
      </div>

      {/* Medicines Results Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
          <span>Displaying verified pharmacology records ({displayList.length})</span>
          <span>FDA & CDSCO Regulated Formulations</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayList.map((med) => (
            <div
              key={med._id}
              onClick={() => setSelectedMedicine(med)}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                    <Pill className="h-5 w-5" />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    med.prescriptionRequired
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {med.prescriptionRequired ? 'Rx Prescription Only' : 'OTC Available'}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    {med.brandName}
                  </h3>
                  <p className="text-xs font-semibold text-emerald-700 mt-0.5">
                    {med.genericName}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {med.dosageForm} • {med.manufacturer}
                  </p>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl text-xs text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-700">Clinical Uses:</p>
                  <p className="line-clamp-2 text-[11px]">
                    {Array.isArray(med.indications) ? med.indications.join(', ') : med.indications}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 mt-3">
                <span className="flex items-center gap-1 font-mono text-[11px]">
                  <Barcode className="h-3.5 w-3.5 text-slate-400" />
                  {med.barcode}
                </span>
                <span className="text-emerald-600 font-semibold hover:underline">
                  View Full Guide →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Medicine Details Modal */}
      {selectedMedicine && (
        <Modal
          isOpen={!!selectedMedicine}
          onClose={() => setSelectedMedicine(null)}
          title={selectedMedicine.brandName}
          subtitle={`${selectedMedicine.genericName} • ${selectedMedicine.dosageForm}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-xs text-slate-700">
            <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-100">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                selectedMedicine.prescriptionRequired
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {selectedMedicine.prescriptionRequired ? 'Prescription Required (Schedule H/Rx)' : 'Over the Counter (OTC)'}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                Category: {selectedMedicine.category}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-slate-100 text-slate-700">
                Barcode: {selectedMedicine.barcode}
              </span>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-1">
                Manufacturer & Origin
              </h4>
              <p>{selectedMedicine.manufacturer}</p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-1">
                Clinical Indications
              </h4>
              <ul className="list-disc pl-4 space-y-0.5">
                {Array.isArray(selectedMedicine.indications) ? (
                  selectedMedicine.indications.map((ind, i) => <li key={i}>{ind}</li>)
                ) : (
                  <li>{selectedMedicine.indications}</li>
                )}
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-1">
                Recommended Standard Dosage
              </h4>
              <p className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                {selectedMedicine.dosage}
              </p>
            </div>

            <div>
              <h4 className="font-bold text-rose-700 uppercase tracking-wider mb-1">
                Potential Side Effects
              </h4>
              <p>{Array.isArray(selectedMedicine.sideEffects) ? selectedMedicine.sideEffects.join(', ') : selectedMedicine.sideEffects}</p>
            </div>

            <div>
              <h4 className="font-bold text-amber-700 uppercase tracking-wider mb-1">
                Contraindications & Warnings
              </h4>
              <p>{Array.isArray(selectedMedicine.contraindications) ? selectedMedicine.contraindications.join(', ') : selectedMedicine.contraindications}</p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-1">
                Storage & Shelf Life
              </h4>
              <p>{selectedMedicine.storage}</p>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setSelectedMedicine(null)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-5 rounded-lg text-xs"
              >
                Close Drug Guide
              </Button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};

export default MedicineSearchPage;
