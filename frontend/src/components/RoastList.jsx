/**
 * Roast list component with thumbnails
 */
import { useState } from 'react';
import { format } from 'date-fns';
import { FaCalendar, FaCoffee, FaUser, FaThermometerHalf, FaClock, FaFire } from 'react-icons/fa';

export default function RoastList({ roasts, onSelectRoast, loading }) {
  const [hoveredCard, setHoveredCard] = useState(null);

  if (loading) {
    return <div style={styles.loading}>Loading roasts...</div>;
  }

  if (!roasts || roasts.length === 0) {
    return <div style={styles.empty}>No roasts found. Upload one to get started!</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.headerSection}>
        <h2 style={styles.heading}>
          <FaCoffee style={styles.headingIcon} />
          Roast History ({roasts.length})
        </h2>
      </div>
      <div style={styles.grid}>
        {roasts.map((roast) => (
          <div
            key={roast.id}
            style={{
              ...styles.card,
              ...(hoveredCard === roast.id ? styles.cardHovered : {}),
            }}
            onClick={() => onSelectRoast(roast.id)}
            onMouseEnter={() => setHoveredCard(roast.id)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div style={styles.cardHeader}>
              <FaCoffee style={styles.headerIcon} />
              <div style={styles.dateBox}>
                {format(new Date(roast.roast_date), 'MMM d')}
              </div>
            </div>

            <div style={styles.content}>
              <h3 style={styles.title}>{roast.title}</h3>

              <div style={styles.infoSection}>
                <div style={styles.info}>
                  <FaCalendar style={styles.icon} />
                  <span>
                    {format(new Date(roast.roast_date), 'MMM d, yyyy')} at {roast.roast_time}
                  </span>
                </div>

                {roast.beans && (
                  <div style={styles.info}>
                    <FaCoffee style={styles.icon} />
                    <span>{roast.beans}</span>
                  </div>
                )}

                {roast.operator && (
                  <div style={styles.info}>
                    <FaUser style={styles.icon} />
                    <span>{roast.operator}</span>
                  </div>
                )}
              </div>

              <div style={styles.metrics}>
                {roast.drop_bt && (
                  <div style={styles.metric}>
                    <FaThermometerHalf style={styles.metricIcon} />
                    <span style={styles.metricValue}>{roast.drop_bt.toFixed(1)}°C</span>
                  </div>
                )}

                {roast.total_time && (
                  <div style={styles.metric}>
                    <FaClock style={styles.metricIcon} />
                    <span style={styles.metricValue}>{Math.floor(roast.total_time / 60)}:{(roast.total_time % 60).toFixed(0).padStart(2, '0')}</span>
                  </div>
                )}

                {roast.roast_level && (
                  <div style={styles.roastLevel}>
                    <FaFire style={styles.metricIcon} />
                    {roast.roast_level}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '0',
    width: '100%',
    boxSizing: 'border-box',
  },
  headerSection: {
    marginBottom: '32px',
  },
  heading: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '32px',
    fontWeight: '700',
    color: '#212121',
    marginBottom: '8px',
  },
  headingIcon: {
    color: '#212121',
    fontSize: '28px',
  },
  loading: {
    textAlign: 'center',
    padding: '60px',
    fontSize: '18px',
    color: '#616161',
    background: 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)',
    borderRadius: '16px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
  },
  empty: {
    textAlign: 'center',
    padding: '60px',
    fontSize: '18px',
    color: '#616161',
    background: 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)',
    borderRadius: '16px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
    gap: '24px',
    width: '100%',
  },
  card: {
    border: '2px solid transparent',
    borderRadius: '16px',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    backgroundColor: 'white',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    position: 'relative',
  },
  cardHovered: {
    transform: 'translateY(-8px) scale(1.02)',
    boxShadow: '0 16px 32px rgba(0, 0, 0, 0.2)',
    borderColor: '#212121',
  },
  cardHeader: {
    background: 'linear-gradient(135deg, #424242 0%, #212121 50%, #000000 100%)',
    padding: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  headerIcon: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: '48px',
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
  },
  dateBox: {
    color: 'white',
    fontSize: '20px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.2)',
    position: 'relative',
    zIndex: 1,
  },
  content: {
    padding: '24px',
  },
  title: {
    margin: '0 0 16px 0',
    fontSize: '22px',
    fontWeight: '700',
    color: '#212121',
    lineHeight: '1.3',
  },
  infoSection: {
    marginBottom: '16px',
  },
  info: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
    marginBottom: '10px',
    color: '#616161',
    lineHeight: '1.5',
  },
  icon: {
    color: '#212121',
    fontSize: '14px',
    minWidth: '14px',
  },
  metrics: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '2px solid #F0F0F0',
  },
  metric: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '14px',
    padding: '10px 14px',
    background: 'linear-gradient(135deg, #f8f8f8 0%, #f0f0f0 100%)',
    borderRadius: '10px',
    color: '#212121',
    border: '1px solid #E0E0E0',
    fontWeight: '600',
  },
  metricIcon: {
    fontSize: '14px',
    color: '#212121',
  },
  metricValue: {
    color: '#212121',
    fontWeight: '600',
  },
  roastLevel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '14px',
    padding: '10px 14px',
    background: 'linear-gradient(135deg, #424242 0%, #212121 100%)',
    color: 'white',
    fontWeight: '700',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
};
