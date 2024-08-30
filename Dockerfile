FROM node:22-alpine

# Install PM2 globally
RUN npm install pm2 -g
# Install tmux
RUN apk add --no-cache tmux

# Install git
RUN apk add --no-cache git

# Expose the port the app runs on
EXPOSE 3000

# Set the working directory to /app
WORKDIR /app

# Start the app using PM2
CMD ["pm2-runtime", "start", "npm", "--", "run", "dev"]