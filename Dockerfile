# Base image
FROM python:3.9-slim

# Install git
RUN apt-get update && apt-get install -y git

# Clone the repository and set working directory
RUN git clone https://github.com/phillipyan300/GitInsight.git /app
WORKDIR /app/backend

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose port
EXPOSE 3000

# Run the app
CMD ["python", "app.py"]