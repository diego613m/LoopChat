# ==========================================
# STAGE 1: Builder (Install Meteor and compile the bundle)
# ==========================================
FROM node:22.22.3-bullseye AS builder

# Set Meteor superuser flag to allow running as root in Docker
ENV METEOR_ALLOW_SUPERUSER=1

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    python3 \
    ca-certificates \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Meteor globally
RUN curl https://install.meteor.com/ | sh

# Copy Deno binary (needed for builder stage during yarn build)
COPY --from=denoland/deno:bin-2.3.1 /deno /bin/deno

# Set up working directory
WORKDIR /app

# Enable corepack to use Yarn v4
RUN corepack enable

# Copy configuration files first for better caching
COPY package.json yarn.lock .yarnrc.yml turbo.json ./
COPY .yarn/ ./.yarn/

# Copy all source files
COPY . .

# Install dependencies (Yarn workspaces)
RUN yarn install

# Build all package workspaces via Turborepo
#
# ⚠️ El limite de memoria y la concurrencia no son cosmeticos: sin ellos el build
# se cae. Turborepo lanza tantos `tsc` como nucleos tenga la maquina, cada uno con
# su propio monton de memoria, y en un servidor modesto el kernel mata alguno a
# medias. El sintoma engaña: falla un paquete cualquiera —la primera vez fue
# `@rocket.chat/sha256`, que son seis ficheros diminutos— y parece un error de
# codigo. La pista de que es memoria es que el log termina en `Node.js v22.x`,
# que es el pie de un proceso MUERTO, no un `error TS...` de TypeScript.
ENV NODE_OPTIONS=--max-old-space-size=4096
RUN yarn build --concurrency=2

# Build the main Meteor application bundle
RUN cd apps/meteor && meteor build --server-only --directory /app/dist

# ==========================================
# STAGE 2: Runtime (Production image)
# ==========================================
FROM node:22.22.3-bullseye-slim

LABEL maintainer="buildmaster@rocket.chat"

# Set up system user and directory structure
RUN groupadd -g 65533 -r rocketchat \
    && useradd -u 65533 -r -g rocketchat rocketchat \
    && mkdir -p /app/uploads \
    && chown rocketchat:rocketchat /app/uploads \
    && apt-get update \
    && apt-get install -y --no-install-recommends fontconfig ca-certificates g++ make python3 \
    && rm -rf /var/lib/apt/lists/*

# Copy Deno binary from official image (needed for some integrations/script execution)
COPY --from=denoland/deno:bin-2.3.1 /deno /bin/deno

# Copy the compiled Meteor bundle from Stage 1
COPY --from=builder --chown=rocketchat:rocketchat /app/dist/bundle /app/bundle

# Configure runtime environment variables
ENV DEPLOY_METHOD=docker \
    NODE_ENV=production \
    MONGO_URL=mongodb://mongo:27017/rocketchat \
    HOME=/tmp \
    PORT=3000 \
    ROOT_URL=http://localhost:3000 \
    Accounts_AvatarStorePath=/app/uploads

USER rocketchat

# Install production npm dependencies inside the bundle
RUN cd /app/bundle/programs/server \
    && npm install --omit=dev \
    && npm cache clean --force

VOLUME /app/uploads

WORKDIR /app/bundle

EXPOSE 3000

CMD ["node", "main.js"]
