# Base image
FROM python:3.9-slim

# Install git, Chrome, and required dependencies
RUN apt-get update && apt-get install -y \
    git \
    wget \
    gnupg2 \
    apt-transport-https \
    ca-certificates \
    chromium \
    chromium-driver

# Clone the repository and set working directory
RUN git clone https://github.com/phillipyan300/GitInsight.git
WORKDIR /GitInsight/backend

# Install dependencies
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Set Chrome options for running in Docker
ENV CHROME_BIN=/usr/bin/chromium
ENV CHROMEDRIVER_PATH=/usr/bin/chromedriver
ENV PYTHONPATH=/GitInsight/backend

# Expose port
EXPOSE 8000

# Run the app
CMD ["python", "app.py"]