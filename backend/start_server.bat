@echo off
echo Starting PainAR Server...
cd /d "C:\Users\SSGSS\Documents\AR-diagass\backend"
call .venv\Scripts\activate.bat
echo Virtual environment activated
python -c "print('Python is working')"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
