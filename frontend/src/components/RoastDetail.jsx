/**
 * Roast detail view component
 */
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { roastAPI } from '../api';
import RoastChart from './RoastChart';
import {
  FaArrowLeft, FaCoffee, FaCalendar, FaClock, FaUser, FaBuilding,
  FaFire, FaWeight, FaChartLine, FaExclamationTriangle, FaStickyNote
} from 'react-icons/fa';

export default function RoastDetail({ onBack }) {
  const { id: roastId } = useParams();
  const [roast, setRoast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (roastId) {
      loadRoast();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roastId]);

  const loadRoast = async () => {
    try {
      setLoading(true);
      const response = await roastAPI.getById(roastId);
      setRoast(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load roast details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading roast details...</div>;
  }

  if (error) {
    return (
      <div style={styles.error}>
        {error}
        <button onClick={onBack} style={styles.backButton}>Back to List</button>
      </div>
    );
  }

  if (!roast) {
    return null;
  }

  const formatTime = (seconds) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={styles.container}>
      <button onClick={onBack} style={styles.backButton}>
        <FaArrowLeft style={styles.buttonIcon} />
        Back to List
      </button>

      <div style={styles.header}>
        <div style={styles.titleSection}>
          <FaCoffee style={styles.headerIcon} />
          <h1 style={styles.title}>{roast.title}</h1>
        </div>
        {roast.roast_level && (
          <div style={styles.roastLevel}>
            <FaFire style={styles.roastLevelIcon} />
            {roast.roast_level}
          </div>
        )}
      </div>

      <div style={styles.sections}>
        {/* Basic Info */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <FaCalendar style={styles.sectionIcon} />
            Basic Information
          </h2>
          <div style={styles.grid}>
            <div style={styles.field}>
              <FaCalendar style={styles.fieldIcon} />
              <span style={styles.label}>Date:</span>
              <span>{format(new Date(roast.roast_date), 'MMMM d, yyyy')}</span>
            </div>
            <div style={styles.field}>
              <FaClock style={styles.fieldIcon} />
              <span style={styles.label}>Time:</span>
              <span>{roast.roast_time}</span>
            </div>
            {roast.operator && (
              <div style={styles.field}>
                <FaUser style={styles.fieldIcon} />
                <span style={styles.label}>Operator:</span>
                <span>{roast.operator}</span>
              </div>
            )}
            {roast.organization && (
              <div style={styles.field}>
                <FaBuilding style={styles.fieldIcon} />
                <span style={styles.label}>Organization:</span>
                <span>{roast.organization}</span>
              </div>
            )}
            {roast.roaster_type && (
              <div style={styles.field}>
                <FaFire style={styles.fieldIcon} />
                <span style={styles.label}>Roaster:</span>
                <span>{roast.roaster_type}</span>
              </div>
            )}
          </div>
        </section>

        {/* Bean Info */}
        {roast.beans && (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>
              <FaCoffee style={styles.sectionIcon} />
              Bean Information
            </h2>
            <div style={styles.grid}>
              <div style={styles.field}>
                <FaCoffee style={styles.fieldIcon} />
                <span style={styles.label}>Bean:</span>
                <span>{roast.beans}</span>
              </div>
              {roast.weight_in && (
                <div style={styles.field}>
                  <FaWeight style={styles.fieldIcon} />
                  <span style={styles.label}>Weight In:</span>
                  <span>{roast.weight_in}{roast.weight_unit}</span>
                </div>
              )}
              {roast.weight_out && (
                <div style={styles.field}>
                  <FaWeight style={styles.fieldIcon} />
                  <span style={styles.label}>Weight Out:</span>
                  <span>{roast.weight_out}{roast.weight_unit}</span>
                </div>
              )}
              {roast.weight_loss && (
                <div style={styles.field}>
                  <FaChartLine style={styles.fieldIcon} />
                  <span style={styles.label}>Weight Loss:</span>
                  <span>{roast.weight_loss.toFixed(1)}%</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Temperature Chart - Full Width */}
        <section style={styles.chartSection}>
          <RoastChart roast={roast} />
        </section>

        {/* Phase Metrics */}
        {(roast.dry_phase_time || roast.mid_phase_time || roast.finish_phase_time) && (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>
              <FaChartLine style={styles.sectionIcon} />
              Phase Metrics
            </h2>
            <div style={styles.grid}>
              {roast.total_time && (
                <div style={styles.field}>
                  <span style={styles.label}>Total Time:</span>
                  <span>{formatTime(roast.total_time)}</span>
                </div>
              )}
              {roast.dry_phase_time && (
                <div style={styles.field}>
                  <span style={styles.label}>Dry Phase:</span>
                  <span>{formatTime(roast.dry_phase_time)}</span>
                </div>
              )}
              {roast.mid_phase_time && (
                <div style={styles.field}>
                  <span style={styles.label}>Mid Phase:</span>
                  <span>{formatTime(roast.mid_phase_time)}</span>
                </div>
              )}
              {roast.finish_phase_time && (
                <div style={styles.field}>
                  <span style={styles.label}>Finish Phase:</span>
                  <span>{formatTime(roast.finish_phase_time)}</span>
                </div>
              )}
              {roast.dry_phase_ror && (
                <div style={styles.field}>
                  <span style={styles.label}>Dry Phase ROR:</span>
                  <span>{roast.dry_phase_ror.toFixed(1)}°C/min</span>
                </div>
              )}
              {roast.mid_phase_ror && (
                <div style={styles.field}>
                  <span style={styles.label}>Mid Phase ROR:</span>
                  <span>{roast.mid_phase_ror.toFixed(1)}°C/min</span>
                </div>
              )}
              {roast.finish_phase_ror && (
                <div style={styles.field}>
                  <span style={styles.label}>Finish Phase ROR:</span>
                  <span>{roast.finish_phase_ror.toFixed(1)}°C/min</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Defects */}
        {(roast.heavy_fc || roast.low_fc || roast.light_cut || roast.dark_cut ||
          roast.drops || roast.oily || roast.uneven || roast.tipping ||
          roast.scorching || roast.divots) && (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>
              <FaExclamationTriangle style={styles.sectionIcon} />
              Defects
            </h2>
            <div style={styles.defects}>
              {roast.heavy_fc && <span style={styles.defect}>Heavy FC</span>}
              {roast.low_fc && <span style={styles.defect}>Low FC</span>}
              {roast.light_cut && <span style={styles.defect}>Light Cut</span>}
              {roast.dark_cut && <span style={styles.defect}>Dark Cut</span>}
              {roast.drops && <span style={styles.defect}>Drops</span>}
              {roast.oily && <span style={styles.defect}>Oily</span>}
              {roast.uneven && <span style={styles.defect}>Uneven</span>}
              {roast.tipping && <span style={styles.defect}>Tipping</span>}
              {roast.scorching && <span style={styles.defect}>Scorching</span>}
              {roast.divots && <span style={styles.defect}>Divots</span>}
            </div>
          </section>
        )}

        {/* Notes */}
        {(roast.roasting_notes || roast.cupping_notes) && (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>
              <FaStickyNote style={styles.sectionIcon} />
              Notes
            </h2>
            {roast.roasting_notes && (
              <div style={styles.note}>
                <h3 style={styles.noteTitle}>Roasting Notes:</h3>
                <p>{roast.roasting_notes}</p>
              </div>
            )}
            {roast.cupping_notes && (
              <div style={styles.note}>
                <h3 style={styles.noteTitle}>Cupping Notes:</h3>
                <p>{roast.cupping_notes}</p>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
    padding: '0',
    boxSizing: 'border-box',
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
  error: {
    textAlign: 'center',
    padding: '60px',
    color: '#C62828',
    background: 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)',
    borderRadius: '16px',
    fontSize: '18px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '14px 28px',
    background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    marginBottom: '28px',
    boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
    transition: 'all 0.3s ease',
  },
  buttonIcon: {
    fontSize: '14px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    flexWrap: 'wrap',
    gap: '20px',
    padding: '24px',
    background: 'linear-gradient(135deg, #ffffff 0%, #f8f8f8 100%)',
    borderRadius: '16px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
    border: '2px solid #E0E0E0',
  },
  titleSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  headerIcon: {
    fontSize: '40px',
    color: '#212121',
  },
  title: {
    margin: 0,
    fontSize: '32px',
    fontWeight: '700',
    color: '#212121',
  },
  roastLevel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #FF8C42 0%, #FF6B35 100%)',
    color: 'white',
    borderRadius: '24px',
    fontWeight: '700',
    fontSize: '16px',
    boxShadow: '0 4px 12px rgba(255, 140, 66, 0.3)',
  },
  roastLevelIcon: {
    fontSize: '16px',
  },
  sections: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  section: {
    background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
    padding: '32px',
    borderRadius: '16px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
    border: '2px solid #E0E0E0',
  },
  chartSection: {
    padding: '0',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    margin: '0 0 24px 0',
    fontSize: '24px',
    fontWeight: '700',
    color: '#212121',
    borderBottom: '3px solid #212121',
    paddingBottom: '16px',
  },
  sectionIcon: {
    fontSize: '22px',
    color: '#212121',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
  },
  field: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '15px',
    lineHeight: '1.6',
    color: '#212121',
    padding: '12px',
    background: 'white',
    borderRadius: '10px',
    border: '1px solid #E0E0E0',
  },
  fieldIcon: {
    fontSize: '16px',
    color: '#616161',
    minWidth: '16px',
  },
  label: {
    fontWeight: '700',
    marginRight: '8px',
    color: '#212121',
  },
  defects: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
  },
  defect: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 18px',
    background: 'linear-gradient(135deg, #F44336 0%, #D32F2F 100%)',
    color: 'white',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    boxShadow: '0 4px 12px rgba(244, 67, 54, 0.3)',
  },
  note: {
    marginBottom: '20px',
    padding: '20px',
    background: 'linear-gradient(135deg, #F5F5F5 0%, #EEEEEE 100%)',
    borderRadius: '12px',
    borderLeft: '4px solid #212121',
    border: '2px solid #E0E0E0',
  },
  noteTitle: {
    fontSize: '17px',
    fontWeight: '700',
    marginBottom: '12px',
    margin: '0 0 12px 0',
    color: '#212121',
  },
};
