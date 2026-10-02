import { Star } from 'lucide-react';

export const RatingStars = ({ rating = 0, max = 5, size = 'sm', showNumber = true, reviewCount = null }) => {
  const sizeMap = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const rounded = Math.round((rating || 0) * 10) / 10;

  return (
    <div className="inline-flex items-center gap-1.5">
      <div className="flex items-center">
        {[...Array(max)].map((_, i) => {
          const filled = i < Math.floor(rounded);
          const half = !filled && i < rounded;
          return (
            <Star
              key={i}
              className={`${sizeMap[size] || sizeMap.sm} ${
                filled
                  ? 'fill-amber-400 text-amber-400'
                  : half
                  ? 'fill-amber-200 text-amber-400'
                  : 'text-slate-200 fill-slate-100'
              }`}
            />
          );
        })}
      </div>
      {showNumber && (
        <span className="text-sm font-semibold text-slate-800 ml-0.5">
          {rounded > 0 ? rounded.toFixed(1) : 'New'}
        </span>
      )}
      {reviewCount !== null && (
        <span className="text-xs text-slate-400">({reviewCount})</span>
      )}
    </div>
  );
};

export default RatingStars;
