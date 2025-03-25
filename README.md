# How to install backend

cd backend
pip install -r requirements.txt

**If you use device = "mps" (for Mac) - it's OK,** 
**but if you will run on Linux/Windows с NVIDIA GPU, replace device = "cuda".**

**If you use venv don't forget to do source venv/bin/activate, else skip it**

## Run the FastAPI server
uvicorn main:app --host 0.0.0.0 --port 8000 

**Go to http://localhost:8000**

# How to install frontend

cd frontend
npm install
npm run dev

**Go to http://localhost:5173**

--------------------------------------------------------------------------------
# How to use

1. Choose file (jpg), that you want to apply new interior design.
2. Put prompt. This is should be the proffessional prompt.
3. Create design.  
