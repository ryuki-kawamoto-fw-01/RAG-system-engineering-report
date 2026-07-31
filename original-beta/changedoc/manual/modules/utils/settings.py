import json
import logging

try:
    from azure.monitor.opentelemetry.exporter import (
        AzureMonitorLogExporter,
        AzureMonitorMetricExporter,
        AzureMonitorTraceExporter,
    )
    from opentelemetry._logs import set_logger_provider
    from opentelemetry.metrics import set_meter_provider
    from opentelemetry.sdk._logs import LoggerProvider, LoggingHandler
    from opentelemetry.sdk._logs.export import BatchLogRecordProcessor

    TELEMETRY_AVAILABLE = True
except ImportError as e:
    logging.warning(
        f"OpenTelemetry telemetry imports failed: {e}. Telemetry will be disabled."
    )
    TELEMETRY_AVAILABLE = False
if TELEMETRY_AVAILABLE:
    from opentelemetry.sdk.metrics import MeterProvider
    from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
    from opentelemetry.sdk.metrics.view import DropAggregation, View
    from opentelemetry.sdk.resources import Resource
    from opentelemetry.sdk.trace import TracerProvider
    from opentelemetry.sdk.trace.export import BatchSpanProcessor
    from opentelemetry.semconv.resource import ResourceAttributes
    from opentelemetry.trace import set_tracer_provider


def set_up_logging(connection_string, resource):
    """Sets up logging for the Semantic Kernel application."""
    if not TELEMETRY_AVAILABLE:
        logging.info("Telemetry not available, skipping logging setup")
        return
    exporter = AzureMonitorLogExporter(connection_string=connection_string)

    # Create and set a global logger provider for the application.
    logger_provider = LoggerProvider(resource=resource)
    # Log processors are initialized with an exporter which is responsible
    # for sending the telemetry data to a particular backend.
    logger_provider.add_log_record_processor(BatchLogRecordProcessor(exporter))
    # Sets the global default logger provider
    set_logger_provider(logger_provider)

    # Create a logging handler to write logging records, in OTLP format, to the exporter.
    handler = LoggingHandler()

    class _UnicodeJsonNormalizer(logging.Filter):
        """Normalize JSON log messages so Japanese (and other non-ASCII) characters are not escaped.

        Semantic Kernel telemetry sometimes emits JSON strings whose "content" field is itself a JSON-encoded
        string (double encoding) with default ensure_ascii=True, producing \\uXXXX sequences. This filter attempts
        to parse and re-dump those with ensure_ascii=False so they render properly both in console and Azure.
        If parsing fails, the original message is left untouched.
        """

        def filter(self, record: logging.LogRecord) -> bool:  # type: ignore[override]
            try:
                if not isinstance(record.msg, str):
                    return True
                msg_str = record.msg.strip()
                if not (msg_str.startswith("{") and msg_str.endswith("}")):
                    return True
                data = json.loads(msg_str)
                # Navigate into possible nested JSON in data["message"]["content"]
                inner_content = None
                if isinstance(data, dict):
                    message_block = data.get("message")
                    if isinstance(message_block, dict):
                        inner_content = message_block.get("content")
                if (
                    isinstance(inner_content, str)
                    and inner_content.startswith("{")
                    and "\\u" in inner_content
                ):
                    try:
                        inner_json = json.loads(inner_content)
                        # Re-serialize inner JSON with ensure_ascii=False
                        data["message"]["content"] = json.dumps(
                            inner_json, ensure_ascii=False
                        )
                        # Re-serialize outer JSON also with ensure_ascii=False
                        record.msg = json.dumps(data, ensure_ascii=False)
                    except json.JSONDecodeError:
                        # Ignore if inner_content is not valid JSON
                        pass
                else:
                    # Even if not double-encoded, ensure top-level unicode friendly if it was parsed.
                    record.msg = json.dumps(data, ensure_ascii=False)
            except Exception:
                # Fail silently; logging must not break application flow.
                pass
            return True

    # Attach unicode normalizer BEFORE semantic_kernel filter so that we always attempt normalization.
    handler.addFilter(_UnicodeJsonNormalizer())
    # Add filters to the handler to only process records from semantic_kernel.
    handler.addFilter(logging.Filter("semantic_kernel"))
    # Attach the handler to the root logger. `getLogger()` with no arguments returns the root logger.
    # Events from all child loggers will be processed by this handler.
    logger = logging.getLogger()
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)


def set_up_tracing(connection_string, resource):
    """Sets up tracing for the Semantic Kernel application."""
    if not TELEMETRY_AVAILABLE:
        logging.info("Telemetry not available, skipping tracing setup")
        return
    exporter = AzureMonitorTraceExporter(connection_string=connection_string)

    # Initialize a trace provider for the application. This is a factory for creating tracers.
    tracer_provider = TracerProvider(resource=resource)
    # Span processors are initialized with an exporter which is responsible
    # for sending the telemetry data to a particular backend.
    tracer_provider.add_span_processor(BatchSpanProcessor(exporter))
    # Sets the global default tracer provider
    set_tracer_provider(tracer_provider)


def set_up_metrics(connection_string, resource):
    """Sets up metrics for the Semantic Kernel application."""
    if not TELEMETRY_AVAILABLE:
        logging.info("Telemetry not available, skipping metrics setup")
        return
    exporter = AzureMonitorMetricExporter(connection_string=connection_string)

    # Initialize a metric provider for the application. This is a factory for creating meters.
    meter_provider = MeterProvider(
        metric_readers=[
            PeriodicExportingMetricReader(exporter, export_interval_millis=5000)
        ],
        resource=resource,
        views=[
            # Dropping all instrument names except for those starting with "semantic_kernel"
            View(instrument_name="*", aggregation=DropAggregation()),
            View(instrument_name="semantic_kernel*"),
        ],
    )
    # Sets the global default meter provider
    set_meter_provider(meter_provider)


def run_telemetry_setup(connection_string):
    """Sets up telemetry for the Semantic Kernel application."""
    if not TELEMETRY_AVAILABLE:
        logging.info("Telemetry not available, skipping telemetry setup")
        return
    resource = Resource.create(
        {ResourceAttributes.SERVICE_NAME: "telemetry-application-insights-quickstart"}
    )

    set_up_logging(connection_string=connection_string, resource=resource)
    set_up_tracing(connection_string=connection_string, resource=resource)
    set_up_metrics(connection_string=connection_string, resource=resource)
