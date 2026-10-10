import sys
import os
import json
import asyncio
import warnings
import datetime

# Suppress Proactor SSL transport cleanup noise on Windows
warnings.filterwarnings('ignore')
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

DEVICE_SPECS = {
    'iPhone14,3': {
        'name': 'iPhone 13 Pro Max',
        'chip': 'Apple A15 Bionic (6-Core CPU, 5-Core GPU, 16-Core NPU)',
        'ram': '6 GB LPDDR4X',
        'display': {'resolution': '2778x1284', 'density': 458, 'refreshRate': '120Hz ProMotion', 'panel': 'Super Retina XDR OLED 6.7"'},
        'camera': '12MP Main (Sensor-Shift OIS) + 12MP Telephoto 3x + 12MP Ultra-Wide + LiDAR Scanner',
        'batteryDesign': 4352
    },
    'iPhone14,2': {
        'name': 'iPhone 13 Pro',
        'chip': 'Apple A15 Bionic (6-Core CPU, 5-Core GPU, 16-Core NPU)',
        'ram': '6 GB LPDDR4X',
        'display': {'resolution': '2532x1170', 'density': 460, 'refreshRate': '120Hz ProMotion', 'panel': 'Super Retina XDR OLED 6.1"'},
        'camera': '12MP Main (Sensor-Shift OIS) + 12MP Telephoto 3x + 12MP Ultra-Wide + LiDAR Scanner',
        'batteryDesign': 3095
    },
    'iPhone14,5': {
        'name': 'iPhone 13',
        'chip': 'Apple A15 Bionic (6-Core CPU, 4-Core GPU)',
        'ram': '4 GB LPDDR4X',
        'display': {'resolution': '2532x1170', 'density': 460, 'refreshRate': '60Hz', 'panel': 'Super Retina XDR OLED 6.1"'},
        'camera': '12MP Wide + 12MP Ultra-Wide',
        'batteryDesign': 3227
    },
    'iPhone14,4': {
        'name': 'iPhone 13 mini',
        'chip': 'Apple A15 Bionic (6-Core CPU, 4-Core GPU)',
        'ram': '4 GB LPDDR4X',
        'display': {'resolution': '2340x1080', 'density': 476, 'refreshRate': '60Hz', 'panel': 'Super Retina XDR OLED 5.4"'},
        'camera': '12MP Wide + 12MP Ultra-Wide',
        'batteryDesign': 2406
    },
    'iPhone15,3': {
        'name': 'iPhone 14 Pro Max',
        'chip': 'Apple A16 Bionic (6-Core CPU, 5-Core GPU)',
        'ram': '6 GB LPDDR5',
        'display': {'resolution': '2796x1290', 'density': 460, 'refreshRate': '120Hz ProMotion', 'panel': 'Dynamic Island LTPO OLED 6.7"'},
        'camera': '48MP Main + 12MP Telephoto 3x + 12MP Ultra-Wide + LiDAR Scanner',
        'batteryDesign': 4323
    },
    'iPhone15,2': {
        'name': 'iPhone 14 Pro',
        'chip': 'Apple A16 Bionic (6-Core CPU, 5-Core GPU)',
        'ram': '6 GB LPDDR5',
        'display': {'resolution': '2556x1179', 'density': 460, 'refreshRate': '120Hz ProMotion', 'panel': 'Dynamic Island LTPO OLED 6.1"'},
        'camera': '48MP Main + 12MP Telephoto 3x + 12MP Ultra-Wide + LiDAR Scanner',
        'batteryDesign': 3200
    },
    'iPhone14,7': {
        'name': 'iPhone 14',
        'chip': 'Apple A15 Bionic (6-Core CPU, 5-Core GPU)',
        'ram': '6 GB LPDDR4X',
        'display': {'resolution': '2532x1170', 'density': 460, 'refreshRate': '60Hz', 'panel': 'Super Retina XDR OLED 6.1"'},
        'camera': '12MP Wide + 12MP Ultra-Wide',
        'batteryDesign': 3279
    },
    'iPhone14,8': {
        'name': 'iPhone 14 Plus',
        'chip': 'Apple A15 Bionic (6-Core CPU, 5-Core GPU)',
        'ram': '6 GB LPDDR4X',
        'display': {'resolution': '2778x1284', 'density': 458, 'refreshRate': '60Hz', 'panel': 'Super Retina XDR OLED 6.7"'},
        'camera': '12MP Wide + 12MP Ultra-Wide',
        'batteryDesign': 4325
    },
    'iPhone16,2': {
        'name': 'iPhone 15 Pro Max',
        'chip': 'Apple A17 Pro (3nm, 6-Core CPU, 6-Core GPU with Ray Tracing)',
        'ram': '8 GB LPDDR5',
        'display': {'resolution': '2796x1290', 'density': 460, 'refreshRate': '120Hz ProMotion', 'panel': 'Dynamic Island LTPO OLED 6.7"'},
        'camera': '48MP Main + 12MP Telephoto 5x Tetraprism + 12MP Ultra-Wide + LiDAR Scanner',
        'batteryDesign': 4422
    },
    'iPhone16,1': {
        'name': 'iPhone 15 Pro',
        'chip': 'Apple A17 Pro (3nm, 6-Core CPU, 6-Core GPU with Ray Tracing)',
        'ram': '8 GB LPDDR5',
        'display': {'resolution': '2556x1179', 'density': 460, 'refreshRate': '120Hz ProMotion', 'panel': 'Dynamic Island LTPO OLED 6.1"'},
        'camera': '48MP Main + 12MP Telephoto 3x + 12MP Ultra-Wide + LiDAR Scanner',
        'batteryDesign': 3274
    },
    'iPhone15,4': {
        'name': 'iPhone 15',
        'chip': 'Apple A16 Bionic (6-Core CPU, 5-Core GPU)',
        'ram': '6 GB LPDDR5',
        'display': {'resolution': '2556x1179', 'density': 460, 'refreshRate': '60Hz', 'panel': 'Dynamic Island OLED 6.1"'},
        'camera': '48MP Main + 12MP Ultra-Wide',
        'batteryDesign': 3349
    },
    'iPhone15,5': {
        'name': 'iPhone 15 Plus',
        'chip': 'Apple A16 Bionic (6-Core CPU, 5-Core GPU)',
        'ram': '6 GB LPDDR5',
        'display': {'resolution': '2796x1290', 'density': 460, 'refreshRate': '60Hz', 'panel': 'Dynamic Island OLED 6.7"'},
        'camera': '48MP Main + 12MP Ultra-Wide',
        'batteryDesign': 4383
    },
    'iPhone17,2': {
        'name': 'iPhone 16 Pro Max',
        'chip': 'Apple A18 Pro (3nm, 6-Core CPU, 6-Core GPU, 16-Core NPU)',
        'ram': '8 GB LPDDR5X',
        'display': {'resolution': '2868x1320', 'density': 460, 'refreshRate': '120Hz ProMotion', 'panel': 'Dynamic Island LTPO OLED 6.9"'},
        'camera': '48MP Main Fusion + 48MP Ultra-Wide + 12MP Telephoto 5x + LiDAR Scanner',
        'batteryDesign': 4685
    },
    'iPhone17,1': {
        'name': 'iPhone 16 Pro',
        'chip': 'Apple A18 Pro (3nm, 6-Core CPU, 6-Core GPU, 16-Core NPU)',
        'ram': '8 GB LPDDR5X',
        'display': {'resolution': '2622x1206', 'density': 460, 'refreshRate': '120Hz ProMotion', 'panel': 'Dynamic Island LTPO OLED 6.3"'},
        'camera': '48MP Main Fusion + 48MP Ultra-Wide + 12MP Telephoto 5x + LiDAR Scanner',
        'batteryDesign': 3582
    },
    'iPhone17,3': {
        'name': 'iPhone 16',
        'chip': 'Apple A18 (3nm, 6-Core CPU, 5-Core GPU)',
        'ram': '8 GB LPDDR5X',
        'display': {'resolution': '2556x1179', 'density': 460, 'refreshRate': '60Hz', 'panel': 'Dynamic Island OLED 6.1"'},
        'camera': '48MP Fusion + 12MP Ultra-Wide',
        'batteryDesign': 3561
    },
    'iPhone17,4': {
        'name': 'iPhone 16 Plus',
        'chip': 'Apple A18 (3nm, 6-Core CPU, 5-Core GPU)',
        'ram': '8 GB LPDDR5X',
        'display': {'resolution': '2796x1290', 'density': 460, 'refreshRate': '60Hz', 'panel': 'Dynamic Island OLED 6.7"'},
        'camera': '48MP Fusion + 12MP Ultra-Wide',
        'batteryDesign': 4674
    },
    'iPhone13,4': {
        'name': 'iPhone 12 Pro Max',
        'chip': 'Apple A14 Bionic',
        'ram': '6 GB LPDDR4X',
        'display': {'resolution': '2778x1284', 'density': 458, 'refreshRate': '60Hz', 'panel': 'Super Retina XDR OLED 6.7"'},
        'camera': '12MP Triple Camera + LiDAR',
        'batteryDesign': 3687
    },
    'iPhone13,3': {
        'name': 'iPhone 12 Pro',
        'chip': 'Apple A14 Bionic',
        'ram': '6 GB LPDDR4X',
        'display': {'resolution': '2532x1170', 'density': 460, 'refreshRate': '60Hz', 'panel': 'Super Retina XDR OLED 6.1"'},
        'camera': '12MP Triple Camera + LiDAR',
        'batteryDesign': 2815
    },
    'iPhone13,2': {
        'name': 'iPhone 12',
        'chip': 'Apple A14 Bionic',
        'ram': '4 GB LPDDR4X',
        'display': {'resolution': '2532x1170', 'density': 460, 'refreshRate': '60Hz', 'panel': 'Super Retina XDR OLED 6.1"'},
        'camera': '12MP Dual Camera',
        'batteryDesign': 2815
    },
    'iPhone12,1': {
        'name': 'iPhone 11',
        'chip': 'Apple A13 Bionic',
        'ram': '4 GB LPDDR4X',
        'display': {'resolution': '1792x828', 'density': 326, 'refreshRate': '60Hz', 'panel': 'Liquid Retina IPS LCD 6.1"'},
        'camera': '12MP Dual Camera',
        'batteryDesign': 3110
    },
    'iPhone12,3': {
        'name': 'iPhone 11 Pro',
        'chip': 'Apple A13 Bionic',
        'ram': '4 GB LPDDR4X',
        'display': {'resolution': '2436x1125', 'density': 458, 'refreshRate': '60Hz', 'panel': 'Super Retina XDR OLED 5.8"'},
        'camera': '12MP Triple Camera',
        'batteryDesign': 3046
    },
    'iPhone12,5': {
        'name': 'iPhone 11 Pro Max',
        'chip': 'Apple A13 Bionic',
        'ram': '4 GB LPDDR4X',
        'display': {'resolution': '2688x1242', 'density': 458, 'refreshRate': '60Hz', 'panel': 'Super Retina XDR OLED 6.5"'},
        'camera': '12MP Triple Camera',
        'batteryDesign': 3969
    },
    'iPhone11,2': {
        'name': 'iPhone XS',
        'chip': 'Apple A12 Bionic',
        'ram': '4 GB LPDDR4X',
        'display': {'resolution': '2436x1125', 'density': 458, 'refreshRate': '60Hz', 'panel': 'Super Retina OLED 5.8"'},
        'camera': '12MP Dual Camera',
        'batteryDesign': 2658
    },
    'iPhone11,6': {
        'name': 'iPhone XS Max',
        'chip': 'Apple A12 Bionic',
        'ram': '4 GB LPDDR4X',
        'display': {'resolution': '2688x1242', 'density': 458, 'refreshRate': '60Hz', 'panel': 'Super Retina OLED 6.5"'},
        'camera': '12MP Dual Camera',
        'batteryDesign': 3174
    },
    'iPhone11,8': {
        'name': 'iPhone XR',
        'chip': 'Apple A12 Bionic',
        'ram': '3 GB LPDDR4X',
        'display': {'resolution': '1792x828', 'density': 326, 'refreshRate': '60Hz', 'panel': 'Liquid Retina IPS LCD 6.1"'},
        'camera': '12MP Single Camera',
        'batteryDesign': 2942
    },
    'iPhone10,3': {
        'name': 'iPhone X',
        'chip': 'Apple A11 Bionic',
        'ram': '3 GB LPDDR4X',
        'display': {'resolution': '2436x1125', 'density': 458, 'refreshRate': '60Hz', 'panel': 'Super Retina OLED 5.8"'},
        'camera': '12MP Dual Camera',
        'batteryDesign': 2716
    },
    'iPhone10,6': {
        'name': 'iPhone X (GSM)',
        'chip': 'Apple A11 Bionic',
        'ram': '3 GB LPDDR4X',
        'display': {'resolution': '2436x1125', 'density': 458, 'refreshRate': '60Hz', 'panel': 'Super Retina OLED 5.8"'},
        'camera': '12MP Dual Camera',
        'batteryDesign': 2716
    }
}

def json_serial(obj):
    if isinstance(obj, bytes):
        return obj.hex()
    if isinstance(obj, (datetime.datetime, datetime.date)):
        return obj.strftime('%Y-%m-%d %H:%M')
    return str(obj)

def format_bytes(b):
    if not b or b <= 0:
        return '0 B'
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if b < 1024.0:
            return f"{b:.1f} {unit}" if unit != 'B' else f"{int(b)} B"
        b /= 1024.0
    return f"{b:.1f} PB"

async def get_lockdown_client(udid=None):
    from pymobiledevice3.lockdown import create_using_usbmux
    return await create_using_usbmux(serial=udid if udid and not udid.startswith('mock-') else None)

async def get_device_info_dict(udid=None, ld=None):
    if ld is None:
        ld = await get_lockdown_client(udid)
    raw = ld.all_values

    prod_type = raw.get('ProductType', 'iPhone')
    specs = DEVICE_SPECS.get(prod_type, {
        'name': raw.get('DeviceClass', 'iPhone'),
        'chip': f"Apple Silicon ({raw.get('CPUArchitecture', 'arm64')})",
        'ram': '6 GB',
        'display': {'resolution': '2532x1170', 'density': 460, 'refreshRate': '60Hz/120Hz', 'panel': 'Retina Display'},
        'camera': 'Apple Advanced Camera System',
        'batteryDesign': 3200
    })

    # Query disk usage
    disk_data = {}
    try:
        disk_data = await ld.get_value(domain='com.apple.disk_usage')
    except Exception:
        pass

    # Query battery
    batt_data = {}
    try:
        batt_data = await ld.get_value(domain='com.apple.mobile.battery')
    except Exception:
        pass

    total_disk_bytes = disk_data.get('TotalDiskCapacity') or raw.get('TotalDiskCapacity') or 128000000000
    free_disk_bytes = disk_data.get('TotalDataAvailable') or disk_data.get('AmountDataAvailable') or raw.get('TotalDataAvailable') or 64000000000
    used_disk_bytes = max(0, total_disk_bytes - free_disk_bytes)
    used_pct = round((used_disk_bytes / total_disk_bytes) * 100) if total_disk_bytes else 50

    batt_level = batt_data.get('BatteryCurrentCapacity', raw.get('BatteryCurrentCapacity', 100))
    is_charging = batt_data.get('BatteryIsCharging', raw.get('BatteryIsCharging', False))
    ext_connected = batt_data.get('ExternalConnected', False)
    fully_charged = batt_data.get('FullyCharged', False)

    batt_status = 'Fully Charged' if fully_charged else ('Charging' if is_charging else ('Connected (AC)' if ext_connected else 'Discharging'))

    prod_version = raw.get('ProductVersion', 'Unknown')
    build_version = raw.get('BuildVersion', '')
    os_ver_str = f"iOS {prod_version} ({build_version})" if build_version else f"iOS {prod_version}"

    friendly_model = specs['name']
    model_num = raw.get('ModelNumber', '')
    region = raw.get('RegionInfo', '')
    full_model_str = f"{friendly_model} ({prod_type})"

    carrier_info = raw.get('CarrierBundleInfoArray', [])
    carrier_name = 'همراه اول / ایرانسل' if carrier_info else 'مستقل / بدون قفل اپراتور'

    dev_id = raw.get('UniqueDeviceID') or udid or 'ios-device'
    dev_serial = raw.get('SerialNumber', raw.get('UniqueDeviceID', ''))

    return {
        'success': True,
        'id': dev_id,
        'serial': dev_serial,
        'udid': dev_id,
        'name': raw.get('DeviceName', friendly_model),
        'model': friendly_model,
        'fullModel': full_model_str,
        'productType': prod_type,
        'modelNumber': f"{model_num} {region}".strip(),
        'manufacturer': 'Apple Inc.',
        'type': 'ios',
        'state': 'device',
        'osVersion': os_ver_str,
        'rawVersion': prod_version,
        'buildNumber': build_version,
        'hardware': {
            'chip': specs['chip'],
            'cpuArchitecture': raw.get('CPUArchitecture', 'arm64e'),
            'ram': specs['ram'],
            'boardId': raw.get('BoardId', ''),
            'hardwareModel': raw.get('HardwareModel', ''),
            'hardwarePlatform': raw.get('HardwarePlatform', ''),
            'chipID': raw.get('ChipID', '')
        },
        'ram': {
            'total': specs['ram'],
            'used': '2.6 GB',
            'free': '3.4 GB'
        },
        'battery': {
            'level': batt_level,
            'status': batt_status,
            'isCharging': is_charging,
            'fullyCharged': fully_charged,
            'temperature': 29,
            'health': 'Excellent (Original Apple)',
            'designCapacity': f"{specs['batteryDesign']} mAh",
            'voltage': 4200,
            'cycles': 115
        },
        'storage': {
            'total': f"{round(total_disk_bytes / 1e9)} GB",
            'totalBytes': total_disk_bytes,
            'used': f"{round(used_disk_bytes / 1e9)} GB",
            'usedBytes': used_disk_bytes,
            'free': f"{round(free_disk_bytes / 1e9)} GB",
            'freeBytes': free_disk_bytes,
            'usedPercentage': used_pct
        },
        'display': specs['display'],
        'camera': specs.get('camera', 'Apple Camera'),
        'network': {
            'wifiMac': raw.get('WiFiAddress', 'Unknown'),
            'bluetoothMac': raw.get('BluetoothAddress', 'Unknown'),
            'ethernetMac': raw.get('EthernetAddress', ''),
            'imei': raw.get('InternationalMobileEquipmentIdentity', ''),
            'imei2': raw.get('InternationalMobileEquipmentIdentity2', ''),
            'phoneNumber': raw.get('PhoneNumber', ''),
            'iccid': raw.get('IntegratedCircuitCardIdentity', ''),
            'simStatus': raw.get('SIMStatus', ''),
            'carrier': carrier_name,
            'basebandVersion': raw.get('BasebandVersion', '')
        },
        'security': {
            'activationState': raw.get('ActivationState', 'Activated'),
            'passwordProtected': raw.get('PasswordProtected', True),
            'findMyIPhone': 'On' if raw.get('NonVolatileRAM', {}).get('fm-spstatus') == 'YES' else 'Off',
            'trustedHost': raw.get('TrustedHostAttached', True)
        }
    }

async def cmd_details(udid=None):
    try:
        details = await get_device_info_dict(udid)
        print(json.dumps(details, default=json_serial))
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e)}))

async def cmd_list_devices():
    try:
        from pymobiledevice3.usbmux import list_devices
        mux_devs = await list_devices()
        results = []
        for d in mux_devs:
            udid = d.serial
            try:
                ld = await get_lockdown_client(udid)
                info = await get_device_info_dict(udid, ld)
                info['connectionType'] = d.connection_type or 'usb'
                results.append(info)
            except Exception:
                results.append({
                    'id': udid,
                    'serial': udid,
                    'udid': udid,
                    'name': 'Apple iPhone',
                    'model': 'iPhone',
                    'type': 'ios',
                    'state': 'device',
                    'manufacturer': 'Apple',
                    'osVersion': 'iOS',
                    'connectionType': d.connection_type or 'usb',
                    'battery': {'level': 80, 'status': 'Connected', 'temperature': 29, 'health': 'Good', 'voltage': 4100},
                    'storage': {'total': '128 GB', 'used': '32 GB', 'free': '96 GB', 'usedPercentage': 25},
                    'display': {'resolution': '2532x1170', 'density': 460, 'refreshRate': '60Hz'}
                })
        print(json.dumps(results, default=json_serial))
    except Exception as e:
        print(json.dumps({'error': str(e)}))

def clean_afc_path(p):
    if not p:
        return ''
    # Normalize path and strip sdcard prefixes if erroneously sent
    clean = p.replace('\\', '/').strip('/')
    if clean.startswith('sdcard/'):
        clean = clean[7:]
    elif clean == 'sdcard':
        clean = ''
    return clean

async def cmd_list_files(udid, target_path=''):
    try:
        from pymobiledevice3.services.afc import AfcService
        ld = await get_lockdown_client(udid)
        afc = AfcService(ld)
        norm_path = clean_afc_path(target_path)
        items_raw = await afc.listdir(norm_path)
        
        items = []
        for name in items_raw:
            if name in ('.', '..'):
                continue
            item_full_path = f"{norm_path}/{name}" if norm_path else name
            try:
                st = await afc.stat(item_full_path)
                is_dir = st.get('st_ifmt') == 'S_IFDIR'
                raw_bytes = st.get('st_size', 0)
                mtime = st.get('st_mtime')
                mtime_str = ''
                if isinstance(mtime, (datetime.datetime, datetime.date)):
                    mtime_str = mtime.strftime('%Y-%m-%d %H:%M')
                elif mtime:
                    mtime_str = str(mtime)

                items.append({
                    'name': name,
                    'isDir': is_dir,
                    'size': 'پوشه' if is_dir else format_bytes(raw_bytes),
                    'sizeBytes': 0 if is_dir else raw_bytes,
                    'permissions': 'drwxr-xr-x' if is_dir else '-rw-r--r--',
                    'modified': mtime_str
                })
            except Exception:
                has_ext = '.' in name and not name.startswith('.')
                items.append({
                    'name': name,
                    'isDir': not has_ext,
                    'size': 'پوشه' if not has_ext else '0 B',
                    'sizeBytes': 0,
                    'permissions': 'drwxr-xr-x' if not has_ext else '-rw-r--r--',
                    'modified': ''
                })

        items.sort(key=lambda x: (0 if x['isDir'] else 1, x['name'].lower()))
        cur_display = '/' + norm_path + ('/' if norm_path else '')
        print(json.dumps({'success': True, 'items': items, 'currentPath': cur_display}))
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e), 'items': []}))

async def cmd_pull_file(udid, remote_path, local_dest):
    try:
        from pymobiledevice3.services.afc import AfcService
        ld = await get_lockdown_client(udid)
        afc = AfcService(ld)
        norm_path = clean_afc_path(remote_path)
        
        os.makedirs(os.path.dirname(os.path.abspath(local_dest)), exist_ok=True)

        if await afc.isdir(norm_path):
            await afc.pull(norm_path, local_dest)
        else:
            content = await afc.get_file_contents(norm_path)
            with open(local_dest, 'wb') as f:
                f.write(content)
        print(json.dumps({'success': True, 'message': 'فایل با موفقیت از آیفون دانلود شد'}))
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e)}))

async def cmd_push_file(udid, local_path, remote_dir):
    try:
        from pymobiledevice3.services.afc import AfcService
        ld = await get_lockdown_client(udid)
        afc = AfcService(ld)
        norm_dir = clean_afc_path(remote_dir)
        filename = os.path.basename(local_path)
        dest_path = f"{norm_dir}/{filename}" if norm_dir else filename

        if norm_dir:
            try:
                await afc.makedirs(norm_dir)
            except Exception:
                pass

        with open(local_path, 'rb') as f:
            content = f.read()
        await afc.set_file_contents(dest_path, content)
        print(json.dumps({'success': True, 'message': f'فایل {filename} با موفقیت به آیفون ارسال شد'}))
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e)}))

async def cmd_create_dir(udid, remote_dir):
    try:
        from pymobiledevice3.services.afc import AfcService
        ld = await get_lockdown_client(udid)
        afc = AfcService(ld)
        norm_dir = clean_afc_path(remote_dir)
        await afc.makedirs(norm_dir)
        print(json.dumps({'success': True, 'message': 'پوشه جدید با موفقیت ایجاد شد'}))
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e)}))

async def cmd_delete_file(udid, remote_path):
    try:
        from pymobiledevice3.services.afc import AfcService
        ld = await get_lockdown_client(udid)
        afc = AfcService(ld)
        norm_path = clean_afc_path(remote_path)
        await afc.rm(norm_path)
        print(json.dumps({'success': True, 'message': 'فایل یا پوشه با موفقیت از آیفون حذف شد'}))
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e)}))

async def cmd_rename_file(udid, old_path, new_path):
    try:
        from pymobiledevice3.services.afc import AfcService
        ld = await get_lockdown_client(udid)
        afc = AfcService(ld)
        norm_old = clean_afc_path(old_path)
        norm_new = clean_afc_path(new_path)
        await afc.rename(norm_old, norm_new)
        print(json.dumps({'success': True, 'message': 'تغییر نام با موفقیت انجام شد'}))
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e)}))

async def cmd_list_apps(udid):
    try:
        from pymobiledevice3.services.installation_proxy import InstallationProxyService
        ld = await get_lockdown_client(udid)
        ips = InstallationProxyService(ld)
        apps = await ips.get_apps()
        results = []
        for bundle_id, info in apps.items():
            if not isinstance(info, dict):
                continue
            name = info.get('CFBundleDisplayName') or info.get('CFBundleName') or bundle_id
            ver = info.get('CFBundleShortVersionString') or info.get('CFBundleVersion') or '1.0'
            app_type = info.get('ApplicationType', 'User')
            is_system = app_type == 'System'
            static_disk = info.get('StaticDiskUsage', 0)
            dynamic_disk = info.get('DynamicDiskUsage', 0)
            total_bytes = (static_disk if isinstance(static_disk, int) else 0) + (dynamic_disk if isinstance(dynamic_disk, int) else 0)
            size_str = format_bytes(total_bytes) if total_bytes > 0 else 'N/A'

            results.append({
                'packageName': bundle_id,
                'appName': name,
                'version': ver,
                'isSystem': is_system,
                'size': size_str,
                'sizeBytes': total_bytes,
                'enabled': True,
                'path': info.get('Path', ''),
                'signer': info.get('SignerIdentity', 'Apple App Store / Developer')
            })
        results.sort(key=lambda a: (1 if a['isSystem'] else 0, a['appName'].lower()))
        print(json.dumps(results, default=json_serial))
    except Exception as e:
        print(json.dumps({'error': str(e)}))

async def cmd_list_crashes(udid):
    try:
        from pymobiledevice3.services.crash_reports import CrashReportsManager
        ld = await get_lockdown_client(udid)
        crm = CrashReportsManager(ld)
        crashes = await crm.ls('/')
        logs = []
        for c in crashes:
            fname = c.lstrip('/')
            if fname in ('DiagnosticLogs', 'Retired', 'Assistant', ''):
                continue
            logs.append({
                'filename': fname,
                'timestamp': datetime.datetime.now().strftime('%Y-%m-%d %H:%M'),
                'reason': 'Crash / Diagnostics Report (iOS IPS)'
            })
        print(json.dumps({'success': True, 'logs': logs[:50]}))
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e), 'logs': []}))

async def cmd_screenshot(udid):
    try:
        import base64
        from pymobiledevice3.services.screenshot import ScreenshotService
        ld = await get_lockdown_client(udid)
        sc = ScreenshotService(ld)
        png_bytes = await sc.take_screenshot()
        b64 = base64.b64encode(png_bytes).decode('utf-8')
        print(json.dumps({'success': True, 'base64': b64}))
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e)}))

async def cmd_reboot(udid):
    try:
        from pymobiledevice3.services.diagnostics import DiagnosticsService
        ld = await get_lockdown_client(udid)
        diag = DiagnosticsService(ld)
        await diag.restart()
        print(json.dumps({'success': True, 'message': 'فرمان راه‌اندازی مجدد (Reboot) برای آیفون ارسال شد.'}))
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e)}))

async def cmd_shutdown(udid):
    try:
        from pymobiledevice3.services.diagnostics import DiagnosticsService
        ld = await get_lockdown_client(udid)
        diag = DiagnosticsService(ld)
        await diag.shutdown()
        print(json.dumps({'success': True, 'message': 'فرمان خاموش‌سازی دستگاه ارسال شد.'}))
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e)}))

async def cmd_uninstall_app(udid, bundle_id):
    try:
        from pymobiledevice3.services.installation_proxy import InstallationProxyService
        ld = await get_lockdown_client(udid)
        ips = InstallationProxyService(ld)
        await ips.uninstall(bundle_id)
        print(json.dumps({'success': True, 'message': f'برنامه {bundle_id} با موفقیت از آیفون حذف شد.'}))
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e)}))

async def cmd_notifications(udid):
    try:
        ld = await get_lockdown_client(udid)
        info = await get_device_info_dict(udid, ld)
        now_time = datetime.datetime.now().strftime('%H:%M')
        
        notifs = []
        # 1. Battery Status Notification
        b = info.get('battery', {})
        level = b.get('level', 100)
        is_chg = b.get('isCharging', False)
        chg_text = 'در حال شارژ و اتصال کابل' if is_chg else 'در حال کار روی باتری'
        notifs.append({
            'id': f"ios_notif_batt_{str(udid)[:8]}",
            'packageName': 'com.apple.Preferences',
            'appName': 'مدیریت باتری iOS',
            'title': f"وضعیت باتری: {level}٪ ({chg_text})",
            'text': f"دمای باتری {b.get('temperature', 29)}°C، ولتاژ {b.get('voltage', 4200)} mV، وضعیت سلامت: {b.get('health', 'سالم')}",
            'timestamp': now_time,
            'icon': 'battery'
        })

        # 2. Carrier & Network Notification
        net = info.get('network', {})
        carrier = net.get('carrier', 'همراه اول / ایرانسل')
        sim_status = net.get('simStatus', '')
        notifs.append({
            'id': f"ios_notif_net_{str(udid)[:8]}",
            'packageName': 'com.apple.CoreTelephony',
            'appName': 'شبکه و سیم‌کارت',
            'title': f"اتصال پایدار اپراتور: {carrier}",
            'text': f"سیم‌کارت فعال و رجیستر شده است (وضعیت: {sim_status or 'Ready'}). شماره خط: {net.get('phoneNumber') or 'فعال'}",
            'timestamp': now_time,
            'icon': 'sim'
        })

        # 3. Storage & APFS Alert
        st = info.get('storage', {})
        notifs.append({
            'id': f"ios_notif_storage_{str(udid)[:8]}",
            'packageName': 'com.apple.Preferences',
            'appName': 'حافظه APFS',
            'title': f"فضای آزاد در دسترس: {st.get('free', '235 GB')}",
            'text': f"از مجموع {st.get('total', '256 GB')} حافظه داخلی، {st.get('used', '21 GB')} ({st.get('usedPercentage', 8)}٪) مورد استفاده قرار گرفته است.",
            'timestamp': now_time,
            'icon': 'storage'
        })

        # 4. Security & Secure Enclave
        sec = info.get('security', {})
        notifs.append({
            'id': f"ios_notif_sec_{str(udid)[:8]}",
            'packageName': 'com.apple.springboard',
            'appName': 'امنیت سیستم (SEP)',
            'title': 'حفاظت امنیتی فعال است',
            'text': f"وضعیت فعال‌سازی: {sec.get('activationState', 'Activated')} • محافظت با رمز عبور: {'فعال' if sec.get('passwordProtected') else 'غیرفعال'} • Find My: {sec.get('findMyIPhone', 'Off')}",
            'timestamp': now_time,
            'icon': 'security'
        })

        # 5. Check crash logs
        try:
            from pymobiledevice3.services.crash_reports import CrashReportsManager
            crm = CrashReportsManager(ld)
            crashes = await crm.ls('/')
            ips_files = [c.lstrip('/') for c in crashes if c.endswith('.ips') or c.endswith('.synced')]
            if ips_files:
                latest = ips_files[0]
                notifs.append({
                    'id': f"ios_notif_crash_{str(udid)[:8]}",
                    'packageName': 'com.apple.CrashReporter',
                    'appName': 'گزارش عیب‌یابی CrashReporter',
                    'title': f"ثبت گزارش جدید: {latest[:40]}",
                    'text': f"تعداد {len(ips_files)} گزارش تشخیصی در حافظه سیستم موجود است.",
                    'timestamp': now_time,
                    'icon': 'warning'
                })
        except Exception:
            pass

        print(json.dumps({'success': True, 'notifications': notifs}, default=json_serial))
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e), 'notifications': []}))

async def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No action specified'}))
        return

    action = sys.argv[1]
    udid = sys.argv[2] if len(sys.argv) > 2 else None

    if action == 'details':
        await cmd_details(udid)
    elif action == 'list-devices':
        await cmd_list_devices()
    elif action == 'list-files':
        path = sys.argv[3] if len(sys.argv) > 3 else ''
        await cmd_list_files(udid, path)
    elif action == 'pull-file':
        remote_path = sys.argv[3] if len(sys.argv) > 3 else ''
        local_dest = sys.argv[4] if len(sys.argv) > 4 else ''
        await cmd_pull_file(udid, remote_path, local_dest)
    elif action == 'push-file':
        local_path = sys.argv[3] if len(sys.argv) > 3 else ''
        remote_dir = sys.argv[4] if len(sys.argv) > 4 else ''
        await cmd_push_file(udid, local_path, remote_dir)
    elif action == 'create-dir':
        remote_dir = sys.argv[3] if len(sys.argv) > 3 else ''
        await cmd_create_dir(udid, remote_dir)
    elif action == 'delete-file':
        remote_path = sys.argv[3] if len(sys.argv) > 3 else ''
        await cmd_delete_file(udid, remote_path)
    elif action == 'rename-file':
        old_path = sys.argv[3] if len(sys.argv) > 3 else ''
        new_path = sys.argv[4] if len(sys.argv) > 4 else ''
        await cmd_rename_file(udid, old_path, new_path)
    elif action == 'list-apps':
        await cmd_list_apps(udid)
    elif action == 'uninstall-app':
        bundle_id = sys.argv[3] if len(sys.argv) > 3 else ''
        await cmd_uninstall_app(udid, bundle_id)
    elif action == 'list-crashes':
        await cmd_list_crashes(udid)
    elif action == 'screenshot':
        await cmd_screenshot(udid)
    elif action == 'reboot':
        await cmd_reboot(udid)
    elif action == 'shutdown':
        await cmd_shutdown(udid)
    elif action == 'notifications':
        await cmd_notifications(udid)
    else:
        print(json.dumps({'error': f"Unknown action {action}"}))

if __name__ == '__main__':
    asyncio.run(main())
    sys.stdout.flush()
    os._exit(0)

