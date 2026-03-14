const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

/**
 * Load JSON secrets from AWS Secrets Manager and merge into process.env.
 *
 * Requires:
 *   USE_AWS_SECRETS=true
 *   AWS_SECRETS_NAME=<secret-name>
 *   AWS_REGION (or default in environment)
 */
async function loadSecrets({ secretName, region } = {}) {
  if (process.env.USE_AWS_SECRETS !== 'true') return;

  secretName = secretName || process.env.AWS_SECRETS_NAME;
  if (!secretName) {
    console.warn('[secrets] USE_AWS_SECRETS=true but AWS_SECRETS_NAME is missing. Skipping.');
    return;
  }

  try {
    const client = new SecretsManagerClient({ region: region || process.env.AWS_REGION });
    const command = new GetSecretValueCommand({ SecretId: secretName });
    const response = await client.send(command);

    const secretString = response.SecretString;
    if (!secretString) {
      console.warn('[secrets] Secret fetched but empty.');
      return;
    }

    const secrets = JSON.parse(secretString);
    if (typeof secrets !== 'object' || secrets === null) {
      console.warn('[secrets] Secret is not a JSON object.');
      return;
    }

    Object.keys(secrets).forEach(key => {
      // Do not override explicit env vars
      if (process.env[key] === undefined) {
        process.env[key] = String(secrets[key]);
      }
    });

    console.log('[secrets] Loaded secrets from AWS Secrets Manager');
  } catch (err) {
    console.error('[secrets] Failed to load secrets:', err);
    throw err;
  }
}

module.exports = { loadSecrets };
