import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  History, 
  Barcode, 
  Building, 
  Clock, 
  Trash2, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw,
  Lock,
  Pill
} from 'lucide-react';
import { useAuth } from '../../auth/Auth.context';
import { medicineService } from '../services/medicine.service';
import Button from '../../../components/ui/Button';

export const RecentScans = ({ onSelectMedicine, refreshTrigger }) => {
  const { user, isAuthenticated } = useAuth();
  const [historyList, setHistoryList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchScanHistory = async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const res = await medicineService.getScanHistory({ limit: 12 });
      const items = res.data?.data?.history || [];
      setHistoryList(items);
    } catch (err) {
      console.error('Failed to load scan history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchScanHistory();
  }, [isAuthenticated, refreshTrigger]);

  const handleDelete = async (e, historyId) => {
    e.stopPropagation();
    if (!confirm('Remove this scan from your history?')) return;

    setDeletingId(historyId);
    try {
      await medicineService.deleteScanHistory(historyId);
      setHistoryList((prev) => prev.filter((item) => item._id !== historyId));
    } catch (err) {
      alert('Failed to delete scan record.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleViewDetails = async (item) => {
    // If medicineId is populated as an object
    if (item.medicineId && typeof item.medicineId === 'object') {
      onSelectMedicine(item.medicineId);
      return;
    }

    // Otherwise, fetch medicine details by barcode
    try {
      const res = await medicineService.searchByBarcode(item.barcode);
      if (res.data?.data?.medicine) {
        onSelectMedicine(res.data.data.medicine);
      } else {
        // Construct fallback presentation object
        onSelectMedicine({
          brandName: item.brandName || item.medicineName,
          medicineName: item.medicineName,
          genericName: item.genericName,
          manufacturer: item.manufacturer,
          barcode: item.barcode,
          prescriptionRequired: false,
          indications: ['No detailed pharmacology guide attached to this scan.'],
          source: item.source || 'Scanned Barcode Entry',
          lastUpdatedDate: item.scannedAt,
        });
      }
    } catch {
      onSelectMedicine({
        brandName: item.brandName || item.medicineName,
        medicineName: item.medicineName,
        genericName: item.genericName,
        manufacturer: item.manufacturer,
        barcode: item.barcode,
        source: item.source || 'Scanner Record',
        lastUpdatedDate: item.scannedAt,
      });
    }
  };

  const formatScannedDate = (dateString) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <History className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
              Recent Barcode Scans
            </h2>
            <p className="text-xs text-slate-500">
              Personal scanning history and verified lookup records
            </p>
          </div>
        </div>

        {isAuthenticated && (
          <button
            type="button"
            onClick={fetchScanHistory}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100/70 px-3 py-1.5 rounded-xl transition-colors self-start sm:self-auto"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh History
          </button>
        )}
      </div>

      {/* Unauthenticated Notification Prompt */}
      {!isAuthenticated && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5 text-slate-600">
            <Lock className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
            <span>
              <strong>Personalized History:</strong> Sign in with your patient account to automatically record, retain, and access your verified medicine barcode lookups.
            </span>
          </div>
          <Link
            to="/login"
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors whitespace-nowrap"
          >
            Sign in to Save Scans
          </Link>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-2xl border border-slate-100 bg-slate-50 animate-pulse space-y-3">
              <div className="h-4 w-28 bg-slate-200 rounded"></div>
              <div className="h-3 w-40 bg-slate-200 rounded"></div>
              <div className="h-3 w-20 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>
      )}

      {/* History Grid (When Authenticated and items exist) */}
      {!isLoading && historyList.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {historyList.map((item) => (
            <div
              key={item._id}
              className="bg-slate-50/80 hover:bg-white rounded-2xl border border-slate-200/80 hover:border-emerald-300 hover:shadow-sm p-4 transition-all flex flex-col justify-between space-y-3 group"
            >
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-emerald-100/70 text-emerald-800 flex items-center justify-center font-bold shrink-0">
                      <Pill className="h-4 w-4" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1 group-hover:text-emerald-700 transition-colors">
                      {item.brandName || item.medicineName}
                    </h3>
                  </div>

                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                      item.found
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {item.found ? 'Verified' : 'Unrecognized'}
                  </span>
                </div>

                {item.genericName && item.genericName !== 'Unknown' && (
                  <p className="text-xs font-medium text-emerald-700 line-clamp-1">
                    {item.genericName}
                  </p>
                )}

                <div className="space-y-1 pt-1 text-[11px] text-slate-500 font-mono">
                  <p className="flex items-center gap-1.5">
                    <Barcode className="h-3.5 w-3.5 text-slate-400 shrink-0 font-sans" />
                    <span>Barcode: {item.barcode}</span>
                  </p>
                  {item.manufacturer && item.manufacturer !== 'Unknown' && (
                    <p className="flex items-center gap-1.5 font-sans text-slate-600 line-clamp-1">
                      <Building className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{item.manufacturer}</span>
                    </p>
                  )}
                  <p className="flex items-center gap-1.5 font-sans text-slate-400 text-[10px]">
                    <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                    <span>Scanned: {formatScannedDate(item.scannedAt)}</span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleViewDetails(item)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-1.5 px-3 rounded-lg text-xs flex items-center gap-1.5"
                >
                  View Details
                  <ExternalLink className="h-3 w-3" />
                </Button>

                <button
                  type="button"
                  title="Remove from history"
                  disabled={deletingId === item._id}
                  onClick={(e) => handleDelete(e, item._id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && isAuthenticated && historyList.length === 0 && (
        <div className="text-center py-10 px-4 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 space-y-2">
          <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Barcode className="h-5 w-5" />
          </div>
          <p className="text-xs sm:text-sm font-semibold text-slate-700">
            No barcode scans yet
          </p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Scan any medicine box or bottle barcode using the camera above to automatically verify drug details and build your personal scan history.
          </p>
        </div>
      )}

    </div>
  );
};

export default RecentScans;
