"""
Frontend UI Controller - User, Role, Component, Domain Management
Consolidated from user_controller, role_controller, component_controller, domain_controller
"""
from flask import request, jsonify
from flask_smorest import Blueprint, abort
from flask_jwt_extended import jwt_required, get_jwt
from marshmallow import ValidationError

from models import db, RoleModel
from services.system_services.user_service import UserService
from services.auth_services.auth_service import AuthService
from services.ui_services.component_service import ComponentService
from services.system_services.domain_service import DomainService

from dtos.ui_data.user_dto import UserSchema, CreateUserSchema, UpdateUserSchema
from dtos.role_dto import RoleSchema, RoleCreateSchema, RoleUpdateSchema, AssignRolesSchema
from dtos.ui_data.component_dto import (
    ComponentsListSchema, AssignComponentSchema, ComponentAccessSchema,
    ComponentListResponseSchema, NavigationResponseSchema
)
from dtos.system_data.domain_dto import DomainSchema, CreateDomainSchema, UpdateDomainSchema

# Create Blueprint
api = Blueprint(
    name='UIController', 
    import_name='UIController', 
    url_prefix='/api/ui', 
    description='Frontend management operations')


class UIController:
    """Frontend UI Controller - Manages Users, Roles, Components, and Domains"""
    
    # ============================================================================
    # USER MANAGEMENT
    # ============================================================================
    
    @staticmethod
    @api.route('/users', methods=['GET'])
    @api.response(200, UserSchema(many=True))
    @jwt_required()
    def api_get_users():
        """List all users (admin only)"""
        try:
            AuthService.verify_admin()
            users = UserService.get_all_users()
            return users
        except ValueError as e:
            abort(403, message=str(e))
        except Exception as e:
            abort(500, message=str(e))
    
    @staticmethod
    @api.route('/users', methods=['POST'])
    @api.arguments(CreateUserSchema)
    @api.response(201, UserSchema)
    @jwt_required()
    def api_post_user(data):
        """Create new user (Admin only)"""
        try:
            # Determine domain_id
            # If Platform Admin, can specify any domain_id (or None for global?)
            # If Domain Admin, must be their domain.
            
            current_user = AuthService.get_current_user()
            domain_id = data.get('domain_id')
            
            if current_user.has_role('platform_admin'):
                # Platform admin can create users anywhere. 
                # If domain_id is None, maybe creating a platform admin?
                pass
            else:
                # Domain Admin
                # Must infer domain_id if not provided, or validate it
                # Find the domain this admin manages
                admin_domains = [m.domain_id for m in current_user.user_roles if m.active_flag and m.role.role_name == 'admin']
                if not admin_domains:
                    abort(403, message="Not an admin of any domain")
                
                if domain_id:
                    if domain_id not in admin_domains:
                        abort(403, message="Cannot create user in this domain")
                else:
                    if len(admin_domains) == 1:
                        domain_id = admin_domains[0]
                    else:
                        abort(400, message="Domain ID required (you manage multiple domains)")

            roles_to_assign = data.get('roles') or [data.get('role', 'user')]
            
            # Use UserService.create_user which enforces domain access (redundant check but safe)
            # But UserService.create_user requires domain_id. 
            # If domain_id is None (Platform Admin creating global user?), we might need to handle that.
            # For now, let's assume users must belong to a domain unless they are Platform Admins.
            
            if not domain_id and not current_user.has_role('platform_admin'):
                 abort(400, message="Domain ID required")

            if domain_id:
                user = UserService.create_user(
                    email=data['email'],
                    password=data['password'],
                    role_name=roles_to_assign[0], # simplified for now
                    domain_id=domain_id,
                    full_name=data.get('full_name')
                )
            else:
                # Platform Admin creating global user (e.g. another platform admin)
                # Fallback to AuthService.create_user (which is actually register_user)
                # But we need to be careful.
                AuthService.verify_platform_admin()
                user = AuthService.create_user(
                    email=data['email'],
                    password=data['password'],
                    roles=roles_to_assign,
                    full_name=data.get('full_name'),
                    file_upload_enabled=data.get('file_upload_enabled', False),
                    two_factor_auth_enabled=data.get('two_factor_auth_enabled', False)
                )

            return user
        except ValidationError as err:
            abort(400, message=str(err.messages))
        except ValueError as e:
            abort(400, message=str(e))
        except Exception as e:
            abort(500, message=str(e))
    
    @staticmethod
    @api.route('/users/<int:user_id>', methods=['GET'])
    @api.response(200, UserSchema)
    @jwt_required()
    def api_get_user(user_id):
        """Get user by ID (admin only)"""
        try:
            AuthService.verify_admin()
            user = UserService.get_user_by_id(user_id)
            return user
        except ValueError as e:
            abort(404, message=str(e))
        except Exception as e:
            abort(500, message=str(e))
    
    @staticmethod
    @api.route('/users/<int:user_id>', methods=['PUT'])
    @api.arguments(UpdateUserSchema)
    @api.response(200, UserSchema)
    @jwt_required()
    def api_put_user(data, user_id):
        """Update user details (admin only)"""
        try:
            AuthService.verify_admin()
            user = UserService.update_user(user_id, data)
            return user
        except ValidationError as err:
            abort(400, message=str(err.messages))
        except ValueError as e:
            abort(400, message=str(e))
        except Exception as e:
            abort(500, message=str(e))
    
    @staticmethod
    @api.route('/users/<int:user_id>', methods=['DELETE'])
    @api.response(200, description="User deleted")
    @jwt_required()
    def api_delete_user(user_id):
        """Delete user (admin only)"""
        try:
            AuthService.verify_admin()
            result = UserService.delete_user(user_id)
            return result
        except ValueError as e:
            abort(400, message=str(e))
        except Exception as e:
            abort(500, message=str(e))
    
    # ============================================================================
    # ROLE MANAGEMENT
    # ============================================================================
    
    @staticmethod
    @api.route('/roles', methods=['GET'])
    @api.response(200, RoleSchema(many=True))
    @jwt_required()
    def api_get_roles():
        """Get all roles"""
        try:
            roles = RoleModel.query.all()
            return roles
        except Exception as e:
            abort(500, message=str(e))
    
    @staticmethod
    @api.route('/roles', methods=['POST'])
    @api.arguments(RoleCreateSchema)
    @api.response(201, RoleSchema)
    @jwt_required()
    def api_post_role(data):
        """Create a new role (Admin only)"""
        try:
            user = AuthService.get_current_user()
            if not user.is_admin():
                abort(403, message="Admin access required")
            
            if RoleModel.query.filter_by(role_name=data['name']).first():
                abort(400, message=f"Role '{data['name']}' already exists")
            
            role = RoleModel(
                role_name=data['name'],
                description=data.get('description')
            )
            db.session.add(role)
            db.session.commit()
            
            return role
        except ValidationError as err:
            abort(400, message=str(err.messages))
        except ValueError as e:
            abort(400, message=str(e))
        except Exception as e:
            abort(500, message=str(e))
    
    @staticmethod
    @api.route('/roles/<int:role_id>', methods=['GET'])
    @api.response(200, RoleSchema)
    @jwt_required()
    def api_get_role(role_id):
        """Get a specific role"""
        try:
            role = RoleModel.query.get(role_id)
            if not role:
                abort(404, message="Role not found")
            return role
        except Exception as e:
            abort(500, message=str(e))
    
    @staticmethod
    @api.route('/roles/<int:role_id>', methods=['PUT'])
    @api.arguments(RoleUpdateSchema)
    @api.response(200, RoleSchema)
    @jwt_required()
    def api_put_role(data, role_id):
        """Update a role (Admin only)"""
        try:
            user = AuthService.get_current_user()
            if not user.is_admin():
                abort(403, message="Admin access required")
            
            role = RoleModel.query.get(role_id)
            if not role:
                abort(404, message="Role not found")
            
            if role.role_name in ['admin', 'user']:
                abort(400, message="Cannot modify default system roles")
            
            if 'name' in data:
                existing = RoleModel.query.filter_by(role_name=data['name']).first()
                if existing and existing.role_id != role_id:
                    abort(400, message=f"Role '{data['name']}' already exists")
                role.role_name = data['name']
            
            if 'description' in data:
                role.description = data['description']
            
            db.session.commit()
            return role
        except ValidationError as err:
            abort(400, message=str(err.messages))
        except ValueError as e:
            abort(400, message=str(e))
        except Exception as e:
            abort(500, message=str(e))
    
    @staticmethod
    @api.route('/roles/<int:role_id>', methods=['DELETE'])
    @api.response(200, description="Role deleted")
    @jwt_required()
    def api_delete_role(role_id):
        """Delete a role (Admin only)"""
        try:
            user = AuthService.get_current_user()
            if not user.is_admin():
                abort(403, message="Admin access required")
            
            role = RoleModel.query.get(role_id)
            if not role:
                abort(404, message="Role not found")
            
            if role.role_name in ['admin', 'user']:
                abort(400, message="Cannot delete default system roles")
            
            db.session.delete(role)
            db.session.commit()
            
            return {'message': f"Role '{role.role_name}' deleted successfully"}
        except ValueError as e:
            abort(400, message=str(e))
        except Exception as e:
            abort(500, message=str(e))
    
    @staticmethod
    @api.route('/roles/assign', methods=['POST'])
    @api.arguments(AssignRolesSchema)
    @api.response(200, description="Roles assigned")
    @jwt_required()
    def api_post_assign_roles(data):
        """Assign roles to a user (Admin only)"""
        try:
            user = AuthService.get_current_user()
            if not user.is_admin():
                abort(403, message="Admin access required")
            
            AuthService.assign_roles(
                user_id=data['user_id'],
                role_names=data['role_names']
            )
            
            return {'message': 'Roles assigned successfully'}
        except ValidationError as err:
            abort(400, message=str(err.messages))
        except ValueError as e:
            abort(400, message=str(e))
        except Exception as e:
            abort(500, message=str(e))
    
    # ============================================================================
    # COMPONENT MANAGEMENT
    # ============================================================================
    
    @staticmethod
    @api.route('/components', methods=['GET'])
    @jwt_required()
    def api_get_components():
        """Get available components"""
        try:
            components = ComponentService.get_available_components()
            return components
        except Exception as e:
            abort(500, message=str(e))
    
    @staticmethod
    @api.route('/components/user', methods=['GET'])
    @api.response(200, ComponentListResponseSchema)
    @jwt_required()
    def api_get_user_components():
        """Get current user's accessible components"""
        try:
            components = ComponentService.get_user_components()
            return {'components': components}
        except Exception as e:
            abort(500, message=str(e))

    @staticmethod
    @api.route('/components/user/<int:user_id>', methods=['GET'])
    @api.response(200, ComponentListResponseSchema)
    @jwt_required()
    def api_get_specific_user_components(user_id):
        """Get components assigned to a specific user (Admin only)"""
        try:
            # Verify admin access (Platform or Domain)
            # Domain Admin can only see users in their domain
            current_user = AuthService.get_current_user()
            target_user = UserService.get_user_by_id(user_id) # This checks if user exists
            
            # If not platform admin, check domain access
            if not current_user.has_role('platform_admin'):
                 # Check if target user belongs to a domain managed by current user
                 # Simplified: If target user has ANY role in a domain managed by current user, allow.
                 
                 admin_domains = [m.domain_id for m in current_user.user_roles if m.active_flag and m.role.role_name == 'admin']
                 user_domains = [m.domain_id for m in target_user.user_roles if m.active_flag]
                 
                 if not set(admin_domains).intersection(set(user_domains)):
                     abort(403, message="Access denied to this user's components")

            components = ComponentService.get_user_assigned_components(user_id)
            return {'components': components}
        except ValueError as e:
            abort(404, message=str(e))
        except Exception as e:
            abort(500, message=str(e))
    
    # @staticmethod
    # @api.route('/components/assign', methods=['POST'])
    # @api.arguments(AssignComponentSchema)
    # @api.response(200, ComponentAccessSchema)
    # @jwt_required()
    # def api_post_assign_component(data):
    #     """Assign component to role (admin only)"""
    #     try:
    #         AuthService.verify_admin()
    #         result = ComponentService.assign_component_to_role(
    #             role_name=data['role'],
    #             component_name=data['component_name'],
    #             has_access=data.get('has_access', True)
    #         )
    #         return result
    #     except ValidationError as err:
    #         abort(400, message=str(err.messages))
    #     except ValueError as e:
    #         abort(400, message=str(e))
    #     except Exception as e:
    #         abort(500, message=str(e))

    @staticmethod
    @api.route('/components/assign/user', methods=['POST'])
    @api.arguments(AssignComponentSchema) # Reusing schema, might need 'user_id' instead of 'role'
    @api.response(200, ComponentAccessSchema)
    @jwt_required()
    def api_post_assign_component_to_user(data):
        """Assign component to USER (Domain Admin)"""
        try:
            # Schema has 'role', we need 'user_id'. 
            # We should probably create a new schema or accept 'role' as user_id? 
            # No, that's messy. Let's assume the client sends 'user_id' in the body 
            # even if the schema doesn't strictly validate it (or we update schema).
            # Wait, AssignComponentSchema has 'role' field. 
            # Let's use request.json to get user_id if schema doesn't have it.
            
            req_data = request.get_json()
            user_id = req_data.get('user_id')
            component_name = data['component_name']
            has_access = data.get('has_access', True)
            
            if not user_id:
                abort(400, message="user_id is required")
                
            admin_user = AuthService.get_current_user()
            
            result = ComponentService.assign_component_to_user(
                admin_user_id=admin_user.user_id,
                target_user_id=user_id,
                component_name=component_name,
                has_access=has_access
            )
            return result
        except ValueError as e:
            abort(400, message=str(e))
        except Exception as e:
            abort(500, message=str(e))
    
    # @staticmethod
    # @api.route('/components/role/<string:role>', methods=['GET'])
    # @api.response(200, ComponentListResponseSchema)
    # @jwt_required()
    # def api_get_role_components(role):
    #     """Get components for a specific role (admin only)"""
    #     try:
    #         AuthService.verify_admin()
    #         components = ComponentService.get_role_components(role)
    #         return {'components': components}
    #     except ValueError as e:
    #         abort(400, message=str(e))
    #     except Exception as e:
    #         abort(500, message=str(e))
    
    @staticmethod
    @api.route('/components/navigation', methods=['GET'])
    @jwt_required()
    def api_get_navigation():
        """Get navigation menu for current user based on ACTIVE ROLE and DOMAIN from JWT"""
        try:
            claims = get_jwt()
            active_role = claims.get('role')
            domain_id = claims.get('domain_id')

            if not active_role:
                abort(400, message='No active role found in JWT')

            nav_items = ComponentService.get_navigation(active_role, domain_id)
            return {'navigation': nav_items}

        except Exception as e:
            # If it's already an abort/HTTPException, re-raise it
            if hasattr(e, 'code') and isinstance(e.code, int):
                raise e
            abort(500, message=str(e))
    
    # ============================================================================
    # DOMAIN MANAGEMENT
    # ============================================================================
    
    @staticmethod
    @api.route('/domains', methods=['GET'])
    @api.response(200, DomainSchema(many=True))
    @jwt_required()
    def api_get_domains():
        """List all domains (Platform Admin only)"""
        try:
            AuthService.verify_platform_admin()
            domains = DomainService.get_all_domains()
            return domains
        except ValueError as e:
            abort(403, message=str(e))
        except Exception as e:
            abort(500, message=str(e))
    
    @staticmethod
    @api.route('/domains', methods=['POST'])
    @api.arguments(CreateDomainSchema)
    @api.response(201, DomainSchema)
    @jwt_required()
    def api_post_domain(data):
        """Create new domain (Platform Admin only)"""
        try:
            AuthService.verify_platform_admin()
            domain = DomainService.create_domain(**data)
            return domain
        except ValidationError as err:
            abort(400, message=str(err.messages))
        except ValueError as e:
            abort(400, message=str(e))
        except Exception as e:
            abort(500, message=str(e))
    
    @staticmethod
    @api.route('/domains/<int:domain_id>', methods=['GET'])
    @api.response(200, DomainSchema)
    @jwt_required()
    def api_get_domain(domain_id):
        """Get domain by ID (Platform Admin only)"""
        try:
            AuthService.verify_platform_admin()
            domain = DomainService.get_domain_by_id(domain_id)
            return domain
        except ValueError as e:
            abort(404, message=str(e))
        except Exception as e:
            abort(500, message=str(e))
    
    @staticmethod
    @api.route('/domains/signup-enabled', methods=['GET'])
    @api.response(200, DomainSchema(many=True))
    def api_get_signup_enabled_domains():
        """Get domains where SIGNUP component is assigned (public endpoint)"""
        try:
            domains = DomainService.get_domains_with_signup()
            return domains
        except Exception as e:
            abort(500, message=str(e))
    
    @staticmethod
    @api.route('/domains/<int:domain_id>', methods=['PUT'])
    @api.arguments(UpdateDomainSchema)
    @api.response(200, DomainSchema)
    @jwt_required()
    def api_put_domain(data, domain_id):
        """Update domain (Platform Admin only)"""
        try:
            AuthService.verify_platform_admin()
            domain = DomainService.update_domain(domain_id, data)
            return domain
        except ValidationError as err:
            abort(400, message=str(err.messages))
        except ValueError as e:
            abort(400, message=str(e))
        except Exception as e:
            abort(500, message=str(e))
    
    @staticmethod
    @api.route('/domains/<int:domain_id>', methods=['DELETE'])
    @api.response(200, description="Domain deleted")
    @jwt_required()
    def api_delete_domain(domain_id):
        """Delete domain (Platform Admin only)"""
        try:
            AuthService.verify_platform_admin()
            result = DomainService.delete_domain(domain_id)
            return result
        except ValueError as e:
            abort(400, message=str(e))
        except Exception as e:
            abort(500, message=str(e))
    
    # ============================================================================
    # USER-DOMAIN ASSIGNMENT (Platform Admin)
    # ============================================================================
    
    @staticmethod
    @api.route('/domains/<int:domain_id>/users', methods=['GET'])
    @api.response(200, description="List of users in domain")
    @jwt_required()
    def api_get_domain_users(domain_id):
        """Get all users assigned to a domain (Platform Admin OR Domain Admin)"""
        try:
            AuthService.verify_domain_access(domain_id)
            users = UserService.get_users_by_domain(domain_id)
            return {'users': users}
        except ValueError as e:
            abort(403, message=str(e))
        except Exception as e:
            abort(500, message=str(e))
    
    @staticmethod
    @api.route('/domains/<int:domain_id>/users', methods=['POST'])
    @api.response(200, description="User assigned to domain")
    @jwt_required()
    def api_assign_user_to_domain(domain_id):
        """Assign user to domain with role (Platform Admin only)"""
        try:
            AuthService.verify_platform_admin()
            data = request.get_json()
            
            user_id = data.get('user_id')
            role_name = data.get('role_name', 'user')
            
            if not user_id:
                abort(400, message='user_id is required')
            
            result = UserService.assign_user_to_domain(user_id, domain_id, role_name)
            return result
        except ValueError as e:
            abort(400, message=str(e))
        except Exception as e:
            abort(500, message=str(e))
    
    # @staticmethod
    # @api.route('/domains/<int:domain_id>/users/<int:user_id>', methods=['DELETE'])
    # @api.response(200, description="User removed from domain")
    # @jwt_required()
    # def api_remove_user_from_domain(domain_id, user_id):
    #     """Remove user from domain (Platform Admin only)"""
    #     try:
    #         AuthService.verify_platform_admin()
    #         result = UserService.remove_user_from_domain(user_id, domain_id)
    #         return result
    #     except ValueError as e:
    #         abort(400, message=str(e))
    #     except Exception as e:
    #         abort(500, message=str(e))
    
    # ============================================================================
    # SYSTEM LOGS (Platform Admin)
    # ============================================================================
    
    # @staticmethod
    # @api.route('/logs', methods=['GET'])
    # @api.response(200, description="System logs")
    # @jwt_required()
    # def api_get_system_logs():
    #     """Get system logs (Platform Admin only)"""
    #     try:
    #         AuthService.verify_platform_admin()
    #         # TODO: Implement actual system logging
    #         # For now, return placeholder
    #         return {
    #             'logs': [],
    #             'message': 'System logs endpoint - to be implemented'
    #         }
    #     except ValueError as e:
    #         abort(403, message=str(e))
    #     except Exception as e:
    #         abort(500, message=str(e))
