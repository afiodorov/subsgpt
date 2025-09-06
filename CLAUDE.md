# SubsGPT Deployment Guide

## Build and Deploy

### 1. Build the application
```bash
npm run build
```

### 2. Sync to S3
```bash
aws s3 sync build/ s3://subsgpt --delete
```

### 3. Invalidate CloudFront cache
```bash
aws cloudfront create-invalidation --distribution-id E201ASTSXFTXW2 --paths "/*"
```

## Complete deployment script
You can run all steps with:
```bash
npm run build && \
aws s3 sync build/ s3://subsgpt --delete && \
aws cloudfront create-invalidation --distribution-id E201ASTSXFTXW2 --paths "/*"
```

## Development

### Running locally
```bash
npm start
```

### Running tests
```bash
npm test
```

### Type checking
```bash
npm run typecheck
```

### Linting
```bash
npm run lint
```