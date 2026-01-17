# Drone Motor Controls Setup

## Overview
This module provides PWM-based motor control for dual-motor drone systems via a FastAPI REST API.

## Hardware Requirements
- Linux-based system with PWM support (e.g., Raspberry Pi, Jetson Nano)
- `/sys/class/pwm/pwmchip0` kernel interface available
- Two PWM channels (pwm0, pwm1) for motor control

## Installation

### 1. Python Dependencies
```bash
pip install fastapi uvicorn
```

### 2. Enable PWM on Hardware
For Raspberry Pi:
```bash
# Enable PWM in /boot/config.txt
dtoverlay=pwm-2chan,pin=18,func=2,pin2=19,func2=2

# Reboot to apply changes
sudo reboot
```

## Running the Motor Control API

### Start the Server
```bash
# Navigate to project directory
cd /path/to/DroneModel

# Run the motor control API (separate from main API)
python drone_controls.py
```

The API will start on `http://localhost:8001`

### Health Check
```bash
curl http://localhost:8001/
# Response: {"status": "Dual Motor API running"}
```

## API Endpoints

### Control Commands

| Endpoint | Method | Duty Cycle | Description |
|----------|--------|------------|-------------|
| `/stop` | GET | 1000000 ns | Stop motors (idle) |
| `/slow` | GET | 1200000 ns | Slow speed (~20%) |
| `/medium` | GET | 1400000 ns | Medium speed (~40%) |
| `/fast` | GET | 1600000 ns | Fast speed (~60%) |
| `/max` | GET | 1800000 ns | Maximum speed (~80%) |

### PWM Signal Details
- **Period**: 20ms (50 Hz) - Standard servo/ESC frequency
- **Duty Cycle Range**: 1ms - 2ms (1000000 - 2000000 nanoseconds)
- **Idle**: 1ms pulse width
- **Full throttle**: 2ms pulse width

## Usage in Operator View

The motor controls are integrated into the **Operator View** in the Command Center:

1. Switch to **Operator** role
2. Scroll to **Telemetry Stream** section (left column)
3. **Motor Control** panel appears below telemetry
4. Click speed buttons: **Stop**, **Slow**, **Medium**, **Fast**, **Maximum**

### Visual Indicators
- **Current Speed Badge**: Shows active motor status with color coding
- **Button Colors**:
  - Gray: Stop
  - Blue: Slow
  - Yellow: Medium
  - Orange: Fast
  - Red: Maximum

## Safety Features

1. **Idle on Startup**: Motors initialize to idle (1ms pulse)
2. **Error Handling**: Failed commands display alert messages
3. **Visual Warnings**: Red warning banner reminds operators of physical hardware interaction
4. **Loading States**: Buttons disable during command execution to prevent race conditions

## Troubleshooting

### Error: "Failed to control motors"
**Solution**: Ensure `drone_controls.py` is running on port 8001
```bash
python drone_controls.py
```

### Error: Permission Denied on `/sys/class/pwm`
**Solution**: Run with appropriate permissions or add user to `gpio` group
```bash
sudo usermod -a -G gpio $USER
# Logout and login again
```

### PWM Channels Not Found
**Solution**: Verify PWM is enabled in device tree
```bash
ls /sys/class/pwm/pwmchip0/
# Should show: export, npwm, uevent, unexport
```

### Motors Not Responding
**Checklist**:
1. Verify ESC calibration (standard RC ESC procedure)
2. Check power supply to ESCs (separate from logic power)
3. Confirm PWM pins are correctly wired (GPIO 18, 19 for default config)
4. Test with oscilloscope: should see 50 Hz signal with 1-2ms pulse width

## Development Notes

### Running in Development (Non-Hardware)
The API will fail on systems without PWM hardware. For development/testing:
- Use mock endpoints (returns success without hardware calls)
- Or skip motor control testing (focus on UI/frontend)

### Production Deployment
```bash
# Run as systemd service for auto-start
sudo nano /etc/systemd/system/drone-motors.service

[Unit]
Description=Drone Motor Control API
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/DroneModel
ExecStart=/usr/bin/python3 /home/pi/DroneModel/drone_controls.py
Restart=on-failure

[Install]
WantedBy=multi-user.target

# Enable and start
sudo systemctl enable drone-motors
sudo systemctl start drone-motors
```

## Architecture

```
┌─────────────────────┐
│  Operator View UI   │
│  (CommandCenter.jsx)│
└──────────┬──────────┘
           │ HTTP GET
           ▼
┌─────────────────────┐
│  FastAPI Server     │
│  (drone_controls.py)│
│  Port: 8001         │
└──────────┬──────────┘
           │ File I/O
           ▼
┌─────────────────────┐
│  Linux PWM Kernel   │
│  /sys/class/pwm/... │
└──────────┬──────────┘
           │ PWM Signal
           ▼
┌─────────────────────┐
│  ESC + Motors       │
│  (Physical Hardware)│
└─────────────────────┘
```

## Related Files
- **Frontend**: `src/CommandCenter.jsx` (Operator View)
- **Backend**: `drone_controls.py` (Motor API)
- **Main API**: `main.py` (Port 8000 - separate service)

## Future Enhancements
- [ ] Individual motor control (differential thrust)
- [ ] Real-time telemetry feedback from ESCs
- [ ] Custom speed presets
- [ ] Emergency kill switch
- [ ] Motor temperature monitoring
- [ ] Battery voltage monitoring via ADC
