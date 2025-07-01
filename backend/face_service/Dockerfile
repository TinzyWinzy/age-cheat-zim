FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt ./
RUN pip install --default-timeout=100 --no-cache-dir -r requirements.txt

COPY app.py ./

EXPOSE 5001

CMD ["python", "app.py"] 