"""
Guardrails Controller - Guardrail configuration and logging
"""
from flask_smorest import Blueprint
from flask_jwt_extended import jwt_required
from marshmallow import ValidationError

from services.guardrails_services.guardrails_service import GuardrailsService
from services.auth_services.auth_service import AuthService
from dtos.app_data.guardrails_dto import (
    GuardrailConfigSchema, UpdateGuardrailSchema, CreateGuardrailSchema, GuardrailLogSchema
)

# Create Blueprint
api = Blueprint(
    name='GuardrailsController', 
    import_name='GuardrailsController', 
    url_prefix='/api/guardrails', 
    description='Guardrails domain operations (RAG & Chat)')

class GuardrailsController:
    """Guardrails Controller - Manages guardrail configuration and logs"""
    
    @staticmethod
    @api.route('/config', methods=['GET'])
    @api.response(200, GuardrailConfigSchema(many=True))
    @jwt_required()
    def api_get_guardrail_config():
        """Get guardrails configuration"""
        try:
            config = GuardrailsService.get_guardrails_config()
            return config
        except Exception as e:
            api.abort(500, message=str(e))
    
    @staticmethod
    @api.route('/config', methods=['POST'])
    @api.arguments(CreateGuardrailSchema)
    @api.response(201, GuardrailConfigSchema)
    @jwt_required()
    def api_post_guardrail_config(data):
        """Create new guardrail rule (admin only)"""
        try:
            AuthService.verify_admin()
            rule = GuardrailsService.create_guardrail(**data)
            return rule
        except ValidationError as err:
            api.abort(400, message=str(err.messages))
        except ValueError as e:
            api.abort(400, message=str(e))
        except Exception as e:
            api.abort(500, message=str(e))
    
    @staticmethod
    @api.route('/config/<int:rule_id>', methods=['PUT'])
    @api.arguments(UpdateGuardrailSchema)
    @api.response(200, GuardrailConfigSchema)
    @jwt_required()
    def api_put_guardrail_config(data, rule_id):
        """Update guardrail configuration (admin only)"""
        try:
            AuthService.verify_admin()
            rule = GuardrailsService.update_guardrail(rule_id, **data)
            return rule
        except ValidationError as err:
            guardrails.abort(400, message=str(err.messages))
        except ValueError as e:
            api.abort(400, message=str(e))
        except Exception as e:
            api.abort(500, message=str(e))
    
    @staticmethod
    @api.route('/config/<int:rule_id>', methods=['DELETE'])
    @api.response(200, description="Rule deleted")
    @jwt_required()
    def api_delete_guardrail_config(rule_id):
        """Delete guardrail rule (admin only)"""
        try:
            AuthService.verify_admin()
            result = GuardrailsService.delete_guardrail(rule_id)
            return result
        except ValueError as e:
            api.abort(400, message=str(e))
        except Exception as e:
            api.abort(500, message=str(e))
    
    @staticmethod
    @api.route('/logs', methods=['GET'])
    @api.response(200, GuardrailLogSchema(many=True))
    @jwt_required()
    def api_get_guardrails_logs():
        """Get guardrails detection logs (admin only)"""
        try:
            AuthService.verify_admin()
            logs = GuardrailsService.get_guardrails_logs(limit=100)
            return logs
        except ValueError as e:
            api.abort(403, message=str(e))
        except Exception as e:
            api.abort(500, message=str(e))
