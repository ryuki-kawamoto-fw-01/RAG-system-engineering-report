import azure.functions as func

from blueprints.durable_deep_research import durable_deep_research_bp

app = func.FunctionApp(http_auth_level=func.AuthLevel.FUNCTION)

app.register_blueprint(durable_deep_research_bp)
