"""
Parser for Artisan .alog files
"""
import ast
import json
from datetime import datetime, time, date
from typing import Dict, Any, Optional


def parse_alog_file(file_path: str) -> Optional[Dict[str, Any]]:
    """
    Parse an Artisan .alog file and return structured data

    Args:
        file_path: Path to the .alog file

    Returns:
        Dictionary containing parsed roast data, or None if parsing fails
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # .alog files contain a Python dictionary literal
        # We can use ast.literal_eval to safely parse it
        data = ast.literal_eval(content)

        return extract_roast_data(data)
    except Exception as e:
        print(f"Error parsing .alog file {file_path}: {e}")
        return None


def extract_roast_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract and structure roast data from parsed .alog content

    Args:
        data: Raw dictionary from .alog file

    Returns:
        Structured dictionary ready for Roast model
    """
    # Get computed values (contains most of the key metrics)
    computed = data.get('computed', {})

    # Parse date and time
    roast_iso_date = data.get('roastisodate', '')
    roast_time_str = data.get('roasttime', '00:00:00')

    try:
        roast_date_obj = datetime.strptime(roast_iso_date, '%Y-%m-%d').date() if roast_iso_date else date.today()
    except ValueError:
        roast_date_obj = date.today()

    try:
        roast_time_obj = datetime.strptime(roast_time_str, '%H:%M:%S').time() if roast_time_str else time(0, 0, 0)
    except ValueError:
        roast_time_obj = time(0, 0, 0)

    # Extract weight information
    weight_data = data.get('weight', [0.0, 0.0, 'g'])
    weight_in = weight_data[0] if len(weight_data) > 0 else 0.0
    weight_unit = weight_data[2] if len(weight_data) > 2 else 'g'

    # Build structured data
    roast_data = {
        # Identification
        'roast_uuid': data.get('roastUUID', ''),
        'title': data.get('title', 'Untitled Roast'),

        # Date and time
        'roast_date': roast_date_obj,
        'roast_time': roast_time_obj,
        'roast_epoch': data.get('roastepoch', 0),

        # People and equipment
        'operator': data.get('operator', ''),
        'organization': data.get('organization', ''),
        'roaster_type': data.get('roastertype', ''),
        'roaster_size': data.get('roastersize', None),
        'roaster_heating': data.get('roasterheating', None),

        # Bean information
        'beans': data.get('beans', ''),
        'weight_in': weight_in,
        'weight_out': computed.get('weightout', None),
        'weight_unit': weight_unit,
        'weight_loss': computed.get('weight_loss', None),

        # Key temperature points from computed data
        'charge_bt': computed.get('CHARGE_BT', None),
        'charge_et': computed.get('CHARGE_ET', None),

        'tp_time': computed.get('TP_time', None),
        'tp_bt': computed.get('TP_BT', None),
        'tp_et': computed.get('TP_ET', None),

        'dry_time': computed.get('DRY_time', None),
        'dry_bt': computed.get('DRY_BT', None),
        'dry_et': computed.get('DRY_ET', None),

        'fcs_time': computed.get('FCs_time', None),
        'fcs_bt': computed.get('FCs_BT', None),
        'fcs_et': computed.get('FCs_ET', None),
        'fcs_ror': computed.get('fcs_ror', None),

        'drop_time': computed.get('DROP_time', None),
        'drop_bt': computed.get('DROP_BT', None),
        'drop_et': computed.get('DROP_ET', None),

        # Phase timings
        'total_time': computed.get('totaltime', None),
        'dry_phase_time': computed.get('dryphasetime', None),
        'mid_phase_time': computed.get('midphasetime', None),
        'finish_phase_time': computed.get('finishphasetime', None),

        # ROR metrics
        'dry_phase_ror': computed.get('dry_phase_ror', None),
        'mid_phase_ror': computed.get('mid_phase_ror', None),
        'finish_phase_ror': computed.get('finish_phase_ror', None),
        'total_ror': computed.get('total_ror', None),

        # Temperature deltas
        'dry_phase_delta_temp': computed.get('dry_phase_delta_temp', None),
        'mid_phase_delta_temp': computed.get('mid_phase_delta_temp', None),
        'finish_phase_delta_temp': computed.get('finish_phase_delta_temp', None),

        # Color measurements
        'whole_color': data.get('whole_color', None),
        'ground_color': data.get('ground_color', None),
        'color_system': data.get('color_system', ''),

        # Defects
        'heavy_fc': data.get('heavyFC', False),
        'low_fc': data.get('lowFC', False),
        'light_cut': data.get('lightCut', False),
        'dark_cut': data.get('darkCut', False),
        'drops': data.get('drops', False),
        'oily': data.get('oily', False),
        'uneven': data.get('uneven', False),
        'tipping': data.get('tipping', False),
        'scorching': data.get('scorching', False),
        'divots': data.get('divots', False),

        # Notes
        'roasting_notes': data.get('roastingnotes', ''),
        'cupping_notes': data.get('cuppingnotes', ''),

        # Time series data
        'timex': data.get('timex', []),
        'temp1': data.get('temp1', []),
        'temp2': data.get('temp2', []),

        # Store entire raw data
        'raw_data': data,
    }

    return roast_data


def parse_alog_content(content: str) -> Optional[Dict[str, Any]]:
    """
    Parse .alog file content string

    Args:
        content: String content of .alog file

    Returns:
        Dictionary containing parsed roast data, or None if parsing fails
    """
    try:
        data = ast.literal_eval(content)
        return extract_roast_data(data)
    except Exception as e:
        print(f"Error parsing .alog content: {e}")
        return None
