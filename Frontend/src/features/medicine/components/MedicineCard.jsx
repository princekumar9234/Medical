import { Pill, Barcode } from 'lucide-react';

export const MedicineCard = ({ medicine, onSelect }) => {
  const isRx = medicine.prescriptionRequired;

  return (
    <div
      onClick={() => onSelect(medicine)}
      className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <Pill className="h-5 w-5" />
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              isRx
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            {isRx ? 'Rx Prescription Only' : 'OTC Available'}
          </span>
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-900 leading-tight group-hover:text-emerald-700 transition-colors">
            {medicine.brandName || medicine.medicineName}
          </h3>
          <p className="text-xs font-semibold text-emerald-700 mt-0.5">
            {medicine.genericName}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {medicine.dosageForm || 'Oral formulation'} • {medicine.manufacturer}
          </p>
        </div>

        <div className="p-2.5 bg-slate-50 rounded-xl text-xs text-slate-600 space-y-1">
          <p className="font-semibold text-slate-700">Clinical Uses:</p>
          <p className="line-clamp-2 text-[11px] text-slate-600">
            {Array.isArray(medicine.clinicalUses) && medicine.clinicalUses.length > 0
              ? medicine.clinicalUses.join(', ')
              : Array.isArray(medicine.indications)
              ? medicine.indications.join(', ')
              : medicine.indications || 'Clinical information available on guide.'}
          </p>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 mt-3">
        <span className="flex items-center gap-1 font-mono text-[11px]">
          <Barcode className="h-3.5 w-3.5 text-slate-400" />
          {medicine.barcode}
        </span>
        <span className="text-emerald-600 font-semibold group-hover:translate-x-0.5 transition-transform">
          View Full Guide →
        </span>
      </div>
    </div>
  );
};

export default MedicineCard;
