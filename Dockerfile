# Build stage
FROM node:20-slim AS build

ARG GEMINI_API_KEY
ENV GEMINI_API_KEY=$GEMINI_API_KEY

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:stable-alpine

# Copy the build output from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Add nginx configuration to handle SPA routing and dynamic PORT
RUN printf "server {\n\
    listen 8080;\n\
    location / {\n\
        root /usr/share/nginx/html;\n\
        index index.html index.htm;\n\
        try_files \$uri \$uri/ /index.html;\n\
    }\n\
}\n" > /etc/nginx/conf.d/default.conf

# Use a shell script to replace the port at runtime and start nginx
CMD ["/bin/sh", "-c", "sed -i \"s/listen 8080;/listen ${PORT:-8080};/g\" /etc/nginx/conf.d/default.conf && exec nginx -g 'daemon off;'"]
