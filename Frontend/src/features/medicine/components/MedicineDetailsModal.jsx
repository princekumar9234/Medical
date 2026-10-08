import { 
  Pill, 
  Barcode, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Building, 
  Layers, 
  Bookmark, 
  Info,
  Calendar,
  Sparkles,
  HeartHandshake
} from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';

export const MedicineDetailsModal = ({ isOpen, onClose, medicine }) => {
  if (!isOpen || !medicine) return null;

  const isRx = medicine.prescriptionRequired;
  const brandTitle = medicine.brandName || medicine.medicineName || 'Medicine Details';
  const subtitle = `${medicine.genericName || ''} ${medicine.strength ? '• ' + medicine.strength : ''} ${medicine.dosageForm ? '• ' + medicine.dosageForm : ''}`;

  const formattedDate = medicine.lastUpdatedDate
    ? new Date(medicine.lastUpdatedDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recently verified';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={brandTitle}
      subtitle={subtitle}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5 text-xs text-slate-700">

        {/* Prescription Status & Quick Badges Bar */}
        <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
              isRx
                ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-xs'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-xs'
            }`}
          >
            {isRx ? (
              <>
                <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
                Rx / Prescription Only
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                OTC Available (Over the Counter)
              </>
            )}
          </span>

          {medicine.category && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-700">
              {medicine.category}
            </span>
          )}

          {medicine.barcode && (
            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-white border border-slate-200 text-slate-700 flex items-center gap-1">
              <Barcode className="h-3 w-3 text-slate-400" />
              {medicine.barcode}
            </span>
          )}
        </div>

        {/* Primary Identification Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Generic Chemical Name
            </span>
            <p className="font-semibold text-slate-900 text-sm">
              {medicine.genericName || 'Not specified'}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Manufacturer / Pharmaceutical Lab
            </span>
            <p className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5 text-slate-400" />
              {medicine.manufacturer || 'Verified Manufacturer'}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Active Ingredients & Strength
            </span>
            <p className="text-slate-800 font-medium">
              {Array.isArray(medicine.activeIngredients) && medicine.activeIngredients.length > 0
                ? medicine.activeIngredients.join(', ')
                : medicine.strength || 'Information on product package'}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Dosage Form & Strength
            </span>
            <p className="text-slate-800 font-medium">
              {medicine.dosageForm || 'Oral Preparation'} {medicine.strength ? `(${medicine.strength})` : ''}
            </p>
          </div>
        </div>

        {/* Clinical Uses & Indications */}
        <div className="space-y-1.5">
          <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Pill className="h-3.5 w-3.5 text-emerald-600" />
            Clinical Uses & Indications
          </h4>
          <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/90 text-slate-800">
            {Array.isArray(medicine.clinicalUses) && medicine.clinicalUses.length > 0 ? (
              <ul className="list-disc pl-4 space-y-1">
                {medicine.clinicalUses.map((use, idx) => (
                  <li key={idx} className="leading-relaxed">{use}</li>
                ))}
              </ul>
            ) : Array.isArray(medicine.indications) && medicine.indications.length > 0 ? (
              <ul className="list-disc pl-4 space-y-1">
                {medicine.indications.map((ind, idx) => (
                  <li key={idx} className="leading-relaxed">{ind}</li>
                ))}
              </ul>
            ) : (
              <p>{medicine.indications || 'Clinical uses specified on physician prescription.'}</p>
            )}
          </div>
        </div>

        {/* Recommended Dosage */}
        {medicine.dosage && (
          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-slate-500" />
              Standard Dosage Guidance
            </h4>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 leading-relaxed font-normal">
              {medicine.dosage}
            </div>
          </div>
        )}

        {/* Warnings & Precautions */}
        {((Array.isArray(medicine.warnings) && medicine.warnings.length > 0) ||
          (Array.isArray(medicine.precautions) && medicine.precautions.length > 0)) && (
          <div className="space-y-1.5">
            <h4 className="font-bold text-amber-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              Warnings & Safety Precautions
            </h4>
            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-amber-900 space-y-1.5">
              {Array.isArray(medicine.warnings) && medicine.warnings.map((warn, i) => (
                <p key={'w-' + i} className="leading-relaxed flex items-start gap-2">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>{warn}</span>
                </p>
              ))}
              {Array.isArray(medicine.precautions) && medicine.precautions.map((prec, i) => (
                <p key={'p-' + i} className="leading-relaxed flex items-start gap-2 text-[11px] text-amber-800">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>{prec}</span>
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Contraindications */}
        {Array.isArray(medicine.contraindications) && medicine.contraindications.length > 0 && (
          <div className="space-y-1.5">
            <h4 className="font-bold text-rose-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
              Contraindications (Do Not Use If)
            </h4>
            <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200 text-rose-900 space-y-1">
              {medicine.contraindications.map((ci, i) => (
                <p key={i} className="leading-relaxed flex items-start gap-2">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>{ci}</span>
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Side Effects */}
        {Array.isArray(medicine.sideEffects) && medicine.sideEffects.length > 0 && (
          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Potential Adverse Reactions / Side Effects
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {medicine.sideEffects.map((se, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200/80"
                >
                  {se}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Drug Interactions */}
        {Array.isArray(medicine.drugInteractions) && medicine.drugInteractions.length > 0 && (
          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <HeartHandshake className="h-3.5 w-3.5 text-slate-500" />
              Known Drug Interactions
            </h4>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 space-y-1 text-[11px]">
              {medicine.drugInteractions.map((di, i) => (
                <p key={i} className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold">↔</span>
                  <span>{di}</span>
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Storage Information */}
        {medicine.storage && (
          <div className="space-y-1">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Storage Information
            </h4>
            <p className="text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
              {medicine.storage}
            </p>
          </div>
        )}

        {/* Source & Last Updated Metadata */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
          <span>Source: <strong className="text-slate-600 font-medium">{medicine.source || 'MediQ Verified Drug DB'}</strong></span>
          <span>Last Updated: <strong className="text-slate-600 font-medium">{formattedDate}</strong></span>
        </div>

        {/* Clear Legal / Medical Safety Disclaimer */}
        <div className="p-3 bg-emerald-50/70 border border-emerald-200/90 rounded-2xl flex items-start gap-2.5 text-emerald-900">
          <Info className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            <strong>Medical Disclaimer:</strong> Information shown is for educational purposes only. Always consult a qualified healthcare professional before using or changing medication.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex justify-end">
          <Button
            variant="primary"
            size="sm"
            onClick={onClose}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-6 rounded-xl text-xs shadow-xs"
          >
            Close Medicine Guide
          </Button>
        </div>

      </div>
    </Modal>
  );
};

export default MedicineDetailsModal;
