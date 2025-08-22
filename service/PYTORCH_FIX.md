# PyTorch Installation Fix for Windows

## Problem
You're seeing this error:
```
OSError: [WinError 126] The specified module could not be found. Error loading "torch_python.dll"
```

This is a common PyTorch installation issue on Windows where required DLL dependencies are missing.

## Solutions

### Solution 1: Reinstall PyTorch (Recommended)
```bash
# Uninstall current PyTorch
pip uninstall torch torchaudio

# Install CPU-only version (most compatible)
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu

# Or for CUDA (if you have NVIDIA GPU)
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu118
```

### Solution 2: Install Visual C++ Redistributables
Download and install:
- **Microsoft Visual C++ 2019 Redistributable** (x64)
- Available from: https://aka.ms/vs/16/release/vc_redist.x64.exe

### Solution 3: Use Conda (Alternative)
```bash
# Install Anaconda/Miniconda, then:
conda install pytorch torchvision torchaudio cpuonly -c pytorch
```

## Verification

After installation, test PyTorch:
```python
python -c "import torch; print(torch.__version__)"
```

If successful, restart the service:
```bash
python main.py
```

If PyTorch still fails to import, the service will not start. Fix the PyTorch installation first.