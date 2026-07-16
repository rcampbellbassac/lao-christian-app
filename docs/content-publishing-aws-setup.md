# AWS + GitHub Setup for Content Publishing

This guide configures secure publishing for this repository:
- repo: `rcampbellbassac/lao-christian-app`
- workflow: `.github/workflows/publish-content.yml`
- auth model: GitHub OIDC -> AWS IAM role (no long-lived AWS keys in GitHub)

## 1. One-time AWS prerequisites

### 1.1 Set local variables in your shell

```sh
export AWS_REGION=us-west-2
export AWS_ACCOUNT_ID="<your-account-id>"
export S3_BUCKET="laoadventist-media"
# Use empty string for root of bucket, or e.g. content/
export S3_PREFIX=""
export ROLE_NAME="github-content-publisher"
export POLICY_NAME="github-content-publisher-policy"
```

### 1.2 Enable bucket versioning (retains old content versions)

```sh
aws s3api put-bucket-versioning \
  --region "$AWS_REGION" \
  --bucket "$S3_BUCKET" \
  --versioning-configuration Status=Enabled
```

### 1.3 Ensure GitHub OIDC provider exists in IAM

```sh
aws iam get-open-id-connect-provider \
  --open-id-connect-provider-arn "arn:aws:iam::$AWS_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
```

If this command fails, create the provider (run once per account):

```sh
aws iam create-open-id-connect-provider \
  --url "https://token.actions.githubusercontent.com" \
  --client-id-list "sts.amazonaws.com" \
  --thumbprint-list "6938fd4d98bab03faadb97b34396831e3780aea1"
```

## 2. Create IAM role + policy for this repo

### 2.1 Prepare trust policy

Open `scripts/aws/trust-policy.github-oidc.json` and replace:
- `<AWS_ACCOUNT_ID>`

Then create role:

```sh
aws iam create-role \
  --role-name "$ROLE_NAME" \
  --assume-role-policy-document "file://scripts/aws/trust-policy.github-oidc.json"
```

If role already exists, update trust policy:

```sh
aws iam update-assume-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-document "file://scripts/aws/trust-policy.github-oidc.json"
```

### 2.2 Prepare permission policy

Open `scripts/aws/policy.content-publisher.json` and replace:
- `<S3_BUCKET_NAME>` with your bucket (example: `laoadventist-media`)
- `<S3_PREFIX>` with your prefix (empty for bucket root)

The publisher role needs read access to the source objects because the GitHub Actions workflow copies the latest JSON from S3 before building and publishing the release.

Examples:
- empty prefix -> `arn:aws:s3:::laoadventist-media/*`
- prefix `content/` -> `arn:aws:s3:::laoadventist-media/content/*`

Create policy:

```sh
aws iam create-policy \
  --policy-name "$POLICY_NAME" \
  --policy-document "file://scripts/aws/policy.content-publisher.json"
```

If policy already exists, create a new policy version and set default:

```sh
export POLICY_ARN="arn:aws:iam::$AWS_ACCOUNT_ID:policy/$POLICY_NAME"
aws iam create-policy-version \
  --policy-arn "$POLICY_ARN" \
  --policy-document "file://scripts/aws/policy.content-publisher.json" \
  --set-as-default
```

Attach policy to role:

```sh
aws iam attach-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-arn "arn:aws:iam::$AWS_ACCOUNT_ID:policy/$POLICY_NAME"
```

Get role ARN for GitHub secret:

```sh
aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text
```

## 3. Configure GitHub repository settings

Repository: `https://github.com/rcampbellbassac/lao-christian-app`

### 3.1 GitHub Environment

Create environment named `production` in repository settings.

### 3.2 Add environment/repository secret

- `AWS_ROLE_ARN` = output from previous step

### 3.3 Add environment/repository variables

Required:
- `CONTENT_S3_BUCKET` = your bucket name (example `laoadventist-media`)

Recommended:
- `AWS_REGION` = `us-west-2`
- `CONTENT_BASE_URL` = `https://laoadventist-media.s3.us-west-2.amazonaws.com`
- `CONTENT_S3_PREFIX` = optional path prefix (empty for root)

## 4. Configure app runtime for remote manifest

Set app runtime env:

- `VITE_REMOTE_INDEX_URL=https://laoadventist-media.s3.us-west-2.amazonaws.com/index.json`
- `VITE_PREFER_GZIP=true`

If this app is deployed with GitHub Pages workflow, ensure these values are present in the deploy pipeline or build environment.

## 5. Publish content

### 5.1 Local dry run (build artifacts only)

```sh
npm ci
npm run normalize:data
npm run content:release
ls -lah dist/content-release
```

### 5.2 Local publish (optional operator path)

```sh
AWS_REGION=us-west-2 \
S3_BUCKET=laoadventist-media \
S3_PREFIX="" \
npm run content:publish
```

### 5.3 GitHub Actions publish (recommended)

Run workflow:
- Actions -> `Publish Content to S3` -> `Run workflow`

Or push changes to data/scripts paths watched by `.github/workflows/publish-content.yml`.

## 6. Verify end-to-end

### 6.1 Verify S3 metadata headers

```sh
curl -I "https://laoadventist-media.s3.us-west-2.amazonaws.com/index.json"
curl -I "https://laoadventist-media.s3.us-west-2.amazonaws.com/LaoBible.json.gz"
```

Expected:
- `.json.gz` should include `Content-Encoding: gzip`
- `ETag` and `Last-Modified` should be present

### 6.2 Verify app update prompt

1. Open a content set in app.
2. Publish a new release (new `version` in remote index).
3. Re-open same set and wait for check interval or reload.
4. Confirm "New content is available" prompt appears.
5. Click "Update now" and verify content refresh timestamp updates.

## 7. Rollback using S3 object versions

List versions for a key:

```sh
aws s3api list-object-versions \
  --bucket "$S3_BUCKET" \
  --prefix "LaoBible.json"
```

Restore older version by copying specific version ID over current key:

```sh
aws s3api copy-object \
  --bucket "$S3_BUCKET" \
  --copy-source "$S3_BUCKET/LaoBible.json?versionId=<OLD_VERSION_ID>" \
  --key "LaoBible.json" \
  --metadata-directive COPY
```

Repeat for `index.json` and any other content keys in the same release.

## Troubleshooting

- AccessDenied on GitHub workflow assume-role:
  - Check trust policy `sub` matches repo and branch/environment exactly.
  - The publish job uses `environment: production`, so the OIDC `sub` claim is
    `repo:rcampbellbassac/lao-christian-app:environment:production` (not a ref-based claim).
    Ensure this value is present in the trust policy `StringLike` condition.
  - After updating `trust-policy.github-oidc.json`, apply it with:
    ```sh
    aws iam update-assume-role-policy \
      --role-name "$ROLE_NAME" \
      --policy-document "file://scripts/aws/trust-policy.github-oidc.json"
    ```
  - Confirm secret `AWS_ROLE_ARN` points to correct account/role.
- AccessDenied on S3 upload:
  - Check policy resource uses correct bucket and prefix.
  - Check bucket policy is not denying role principal.
- App does not show update prompt:
  - Ensure remote `index.json` contains changed `version` or `published_at`.
  - Ensure app build has `VITE_REMOTE_INDEX_URL` set.
