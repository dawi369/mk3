# Use the official Bun image
FROM oven/bun:1 as base
WORKDIR /app

# Install dependencies into temp folder
# This will cache them and speed up future builds
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# Install with --production (exclude devDependencies)
RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# Copy node_modules from temp directory
# Then copy all (non-ignored) project files into the image
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# Build the app
ENV NODE_ENV=production
RUN bun run build

# Release image
FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /app/.next .next
COPY --from=prerelease /app/public public
COPY --from=prerelease /app/package.json .

# Run the app
USER bun
EXPOSE 3000/tcp
# Run the app directly to allow PORT injection
ENTRYPOINT [ "bun", "run", "next", "start" ]
