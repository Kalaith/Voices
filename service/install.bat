@echo off
echo Installing Voice Generator Service...
echo.

echo Step 1: Installing core dependencies...
pip install fastapi uvicorn python-multipart pydantic requests python-dotenv

echo.
echo Step 2: Installing numpy...
pip install numpy

echo.
echo Step 3: Installing audio processing libraries...
echo This may take a while...
pip install librosa soundfile

echo.
echo Step 4: Installing PyTorch...
echo Choose your installation based on your system:
echo For CPU only:
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu

echo.
echo Step 5: Installing ChatTTS...
pip install ChatTTS
if %errorlevel% neq 0 (
    echo PyPI installation failed, trying GitHub...
    pip install git+https://github.com/2noise/ChatTTS.git
)

echo.
echo Step 6: Creating directories...
if not exist "uploads" mkdir uploads

echo.
echo Installation complete!
echo To start the service: python main.py
pause