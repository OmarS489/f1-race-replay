interface YearSelectorProps {
  years: number[];
  selectedYear: number | null;
  onSelect: (year: number) => void;
  loading?: boolean;
}

export default function YearSelector({
  years,
  selectedYear,
  onSelect,
  loading,
}: YearSelectorProps) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Select Season
      </label>
      <select
        className="w-full bg-f1-gray text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-f1-red focus:outline-none cursor-pointer"
        value={selectedYear ?? ''}
        onChange={(e) => onSelect(Number(e.target.value))}
        disabled={loading}
      >
        <option value="">Choose a year...</option>
        {years.map((year) => (
          <option key={year} value={year}>
            {year} Season
          </option>
        ))}
      </select>
    </div>
  );
}
