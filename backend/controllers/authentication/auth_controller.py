from flask import request, jsonify
from flask.views import MethodView
from flask_smorest import Blueprint, abort
from flask_jwt_extended import jwt_required, get_jwt_identity

from services.auth_services.auth_service import AuthService
from dtos.auth_data.auth_data import (
    LoginSchema, SignupSchema, UserResponseSchema, CheckEmailSchema,
    AuthResponseSchema, CheckEmailResponseSchema, SignupConfigSchema,
    SwitchDomainSchema
)
from dtos.auth_data.otp_data import VerifyOtpSchema

# Create Blueprint
api = Blueprint(
    name='AuthController',
    import_name='AuthController',
    url_prefix='/api/auth',
    description='Authentication operations'
)


class AuthController:
    """Authentication Controller - Handles all authentication endpoints"""

    # ------------------------------------------------------------
    # PUBLIC: No JWT required
    # ------------------------------------------------------------

    @staticmethod
    @api.post('/check-access')
    @api.arguments(CheckEmailSchema)
    @api.response(200, CheckEmailResponseSchema)
    def api_post_check_access(data):
        """Check if email exists and get role"""
        try:
            result = AuthService.check_user_exists(data['email'])
            return result
        except Exception as e:
            abort(400, message=str(e))

    @staticmethod
    @api.route('/signup', methods=['POST'])
    @api.arguments(SignupSchema)
    @api.response(201, AuthResponseSchema)
    def api_post_signup(data):
        """User registration with domain assignment"""
        try:
            from models import SystemConfig, UserDetailsModel, DomainModel
            from models.system_models.template_models.component import ComponentModel
            from models.system_models.template_models.component_domain_mapping import ComponentDomainMappingModel
            
            config = SystemConfig.query.get('signup_enabled')

            # Check global signup config (legacy)
            if config and config.value.lower() != 'true':
                if UserDetailsModel.query.count() > 0:
                    abort(
                        403,
                        message="Public registration is currently disabled. Please contact an administrator."
                    )
            
            # Verify domain if provided
            domain_id = data.get('domain_id')
            if domain_id:
                domain = DomainModel.query.get(domain_id)
                if not domain:
                    abort(400, message="Invalid domain selected")
                
                # Check if domain has SIGNUP component assigned
                signup_component = ComponentModel.query.filter_by(name='SIGNUP').first()
                if not signup_component:
                    abort(500, message="SIGNUP component not configured")
                
                domain_has_signup = ComponentDomainMappingModel.query.filter_by(
                    component_id=signup_component.component_id,
                    domain_id=domain_id,
                    active_flag=True
                ).first()
                
                if not domain_has_signup:
                    abort(403, message="Signup is not enabled for this domain")
            
            # Register user
            result = AuthService.register_user(
                email=data['email'],
                password=data['password'],
                role=data.get('role', 'user'),
                full_name=data.get('full_name')
            )
            
            # If domain_id provided, assign user to domain
            if domain_id and 'user' in result:
                user_id = result['user'].get('user_id')
                if user_id:
                    from services.system_services.user_service import UserService
                    UserService.assign_user_to_domain(
                        user_id=user_id,
                        domain_id=domain_id,
                        role_name=data.get('role', 'user')
                    )
            
            return result
        except Exception as e:
            abort(400, message=str(e))

    @staticmethod
    @api.route('/login', methods=['POST'])
    @api.arguments(LoginSchema)
    @api.response(200, AuthResponseSchema)
    def api_post_login(data):
        """
        User login - Password verification step.
        Returns TEMP token for multi-step authentication flow:
            {
                "temp_token": "...",
                "requires_2fa": true/false,
                "domains": [{
                    "domain_id": id,
                    "domain_name": "name",
                    "domain_type": "type",
                    "available_roles": ["user", "admin"]
                }]
            }
        Frontend will handle domain/role selection and 2FA before getting final access token.
        """
        try:
            result = AuthService.login_user(
                email=data['email'],
                password=data['password']
            )
            return result
        except Exception as e:
            abort(401, message=str(e))

    @staticmethod
    @api.route('/complete-login', methods=['POST'])
    @jwt_required()
    @api.arguments(VerifyOtpSchema)
    @api.response(200, AuthResponseSchema)
    def api_post_complete_login(data):
        """
        Complete login with domain/role selection and OTP verification (if 2FA enabled).
        Exchanges TEMP token for final ACCESS token.
        Requires:
            - email
            - otp (if 2FA enabled, otherwise can be empty)
            - domain_id (required)
            - active_role (required)
        """
        try:
            result = AuthService.complete_login_with_domain_and_otp(
                email=data['email'],
                otp=data.get('otp', ''),
                domain_id=data['domain_id'],
                active_role=data['active_role']
            )
            return result
        except Exception as e:
            abort(401, message=str(e))

    # ------------------------------------------------------------
    # PROTECTED: JWT required
    # ------------------------------------------------------------

    @staticmethod
    @api.route('/switch-domain', methods=['POST'])
    @api.arguments(SwitchDomainSchema)
    @api.response(200, AuthResponseSchema)
    @jwt_required()
    def api_post_switch_domain(data):
        """
        Switch active domain

        Must generate NEW ACCESS TOKEN with updated:
        - domain_id
        - active_role
        """
        try:
            user_id = get_jwt_identity()
            result = AuthService.switch_domain(
                user_id=user_id,
                domain_id=data['domain_id'],
                active_role=data.get('active_role')
            )
            return result
        except Exception as e:
            abort(401, message=str(e))

    # @staticmethod
    # @api.route('/me', methods=['GET'])
    # @api.response(200, UserResponseSchema)
    # @jwt_required()
    # def api_get_me():
    #     """Get current authenticated user"""
    #     try:
    #         user = AuthService.get_current_user()
    #         return user
    #     except Exception as e:
    #         abort(500, message=str(e))

    # ------------------------------------------------------------
    # SIGNUP CONFIGURATION
    # ------------------------------------------------------------

    @staticmethod
    @api.route('/config/signup', methods=['GET'])
    @api.response(200, SignupConfigSchema)
    def api_get_signup_config():
        """Get signup configuration"""
        try:
            from models import SystemConfig
            config = SystemConfig.query.get('signup_enabled')
            return {'enabled': config.value.lower() == 'true' if config else True}
        except Exception as e:
            abort(500, message=str(e))

    @staticmethod
    @api.route('/config/signup', methods=['POST'])
    @api.arguments(SignupConfigSchema)
    @api.response(200, SignupConfigSchema)
    @jwt_required()
    def api_post_signup_config(data):
        """Update signup configuration (Admin only)"""
        try:
            user = AuthService.get_current_user()
            if not user.is_admin():
                abort(403, message="Admin access required")

            enabled = data.get('enabled', True)

            from models import SystemConfig, db
            config = SystemConfig.query.get('signup_enabled')
            if not config:
                config = SystemConfig(
                    key='signup_enabled',
                    description='Enable or disable public user registration'
                )
                db.session.add(config)

            config.value = str(enabled).lower()
            db.session.commit()

            return {'enabled': config.value == 'true', 'message': 'Configuration updated'}

        except Exception as e:
            abort(500, message=str(e))
