from fastapi import FastAPI
import time
import os

app = FastAPI()

PWM_CHIP = "/sys/class/pwm/pwmchip0"
PWM0 = "/sys/class/pwm/pwmchip0/pwm0"
PWM1 = "/sys/class/pwm/pwmchip0/pwm1"

def write(path, value):
    """Write value to a system file"""
    with open(path, "w") as f:
        f.write(str(value))

def setup_pwm_channel(pwm_path):
    """Configure a PWM channel with default settings"""
    write(f"{pwm_path}/enable", "0")
    write(f"{pwm_path}/period", "20000000")      # 50 Hz
    write(f"{pwm_path}/duty_cycle", "1000000")  # idle
    write(f"{pwm_path}/enable", "1")

@app.on_event("startup")
def setup_pwm():
    """Initialize PWM channels on startup"""
    # Export PWM channels if not already exported
    if not os.path.exists(PWM0):
        write(f"{PWM_CHIP}/export", "0")
        time.sleep(0.2)

    if not os.path.exists(PWM1):
        write(f"{PWM_CHIP}/export", "1")
        time.sleep(0.2)

    # Setup both PWM channels
    setup_pwm_channel(PWM0)
    setup_pwm_channel(PWM1)

@app.get("/")
def root():
    """Health check endpoint"""
    return {"status": "Dual Motor API running"}

@app.get("/stop")
def stop():
    """Stop both motors (idle position)"""
    write(f"{PWM0}/duty_cycle", "1000000")
    write(f"{PWM1}/duty_cycle", "1000000")
    return {"motors": "stopped", "duty_cycle": 1000000}

@app.get("/slow")
def slow():
    """Set motors to slow speed"""
    write(f"{PWM0}/duty_cycle", "1200000")
    write(f"{PWM1}/duty_cycle", "1200000")
    return {"motors": "slow", "duty_cycle": 1200000}

@app.get("/medium")
def medium():
    """Set motors to medium speed"""
    write(f"{PWM0}/duty_cycle", "1400000")
    write(f"{PWM1}/duty_cycle", "1400000")
    return {"motors": "medium", "duty_cycle": 1400000}

@app.get("/fast")
def fast():
    """Set motors to fast speed"""
    write(f"{PWM0}/duty_cycle", "1600000")
    write(f"{PWM1}/duty_cycle", "1600000")
    return {"motors": "fast", "duty_cycle": 1600000}

@app.get("/max")
def max_speed():
    """Set motors to maximum speed"""
    write(f"{PWM0}/duty_cycle", "1800000")
    write(f"{PWM1}/duty_cycle", "1800000")
    return {"motors": "max", "duty_cycle": 1800000}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
