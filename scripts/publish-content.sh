#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RELEASE_DIR="${CONTENT_RELEASE_DIR:-$ROOT_DIR/dist/content-release}"
AWS_REGION="${AWS_REGION:-us-west-2}"
S3_BUCKET="${S3_BUCKET:-}"
S3_PREFIX="${S3_PREFIX:-}"

if [[ -z "$S3_BUCKET" ]]; then
  echo "S3_BUCKET is required"
  exit 1
fi

if [[ ! -d "$RELEASE_DIR" ]]; then
  echo "Release directory not found: $RELEASE_DIR"
  echo "Run: npm run content:release"
  exit 1
fi

prefix_trimmed="${S3_PREFIX#/}"
if [[ -n "$prefix_trimmed" && "$prefix_trimmed" != */ ]]; then
  prefix_trimmed="${prefix_trimmed}/"
fi

echo "Publishing content from $RELEASE_DIR to s3://$S3_BUCKET/$prefix_trimmed"

for file in "$RELEASE_DIR"/*.json; do
  name="$(basename "$file")"
  key="${prefix_trimmed}${name}"
  if [[ "$name" == "index.json" ]]; then
    aws s3 cp "$file" "s3://$S3_BUCKET/$key" \
      --region "$AWS_REGION" \
      --content-type "application/json" \
      --cache-control "public, max-age=300, must-revalidate"
  else
    aws s3 cp "$file" "s3://$S3_BUCKET/$key" \
      --region "$AWS_REGION" \
      --content-type "application/json" \
      --cache-control "public, max-age=3600, must-revalidate"
  fi
  echo "Uploaded $key"
done

for file in "$RELEASE_DIR"/*.json.gz; do
  name="$(basename "$file")"
  key="${prefix_trimmed}${name}"
  aws s3 cp "$file" "s3://$S3_BUCKET/$key" \
    --region "$AWS_REGION" \
    --content-type "application/json" \
    --content-encoding "gzip" \
    --cache-control "public, max-age=3600, must-revalidate"
  echo "Uploaded $key"
done

echo "Publish complete. Ensure bucket versioning is enabled for retention and rollback."
