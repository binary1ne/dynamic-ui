# Controllers package

from flask_smorest import Api

from controllers.frontend.ui_controller import api as UIController
from controllers.authentication.auth_controller import api as AuthController
from controllers.app_controllers.agentic.agentic_controller import api as AgenticController 
from controllers.app_controllers.guardrails.guardrails_controller import api as GuardrailsController


def controllers_registers(api:Api):
    api.register_blueprint(AuthController)
    api.register_blueprint(UIController)
    api.register_blueprint(AgenticController)
    api.register_blueprint(GuardrailsController)



