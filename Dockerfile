# Base image
FROM python:3.9-slim

# Install git
RUN apt-get update && apt-get install -y git

# Clone the repository and set working directory
RUN git clone https://github.com/phillipyan300/GitInsight.git
WORKDIR /GitInsight/backend

# Install dependencies
RUN pip install --upgrade pip && \
    pip install google-generativeai==0.3.2 && \
    pip install -r requirements.txt

# Expose port
EXPOSE 8000

# Run the app
CMD ["python", "app.py"]