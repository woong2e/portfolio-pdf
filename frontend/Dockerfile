# Build stage
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

# Set build arguments for React Environment variables
ARG VITE_API_BASE_URL=/api
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets
COPY --from=build /app/dist /app/dist

# Copy Custom Nginx Config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
