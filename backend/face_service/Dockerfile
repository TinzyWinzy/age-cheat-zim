FROM python:3.10-slim

WORKDIR /app

# Install system dependencies for OpenCV/DeepFace
RUN apt-get update && apt-get install -y libgl1 libglib2.0-0 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --default-timeout=100 --no-cache-dir -r requirements.txt

COPY app.py ./

EXPOSE 5001
CMD ["gunicorn", "-b", "0.0.0.0:5001", "app:app"] 