/**
 * SearchInput — controlled text input that fires onChange on every keystroke.
 * Requirements: 3.8, 6.8
 */
export default function SearchInput({ value, onChange, placeholder = 'Search…' }) {
  return (
    <input
      type="search"
      className="search-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
    />
  );
}
