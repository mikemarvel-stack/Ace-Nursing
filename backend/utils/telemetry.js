const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');

let sdk;

function initTelemetry() {
  if (process.env.OTEL_ENABLED !== 'true') {
    return;
  }

  const exporter = new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
    headers: process.env.OTEL_EXPORTER_OTLP_HEADERS
      ? Object.fromEntries(
          process.env.OTEL_EXPORTER_OTLP_HEADERS.split(',').map(pair => {
            const [k, v] = pair.split('=');
            return [k.trim(), v.trim()];
          }),
        )
      : undefined,
  });

  sdk = new NodeSDK({
    traceExporter: exporter,
    instrumentations: [getNodeAutoInstrumentations()],
  });

  sdk.start().catch(err => {
    // Do not block startup if tracing is misconfigured.
    // This is intentionally logged as console output, as logger may not be ready yet.
    // eslint-disable-next-line no-console
    console.error('[otel] Failed to start OpenTelemetry SDK:', err);
  });
}

async function shutdownTelemetry() {
  if (!sdk) return;
  await sdk.shutdown();
}

module.exports = { initTelemetry, shutdownTelemetry };
