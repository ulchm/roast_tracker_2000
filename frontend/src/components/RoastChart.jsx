/**
 * Artisan-style Roast Chart - Temperature curves matching Artisan software
 */
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  annotationPlugin
);

// Artisan-style color scheme (matching reference image exactly)
const COLORS = {
  BT: '#CC0000',        // Bean Temp - RED (the S-curve)
  ET: '#00AA00',        // Environment Temp - GREEN (top line)
  ROR: '#D4AA00',       // Rate of Rise (ΔBT) - yellow/gold
  BURNER: '#00CC00',    // Burner - bright green (stepped)
  FAN: '#5555FF',       // Fan - blue (stepped)
  GRID: 'rgba(255, 255, 255, 0.1)',
  TEXT: '#CCCCCC',
  BACKGROUND: '#3d3d3d',
  // Phase band colors
  PHASE_DRY: 'rgba(76, 175, 80, 0.85)',      // Green
  PHASE_MAILLARD: 'rgba(255, 193, 7, 0.85)', // Yellow/amber
  PHASE_DEV: 'rgba(141, 110, 99, 0.85)',     // Brown
};

export default function RoastChart({ roast }) {
  if (!roast || !roast.timex || roast.timex.length === 0) {
    return <div style={styles.empty}>No temperature data available</div>;
  }

  // Get CHARGE time offset from timeindex if available
  // timeindex format: [CHARGE, DRY, FCs, FCe, SCs, SCe, DROP, COOL]
  // These are INDICES into the timex/temp arrays
  const timeindex = roast.raw_data?.timeindex || [];
  const chargeIdx = timeindex[0] || 0;
  const chargeTime = roast.timex[chargeIdx] || 0;

  // Normalize time so CHARGE = 0 (like Artisan displays)
  const normalizeTime = (rawTime) => rawTime - chargeTime;

  // Format time as M:SS for display (like Artisan), handling negative times
  const formatTimeLabel = (seconds) => {
    const normalized = normalizeTime(seconds);
    const absSeconds = Math.abs(normalized);
    const mins = Math.floor(absSeconds / 60);
    const secs = Math.floor(absSeconds % 60);
    const sign = normalized < 0 ? '-' : '';
    return `${sign}${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format duration (already in seconds, no normalization needed)
  const formatDuration = (seconds) => {
    if (!seconds || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine time range - start 30 seconds BEFORE charge, end 30 seconds after DROP
  // This matches Artisan's display where you can see pre-charge data
  const preChargeTime = chargeTime - 30; // 30 seconds before CHARGE
  const dropTimeRaw = roast.drop_time ? (roast.drop_time + chargeTime) : roast.timex[roast.timex.length - 1];
  const cutoffTime = dropTimeRaw + 30;

  // Sample the data to avoid performance issues with large datasets
  const sampleRate = Math.ceil(roast.timex.length / 300);
  const sampledIndices = roast.timex
    .map((_, i) => i)
    .filter((i) => i % sampleRate === 0 && roast.timex[i] >= preChargeTime && roast.timex[i] <= cutoffTime);

  const labels = sampledIndices.map((i) => formatTimeLabel(roast.timex[i]));

  // Filter out -1.0 sentinel values (Artisan uses -1 for invalid readings)
  // IMPORTANT: In Artisan .alog files, temp2 is BT (bean temp) and temp1 is ET (environment temp)
  // This is verified by matching computed values like CHARGE_BT against the temp arrays
  const bt_data = sampledIndices.map((i) => {
    const temp = roast.temp2[i];  // temp2 is BT!
    return (temp !== null && temp !== undefined && temp !== -1 && temp > 0) ? temp : null;
  });
  const et_data = sampledIndices.map((i) => {
    const temp = roast.temp1[i];  // temp1 is ET!
    return (temp !== null && temp !== undefined && temp !== -1 && temp > 0) ? temp : null;
  });

  // Calculate ROR (ΔBT) on the FULL raw data first, then sample it
  // Use temp2 which is the actual BT (bean temp) in Artisan .alog files
  //
  // Artisan's approach: Calculate delta over a longer window, not just consecutive points
  // This naturally smooths the data and avoids extreme spikes
  const calculateFullROR = () => {
    const deltaSpan = 15; // Calculate delta over ~30 seconds (15 samples at 2s intervals)
    const fullRor = [];

    for (let i = 0; i < roast.temp2.length; i++) {
      // Look back deltaSpan samples to calculate rate of change
      const lookbackIdx = Math.max(0, i - deltaSpan);
      const currTemp = roast.temp2[i];
      const prevTemp = roast.temp2[lookbackIdx];

      // Skip invalid readings
      if (currTemp === null || currTemp === undefined || currTemp === -1 || currTemp <= 0 ||
          prevTemp === null || prevTemp === undefined || prevTemp === -1 || prevTemp <= 0) {
        fullRor.push(null);
        continue;
      }

      const tempDiff = currTemp - prevTemp;
      const timeDiff = (roast.timex[i] - roast.timex[lookbackIdx]) / 60; // Convert to minutes

      if (timeDiff > 0) {
        const ror = tempDiff / timeDiff;
        // Clamp to display range - Artisan typically shows -5 to 25ish
        fullRor.push(Math.max(-5, Math.min(25, ror)));
      } else {
        fullRor.push(null);
      }
    }
    return fullRor;
  };

  // Additional smoothing pass to reduce remaining noise
  const smoothFullData = (data, windowSize = 7) => {
    const smoothed = [];
    const halfWindow = Math.floor(windowSize / 2);
    for (let i = 0; i < data.length; i++) {
      let sum = 0;
      let count = 0;
      for (let j = Math.max(0, i - halfWindow); j <= Math.min(data.length - 1, i + halfWindow); j++) {
        if (data[j] !== null && !isNaN(data[j])) {
          sum += data[j];
          count++;
        }
      }
      smoothed.push(count > 0 ? sum / count : null);
    }
    return smoothed;
  };

  // Calculate ROR on full data with built-in smoothing, then additional smoothing pass
  const fullRawRor = calculateFullROR();
  const fullSmoothedRor = smoothFullData(fullRawRor, 7);

  // Now sample the smoothed ROR values
  const bt_ror = sampledIndices.map((i) => fullSmoothedRor[i]);

  // Build heat and fan level data from special events
  let heatLevels = [];
  let fanLevels = [];

  if (roast.raw_data && roast.raw_data.specialevents && roast.raw_data.specialeventstype) {
    const specialEvents = roast.raw_data.specialevents;
    const eventTypes = roast.raw_data.specialeventstype;
    const eventValues = roast.raw_data.specialeventsvalue;
    const samplingInterval = roast.raw_data.samplinginterval || 2.0;

    const heatMap = new Map();
    const fanMap = new Map();

    specialEvents.forEach((eventIndex, i) => {
      const type = eventTypes[i];
      const value = eventValues[i];
      const actualTime = eventIndex * samplingInterval;

      if (type === 3) {
        const burnerPercent = (value - 1) * 10;
        heatMap.set(actualTime, Math.max(0, burnerPercent));
      } else if (type === 0) {
        const fanPercent = (value - 1) * 10;
        fanMap.set(actualTime, Math.max(0, fanPercent));
      }
    });

    const heatEvents = Array.from(heatMap.entries()).sort((a, b) => a[0] - b[0]);
    const fanEvents = Array.from(fanMap.entries()).sort((a, b) => a[0] - b[0]);

    heatLevels = sampledIndices.map((idx) => {
      const currentTime = roast.timex[idx];
      let mostRecentHeat = 0;
      for (let i = heatEvents.length - 1; i >= 0; i--) {
        if (heatEvents[i][0] <= currentTime) {
          mostRecentHeat = heatEvents[i][1];
          break;
        }
      }
      return mostRecentHeat;
    });

    fanLevels = sampledIndices.map((idx) => {
      const currentTime = roast.timex[idx];
      let mostRecentFan = 0;
      for (let i = fanEvents.length - 1; i >= 0; i--) {
        if (fanEvents[i][0] <= currentTime) {
          mostRecentFan = fanEvents[i][1];
          break;
        }
      }
      return mostRecentFan;
    });
  }

  // Helper to find closest label for event time
  // Event times from the API (like dry_time, fcs_time) are already CHARGE-relative (normalized)
  // So we need to compare against normalized times
  const findClosestLabel = (eventTime) => {
    let closestIndex = 0;
    let minDiff = Math.abs(normalizeTime(roast.timex[sampledIndices[0]]) - eventTime);
    for (let i = 1; i < sampledIndices.length; i++) {
      const normalizedSampleTime = normalizeTime(roast.timex[sampledIndices[i]]);
      const diff = Math.abs(normalizedSampleTime - eventTime);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    }
    return labels[closestIndex];
  };

  // Build annotations for events and phase bands
  const annotations = {};

  // Calculate phase percentages for display
  const totalTime = roast.total_time || roast.drop_time || 0;
  const dryPhaseTime = roast.dry_phase_time || (roast.dry_time ? roast.dry_time : 0);
  const midPhaseTime = roast.mid_phase_time || (roast.fcs_time && roast.dry_time ? roast.fcs_time - roast.dry_time : 0);
  const finishPhaseTime = roast.finish_phase_time || (roast.drop_time && roast.fcs_time ? roast.drop_time - roast.fcs_time : 0);

  const dryPct = totalTime > 0 ? ((dryPhaseTime / totalTime) * 100).toFixed(1) : 0;
  const midPct = totalTime > 0 ? ((midPhaseTime / totalTime) * 100).toFixed(1) : 0;
  const devPct = totalTime > 0 ? ((finishPhaseTime / totalTime) * 100).toFixed(1) : 0;

  // Phase bands at top of chart (y: 220-230 range)
  // chargeLabel will be defined later when we set up CHARGE marker, for now use findClosestLabel(0)
  const chargeLabelForPhases = findClosestLabel(0);

  if (roast.dry_time) {
    const dryLabel = findClosestLabel(roast.dry_time);
    annotations.dryPhaseBox = {
      type: 'box',
      xMin: chargeLabelForPhases,
      xMax: dryLabel,
      yMin: 220,
      yMax: 230,
      backgroundColor: COLORS.PHASE_DRY,
      borderWidth: 0,
      label: {
        display: true,
        content: `${formatDuration(dryPhaseTime)}  ${dryPct}%`,
        position: 'center',
        color: '#FFFFFF',
        font: { size: 11, weight: 'bold' },
      }
    };

    if (roast.fcs_time) {
      const fcsLabel = findClosestLabel(roast.fcs_time);
      annotations.maillardPhaseBox = {
        type: 'box',
        xMin: dryLabel,
        xMax: fcsLabel,
        yMin: 220,
        yMax: 230,
        backgroundColor: COLORS.PHASE_MAILLARD,
        borderWidth: 0,
        label: {
          display: true,
          content: `${formatDuration(midPhaseTime)}  ${midPct}%`,
          position: 'center',
          color: '#333333',
          font: { size: 11, weight: 'bold' },
        }
      };

      if (roast.drop_time) {
        const dropLabel = findClosestLabel(roast.drop_time);
        annotations.devPhaseBox = {
          type: 'box',
          xMin: fcsLabel,
          xMax: dropLabel,
          yMin: 220,
          yMax: 230,
          backgroundColor: COLORS.PHASE_DEV,
          borderWidth: 0,
          label: {
            display: true,
            content: `${formatDuration(finishPhaseTime)}  ${devPct}%`,
            position: 'center',
            color: '#FFFFFF',
            font: { size: 11, weight: 'bold' },
          }
        };
      }
    }
  }

  // Temperature delta labels on phase bands
  if (roast.dry_phase_delta_temp) {
    annotations.dryDeltaLabel = {
      type: 'label',
      xValue: roast.dry_time ? findClosestLabel(roast.dry_time / 2) : chargeLabel,
      yValue: 210,
      content: `${roast.dry_phase_delta_temp.toFixed(1)}C`,
      color: '#FFFFFF',
      font: { size: 10 },
    };
  }
  if (roast.mid_phase_delta_temp && roast.dry_time && roast.fcs_time) {
    annotations.midDeltaLabel = {
      type: 'label',
      xValue: findClosestLabel((roast.dry_time + roast.fcs_time) / 2),
      yValue: 210,
      content: `${roast.mid_phase_delta_temp.toFixed(1)}C`,
      color: '#FFFFFF',
      font: { size: 10 },
    };
  }
  if (roast.finish_phase_delta_temp && roast.fcs_time && roast.drop_time) {
    annotations.devDeltaLabel = {
      type: 'label',
      xValue: findClosestLabel((roast.fcs_time + roast.drop_time) / 2),
      yValue: 210,
      content: `${roast.finish_phase_delta_temp.toFixed(1)}C`,
      color: '#FFFFFF',
      font: { size: 10 },
    };
  }

  // Event marker lines - CHARGE (at normalized time 0)
  const chargeLabel = findClosestLabel(0); // CHARGE is at time 0 after normalization
  annotations.chargeLine = {
    type: 'line',
    xMin: chargeLabel,
    xMax: chargeLabel,
    borderColor: '#FFFFFF',
    borderWidth: 1,
    borderDash: [3, 3],
    label: {
      display: true,
      content: 'CHARGE',
      position: 'end',
      backgroundColor: 'transparent',
      color: '#FFFFFF',
      font: { size: 10, weight: 'bold' },
    }
  };
  // CHARGE temperature annotation
  if (roast.charge_bt) {
    annotations.chargeTempLabel = {
      type: 'label',
      xValue: chargeLabel,
      yValue: roast.charge_bt + 8,
      content: roast.charge_bt.toFixed(1),
      color: '#FFFFFF',
      font: { size: 9 },
    };
  }

  // TP (Turning Point)
  if (roast.tp_time) {
    const tpLabel = findClosestLabel(roast.tp_time);
    annotations.tpLine = {
      type: 'line',
      xMin: tpLabel,
      xMax: tpLabel,
      borderColor: '#AAAAAA',
      borderWidth: 1,
      borderDash: [3, 3],
      label: {
        display: true,
        content: `TP ${formatDuration(roast.tp_time)}`,
        position: 'start',
        backgroundColor: 'transparent',
        color: '#AAAAAA',
        font: { size: 10 },
      }
    };
    // TP temperature annotation
    if (roast.tp_bt) {
      annotations.tpTempLabel = {
        type: 'label',
        xValue: tpLabel,
        yValue: roast.tp_bt + 8,
        content: roast.tp_bt.toFixed(1),
        color: '#AAAAAA',
        font: { size: 9 },
      };
    }
  }

  // DRY END (DE)
  if (roast.dry_time) {
    const dryLabel = findClosestLabel(roast.dry_time);
    annotations.dryLine = {
      type: 'line',
      xMin: dryLabel,
      xMax: dryLabel,
      borderColor: '#FFFFFF',
      borderWidth: 1,
      borderDash: [3, 3],
      label: {
        display: true,
        content: `DE ${formatDuration(roast.dry_time)}`,
        position: 'start',
        backgroundColor: 'transparent',
        color: '#FFFFFF',
        font: { size: 10 },
      }
    };
    if (roast.dry_bt) {
      annotations.dryTempLabel = {
        type: 'label',
        xValue: dryLabel,
        yValue: roast.dry_bt + 8,
        content: roast.dry_bt.toFixed(1),
        color: '#FFFFFF',
        font: { size: 9 },
      };
    }
  }

  // First Crack Start (FCs)
  if (roast.fcs_time) {
    const fcsLabel = findClosestLabel(roast.fcs_time);
    annotations.fcsLine = {
      type: 'line',
      xMin: fcsLabel,
      xMax: fcsLabel,
      borderColor: '#FFFFFF',
      borderWidth: 1,
      borderDash: [3, 3],
      label: {
        display: true,
        content: `FCs ${formatDuration(roast.fcs_time)}`,
        position: 'start',
        backgroundColor: 'transparent',
        color: '#FFFFFF',
        font: { size: 10 },
      }
    };
    if (roast.fcs_bt) {
      annotations.fcsTempLabel = {
        type: 'label',
        xValue: fcsLabel,
        yValue: roast.fcs_bt + 8,
        content: roast.fcs_bt.toFixed(1),
        color: '#FFFFFF',
        font: { size: 9 },
      };
    }
  }

  // DROP
  if (roast.drop_time) {
    const dropLabel = findClosestLabel(roast.drop_time);
    annotations.dropLine = {
      type: 'line',
      xMin: dropLabel,
      xMax: dropLabel,
      borderColor: '#FFFFFF',
      borderWidth: 1,
      label: {
        display: true,
        content: `DROP ${formatDuration(roast.drop_time)}`,
        position: 'end',
        backgroundColor: 'transparent',
        color: '#FFFFFF',
        font: { size: 10, weight: 'bold' },
      }
    };
    if (roast.drop_bt) {
      annotations.dropTempLabel = {
        type: 'label',
        xValue: dropLabel,
        yValue: roast.drop_bt + 8,
        content: roast.drop_bt.toFixed(1),
        color: '#FFFFFF',
        font: { size: 9 },
      };
    }
  }

  // Build datasets
  const datasets = [
    {
      label: 'ET',
      data: et_data,
      borderColor: COLORS.ET,
      backgroundColor: 'transparent',
      borderWidth: 2,
      pointRadius: 0,
      tension: 0.2,
      yAxisID: 'y',
      order: 3,
      spanGaps: true,
    },
    {
      label: 'BT',
      data: bt_data,
      borderColor: COLORS.BT,
      backgroundColor: 'transparent',
      borderWidth: 2,
      pointRadius: 0,
      tension: 0.2,
      yAxisID: 'y',
      order: 2,
      spanGaps: true,
    },
    {
      label: 'ΔBT',
      data: bt_ror,
      borderColor: COLORS.ROR,
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      pointRadius: 0,
      tension: 0.3,
      yAxisID: 'y3',
      order: 4,
      spanGaps: true,
    },
  ];

  // Add burner level if available
  if (heatLevels.length > 0 && heatLevels.some(h => h > 0)) {
    datasets.push({
      label: 'Burner',
      data: heatLevels,
      borderColor: COLORS.BURNER,
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      pointRadius: 0,
      stepped: true,
      yAxisID: 'y2',
      order: 1,
    });
  }

  // Add fan level if available
  if (fanLevels.length > 0 && fanLevels.some(f => f > 0)) {
    datasets.push({
      label: 'Fan',
      data: fanLevels,
      borderColor: COLORS.FAN,
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      pointRadius: 0,
      stepped: true,
      yAxisID: 'y2',
      order: 0,
    });
  }

  const data = { labels, datasets };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: COLORS.TEXT,
          font: { size: 11 },
          padding: 15,
          usePointStyle: true,
          boxWidth: 20,
        },
        onClick: (e, legendItem, legend) => {
          // Default toggle behavior
          const index = legendItem.datasetIndex;
          const ci = legend.chart;
          if (ci.isDatasetVisible(index)) {
            ci.hide(index);
            legendItem.hidden = true;
          } else {
            ci.show(index);
            legendItem.hidden = false;
          }
        },
        onHover: (e) => {
          e.native.target.style.cursor = 'pointer';
        },
        onLeave: (e) => {
          e.native.target.style.cursor = 'default';
        },
      },
      title: {
        display: true,
        text: `#${roast.id || ''} ${roast.title}`,
        color: '#FFFFFF',
        font: { size: 14, weight: 'normal' },
        padding: { top: 5, bottom: 5 },
        align: 'start',
      },
      tooltip: {
        backgroundColor: 'rgba(50, 50, 50, 0.95)',
        titleColor: '#FFFFFF',
        bodyColor: '#CCCCCC',
        titleFont: { size: 12 },
        bodyFont: { size: 11 },
        padding: 10,
        cornerRadius: 4,
        displayColors: true,
        callbacks: {
          title: (context) => {
            const timeLabel = context[0].label;
            return `Time: ${timeLabel}`;
          },
          label: (context) => {
            const value = context.parsed.y;
            if (value === null || value === undefined) return null;
            const label = context.dataset.label;
            if (label === 'Burner' || label === 'Fan') {
              return `${label}: ${value.toFixed(0)}%`;
            } else if (label === 'ΔBT') {
              return `${label}: ${value.toFixed(1)}°C/min`;
            } else {
              return `${label}: ${value.toFixed(1)}°C`;
            }
          },
        },
      },
      annotation: { annotations }
    },
    scales: {
      x: {
        title: {
          display: false,
        },
        ticks: {
          maxTicksLimit: 13,
          font: { size: 10 },
          color: COLORS.TEXT,
        },
        grid: {
          color: COLORS.GRID,
          lineWidth: 1,
        },
        border: {
          color: COLORS.GRID,
        }
      },
      y: {
        type: 'linear',
        position: 'left',
        min: 0,
        max: 230,
        title: {
          display: true,
          text: 'C',
          color: COLORS.TEXT,
          font: { size: 10 },
        },
        ticks: {
          stepSize: 10,
          font: { size: 10 },
          color: COLORS.TEXT,
        },
        grid: {
          color: COLORS.GRID,
          lineWidth: 1,
        },
        border: {
          color: COLORS.GRID,
        }
      },
      y2: {
        type: 'linear',
        position: 'right',
        min: 0,
        max: 100,
        title: {
          display: true,
          text: 'Heat / Fan %',
          color: COLORS.BURNER,
          font: { size: 10 },
        },
        ticks: {
          display: true,
          stepSize: 10,
          font: { size: 9 },
          color: COLORS.BURNER,
          callback: (value) => `${value}%`,
        },
        grid: {
          display: false,
        },
        border: {
          display: false,
        }
      },
      y3: {
        type: 'linear',
        position: 'right',
        min: -5,
        max: 30,
        title: {
          display: true,
          text: 'C/min',
          color: COLORS.ROR,
          font: { size: 10 },
        },
        ticks: {
          stepSize: 5,
          font: { size: 10 },
          color: COLORS.ROR,
        },
        grid: {
          display: false,
        },
        border: {
          color: COLORS.GRID,
        }
      },
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.chartWrapper}>
        <Line data={data} options={options} />
      </div>
      <div style={styles.legendHint}>Click legend items to show/hide lines</div>

      {/* Quick Stats Section - Artisan style */}
      <div style={styles.statsSection}>
        <div style={styles.statsRow}>
          {roast.charge_bt && (
            <div style={styles.stat}>
              <span style={styles.statLabel}>CHARGE:</span>
              <span style={styles.statValue}>{roast.charge_bt?.toFixed(1)}°C</span>
            </div>
          )}
          {roast.tp_time && (
            <div style={styles.stat}>
              <span style={styles.statLabel}>TP:</span>
              <span style={styles.statValue}>{formatDuration(roast.tp_time)} @ {roast.tp_bt?.toFixed(1)}°C</span>
            </div>
          )}
          {roast.dry_time && (
            <div style={styles.stat}>
              <span style={styles.statLabel}>DE:</span>
              <span style={styles.statValue}>{formatDuration(roast.dry_time)} @ {roast.dry_bt?.toFixed(1)}°C</span>
            </div>
          )}
          {roast.fcs_time && (
            <div style={styles.stat}>
              <span style={styles.statLabel}>FCs:</span>
              <span style={styles.statValue}>{formatDuration(roast.fcs_time)} @ {roast.fcs_bt?.toFixed(1)}°C</span>
            </div>
          )}
          {roast.drop_time && (
            <div style={styles.stat}>
              <span style={styles.statLabel}>DROP:</span>
              <span style={styles.statValue}>{formatDuration(roast.drop_time)} @ {roast.drop_bt?.toFixed(1)}°C</span>
            </div>
          )}
        </div>
        <div style={styles.statsRow}>
          {roast.weight_in && (
            <div style={styles.stat}>
              <span style={styles.statLabel}>Weight:</span>
              <span style={styles.statValue}>{roast.weight_in}g</span>
            </div>
          )}
          {roast.weight_loss && (
            <div style={styles.stat}>
              <span style={styles.statLabel}>Loss:</span>
              <span style={styles.statValue}>{roast.weight_loss.toFixed(1)}%</span>
            </div>
          )}
          {roast.total_time && (
            <div style={styles.stat}>
              <span style={styles.statLabel}>Total:</span>
              <span style={styles.statValue}>{formatDuration(roast.total_time)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '10px',
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: '4px',
  },
  chartWrapper: {
    height: '500px',
    marginBottom: '5px',
  },
  legendHint: {
    textAlign: 'center',
    fontSize: '11px',
    color: '#888',
    marginBottom: '10px',
  },
  empty: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
    backgroundColor: COLORS.BACKGROUND,
  },
  statsSection: {
    padding: '10px',
    backgroundColor: '#2a2a2a',
    borderRadius: '4px',
  },
  statsRow: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
    marginBottom: '8px',
  },
  stat: {
    fontSize: '12px',
  },
  statLabel: {
    fontWeight: '600',
    marginRight: '6px',
    color: '#888888',
  },
  statValue: {
    color: '#CCCCCC',
  },
};
