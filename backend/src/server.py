import multiprocessing
import subprocess

import uvicorn

from src.settings import settings

API_MODULE = "src.api.api:app"

def run_dev():
    uvicorn.run(API_MODULE, host="0.0.0.0", port=8000, reload=True)

def run_prod():
    workers = (multiprocessing.cpu_count() * 2) + 1
    cmd = [
        "gunicorn",
        API_MODULE,
        "-k", "uvicorn.workers.UvicornWorker",
        "--workers", str(workers),
        "--bind", "0.0.0.0:8000"
    ]
    subprocess.run(cmd)

if __name__ == "__main__":
    mode = settings.api_env.lower()
    print(f"Starting FastAPI in {mode} mode...")
    if mode == "prod":
        run_prod()
    else:
        run_dev()