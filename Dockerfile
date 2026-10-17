FROM node:22-bookworm-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

# Public build values only. Credentials belong in Railway runtime variables.
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_YOUTUBE_VIDEO_ID=R5XbD1vjXlg
ARG NEXT_PUBLIC_R2_PUBLIC_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_YOUTUBE_VIDEO_ID=$NEXT_PUBLIC_YOUTUBE_VIDEO_ID \
    NEXT_PUBLIC_R2_PUBLIC_URL=$NEXT_PUBLIC_R2_PUBLIC_URL
RUN test -n "$NEXT_PUBLIC_SITE_URL" && npm run build && npm prune --omit=dev

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/.next ./.next
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/next.config.mjs ./next.config.mjs
USER node
CMD ["npm", "run", "start", "--", "--hostname", "0.0.0.0"]
