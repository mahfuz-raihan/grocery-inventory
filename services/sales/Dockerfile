FROM python:3.12-slim

WORKDIR /app
COPY ./services/sales/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ./shared /app/shared
COPY ./services/sales/src /app/src

ENV PYTHONPATH=/app

CMD ["python", "-m", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]