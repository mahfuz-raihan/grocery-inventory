FROM python:3.12-slim

WORKDIR /app

# Install dependencies
COPY ./services/inventory/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy shared core and service source code
# Since we are in a monorepo, the Docker build context will be the project root
COPY ./shared /app/shared
COPY ./services/inventory/src /app/src

# Set PYTHONPATH so Python can find the shared module
ENV PYTHONPATH=/app

# Start the FastAPI application via the python module (-m)
CMD ["python", "-m", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]