# Step 1: Specify the base image
FROM python:3.9-slim

# Step 2: Set the working directory in the container
WORKDIR /app

# Step 3: Copy the requirements file into the container
COPY requirements.txt .

# Step 4: Install the dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Step 5: Copy the rest of the application code
COPY . .

# Step 6: Expose the port the app will run on
EXPOSE 3000

# Step 7: Define the command to run the app
CMD ["python", "app.py"]