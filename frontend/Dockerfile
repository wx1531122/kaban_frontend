# Stage 1: Build the React application
FROM node:18-alpine AS build-stage

WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./
# COPY yarn.lock ./ # Uncomment if using yarn

# Install dependencies
RUN npm install --registry=https://registry.npmmirror.com
# RUN yarn install # Uncomment if using yarn

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build
# RUN yarn build # Uncomment if using yarn

# Stage 2: Serve the application with Nginx
FROM nginx:1.25-alpine AS serve-stage

# Copy the build output from the build stage
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Copy the Nginx configuration file
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
