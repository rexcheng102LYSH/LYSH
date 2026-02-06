# Screenshot Auto Backup System v4.0

## Quick Start

### 1. Install Auto-Start (Recommended)

Right-click `install.bat` and select "Run as administrator"

This will install auto-start using Windows Registry. The script will automatically run in **background** on system startup (no visible window).

### 2. Test

Double-click `monitor.bat` to start monitoring manually (hidden window)

Press `PrtSc` to take a screenshot, it will be **immediately** copied to `screenshot/` folder.

### 3. Check Status

Double-click `status.bat` to check:
- Auto-start status
- Script files
- Monitoring process
- Log file entries
- Folders

### 4. Uninstall

Right-click `uninstall.bat` and select "Run as administrator"

This will remove auto-start from Windows Registry.

## Files

- `monitor.bat` - Main launcher (starts monitoring in hidden mode)
- `monitor.ps1` - PowerShell monitoring script (real-time FileSystemWatcher)
- `install.bat` - Install auto-start (requires admin)
- `uninstall.bat` - Remove auto-start (requires admin)
- `status.bat` - Check system status
- `monitor.log` - Log file (auto-generated)
- `monitor_hidden.vbs` - VBScript wrapper for hidden execution (auto-generated)

## How It Works (New v4.0)

### Key Changes from v3.0:
1. **Background Running**: Script runs completely hidden, no window or taskbar entry
2. **Real-time Monitoring**: Uses FileSystemWatcher instead of polling (no 3-second delay)
3. **Event-Driven**: Copies screenshots **immediately** when created by PrtSc
4. **Better Logging**: All actions logged to `monitor.log` file

### Workflow:
1. **Monitor**: FileSystemWatcher watches system screenshots folder in real-time
2. **Detect**: Detects new PNG files **instantly** when created
3. **Copy**: Automatically copies to `screenshot/` folder immediately
4. **Version**: Adds timestamp to duplicate files (e.g., `Screenshot_20260102_123456.png`)
5. **Log**: Records all actions to `monitor.log` for troubleshooting

## Requirements

- Windows 10 or later
- PowerShell 5.1 or later
- Administrator privileges for install/uninstall

## Troubleshooting

### Auto-start not working

1. Run `status.bat` to check installation
2. If not installed, run `install.bat` as administrator
3. Restart computer to test
4. Check `monitor.log` for errors

### Screenshots not copying

1. Run `status.bat` to verify monitoring is running
2. Check `monitor.log` for error messages
3. Verify source folder exists: `%USERPROFILE%\Pictures\Screenshots`
4. Press PrtSc to create source folder if missing
5. Screenshots are copied **immediately** (no waiting required)

### How to stop background monitoring

Since the script runs hidden, use one of these methods:
1. Run `uninstall.bat` as administrator to remove auto-start
2. Open Task Manager, find `powershell.exe` processes, end them
3. Check `status.bat` to see if monitoring is running

### View logs

```bash
# View last 10 log entries
type scripts\monitor.log | more

# View full log
notepad scripts\monitor.log
```

## Technical Details

**Source Folder**: `%USERPROFILE%\Pictures\Screenshots`
**Target Folder**: `screenshot/` (relative to scripts folder)
**Log File**: `scripts/monitor.log`
**Monitoring Mode**: Real-time FileSystemWatcher (event-driven)
**Registry Key**: `HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run`
**Hidden Execution**: Uses VBScript wrapper with WindowStyle Hidden

## Version History

### v4.0 - Major Rewrite (Current)
- **Background Running**: Completely hidden, no window or taskbar entry
- **Real-time Monitoring**: FileSystemWatcher instead of polling
- **Event-Driven**: Copies screenshots immediately when created
- **Better Logging**: All actions logged to `monitor.log`
- **VBScript Wrapper**: Ensures true hidden execution on startup

### v3.0 - Previous Version
- Used polling (3-second interval)
- Required visible window
- MD5 hash-based detection
- State file management

## Important Notes

1. **Background Mode**: The script runs completely hidden. You won't see any window or taskbar entry.
2. **Real-time Copying**: Screenshots are copied **immediately** when you press PrtSc, no waiting required.
3. **Log File**: Check `monitor.log` for detailed information about what's happening.
4. **Duplicate Handling**: If a screenshot with the same name exists, a timestamp is added to avoid overwriting.
5. **Startup**: After installation, the script will automatically start in background on next system boot.
