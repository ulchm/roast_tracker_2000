/**
 * Search and filter component
 */
import { useState } from 'react';
import { FaSearch, FaCalendar, FaCoffee, FaFire, FaTimes, FaFilter } from 'react-icons/fa';

export default function SearchFilters({ onFilterChange }) {
  const [filters, setFilters] = useState({
    search: '',
    date_from: '',
    date_to: '',
    beans: '',
    roast_level: '',
  });

  const handleChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleClear = () => {
    const clearedFilters = {
      search: '',
      date_from: '',
      date_to: '',
      beans: '',
      roast_level: '',
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.heading}>
          <FaFilter style={styles.headerIcon} />
          Search & Filter
        </h3>
      </div>

      <div style={styles.filterGroup}>
        <label style={styles.label}>
          <FaSearch style={styles.labelIcon} />
          Full-text Search
        </label>
        <div style={styles.inputWrapper}>
          <FaSearch style={styles.inputIcon} />
          <input
            type="text"
            placeholder="Search title, notes, beans..."
            value={filters.search}
            onChange={(e) => handleChange('search', e.target.value)}
            style={styles.input}
          />
        </div>
      </div>

      <div style={styles.row}>
        <div style={styles.filterGroup}>
          <label style={styles.label}>
            <FaCalendar style={styles.labelIcon} />
            Date From
          </label>
          <div style={styles.inputWrapper}>
            <FaCalendar style={styles.inputIcon} />
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => handleChange('date_from', e.target.value)}
              style={styles.input}
            />
          </div>
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.label}>
            <FaCalendar style={styles.labelIcon} />
            Date To
          </label>
          <div style={styles.inputWrapper}>
            <FaCalendar style={styles.inputIcon} />
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => handleChange('date_to', e.target.value)}
              style={styles.input}
            />
          </div>
        </div>
      </div>

      <div style={styles.filterGroup}>
        <label style={styles.label}>
          <FaCoffee style={styles.labelIcon} />
          Bean Origin/Name
        </label>
        <div style={styles.inputWrapper}>
          <FaCoffee style={styles.inputIcon} />
          <input
            type="text"
            placeholder="Search bean name..."
            value={filters.beans}
            onChange={(e) => handleChange('beans', e.target.value)}
            style={styles.input}
          />
        </div>
      </div>

      <div style={styles.filterGroup}>
        <label style={styles.label}>
          <FaFire style={styles.labelIcon} />
          Roast Level
        </label>
        <div style={styles.inputWrapper}>
          <FaFire style={styles.inputIcon} />
          <select
            value={filters.roast_level}
            onChange={(e) => handleChange('roast_level', e.target.value)}
            style={styles.select}
          >
            <option value="">All Levels</option>
            <option value="light">Light</option>
            <option value="medium-light">Medium-Light</option>
            <option value="medium">Medium</option>
            <option value="medium-dark">Medium-Dark</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </div>

      <button onClick={handleClear} style={styles.clearButton}>
        <FaTimes style={styles.buttonIcon} />
        Clear Filters
      </button>
    </div>
  );
}

const styles = {
  container: {
    padding: '28px',
    background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
    borderRadius: '16px',
    marginBottom: '32px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
    border: '2px solid #E8E4DF',
    width: '100%',
    boxSizing: 'border-box',
  },
  header: {
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '2px solid #F0F0F0',
  },
  heading: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    margin: 0,
    fontSize: '22px',
    fontWeight: '700',
    color: '#212121',
  },
  headerIcon: {
    color: '#212121',
    fontSize: '20px',
  },
  filterGroup: {
    marginBottom: '20px',
    flex: 1,
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '10px',
    fontWeight: '600',
    fontSize: '14px',
    color: '#212121',
  },
  labelIcon: {
    color: '#212121',
    fontSize: '14px',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '14px',
    color: '#616161',
    fontSize: '16px',
    pointerEvents: 'none',
    zIndex: 1,
  },
  input: {
    width: '100%',
    padding: '14px 16px 14px 44px',
    fontSize: '15px',
    border: '2px solid #E0E0E0',
    borderRadius: '10px',
    boxSizing: 'border-box',
    backgroundColor: 'white',
    color: '#212121',
    transition: 'all 0.3s ease',
    outline: 'none',
  },
  select: {
    width: '100%',
    padding: '14px 16px 14px 44px',
    fontSize: '15px',
    border: '2px solid #E0E0E0',
    borderRadius: '10px',
    boxSizing: 'border-box',
    backgroundColor: 'white',
    color: '#212121',
    transition: 'all 0.3s ease',
    outline: 'none',
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23616161\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    backgroundSize: '20px',
  },
  row: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  },
  clearButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    justifyContent: 'center',
    padding: '14px 28px',
    background: 'linear-gradient(135deg, #FF6B35 0%, #F44336 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    marginTop: '12px',
    boxShadow: '0 4px 12px rgba(244, 67, 54, 0.3)',
    transition: 'all 0.3s ease',
  },
  buttonIcon: {
    fontSize: '14px',
  },
};
