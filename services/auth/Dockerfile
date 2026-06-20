FROM python:3.12-slim

WORKDIR /app
COPY ./services/auth/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy shared core and service source code
COPY ./shared /app/shared
COPY ./services/auth/src /app/src

ENV PYTHONPATH=/app

CMD ["python", "-m", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]