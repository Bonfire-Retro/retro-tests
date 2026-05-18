FROM mcr.microsoft.com/playwright:v1.60.0-noble
WORKDIR /tests
COPY package.json package-lock.json ./
RUN npm ci
COPY playwright.config.ts tsconfig.json .env ./
COPY tests/ tests/
ENTRYPOINT ["npx", "playwright", "test"]
