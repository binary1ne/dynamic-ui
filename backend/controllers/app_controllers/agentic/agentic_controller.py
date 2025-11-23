"""
Agentic Domain Controller - RAG and Chat functionality
Consolidated from rag_controller and chat_controller
"""
import os
import uuid
from flask import request
from flask_smorest import Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import ValidationError, Schema, fields
from werkzeug.utils import secure_filename

from services.agentic_services.rag_service import RAGService
from services.agentic_services.chat_service import ChatService
from services.guardrails_services.guardrails_service import GuardrailsService
from dtos.app_data.rag_dto import (
    DocumentSchema, RagChatRequestSchema, RagChatResponseSchema
)
from dtos.app_data.chat_dto import (
    ToolChatRequestSchema, ToolChatResponseSchema, ChatHistorySchema
)
from configs.app_config import Config

api = Blueprint(
    name='AgenticController', 
    import_name='AgenticController', 
    url_prefix='/api/ai', 
    description='Agentic domain operations (RAG & Chat)')



class UploadSchema(Schema):
    file = fields.Raw(type='string', format='binary', required=True, metadata={'description': 'Document file'})


class AgenticController:
    """Agentic Controller - Handles RAG and Chat endpoints"""
    
    # ============================================================================
    # RAG OPERATIONS
    # ============================================================================
    
    @staticmethod
    @api.route('/rag/upload', methods=['POST'])
    @api.arguments(UploadSchema, location='files')
    @api.response(201, DocumentSchema)
    @jwt_required()
    def api_post_rag_upload(files):
        """Upload document for RAG"""
        try:
            user_id = get_jwt_identity()
            file = files['file']
            
            rag_service = RAGService()
            document = rag_service.upload_document(file, user_id)
            
            return document
        except ValueError as e:
            api.abort(400, message=str(e))
        except Exception as e:
            api.abort(500, message=f'Upload failed: {str(e)}')
    
    @staticmethod
    @api.route('/rag/chat', methods=['POST'])
    @api.arguments(RagChatRequestSchema)
    @api.response(200, RagChatResponseSchema)
    @jwt_required()
    def api_post_rag_chat(data):
        """Chat with documents using RAG"""
        try:
            user_id = get_jwt_identity()
            
            guardrails_result = GuardrailsService.check_content(
                data['query'],
                user_id,
                'input'
            )
            
            if not guardrails_result['passed']:
                agentic.abort(400, message='Content violates guardrails', violations=guardrails_result['violations'])
            
            rag_service = RAGService()
            response = rag_service.chat_with_documents(
                query=data['query'],
                user_id=user_id,
                use_internet=data.get('use_internet', False)
            )
            
            output_check = GuardrailsService.check_content(
                response['answer'],
                user_id,
                'output'
            )
            
            if not output_check['passed']:
                response['answer'] = output_check['cleaned_content']
            
            return response
        except ValidationError as err:
            agentic.abort(400, message=str(err.messages))
        except ValueError as e:
            api.abort(400, message=str(e))
        except Exception as e:
            api.abort(500, message=f'Chat failed: {str(e)}')
    
    @staticmethod
    @api.route('/rag/documents', methods=['GET'])
    @api.response(200, DocumentSchema(many=True))
    @jwt_required()
    def api_get_rag_documents():
        """Get user's documents"""
        try:
            user_id = get_jwt_identity()
            rag_service = RAGService()
            documents = rag_service.get_user_documents(user_id)
            return documents
        except Exception as e:
            api.abort(500, message=str(e))
    
    @staticmethod
    @api.route('/rag/documents/<int:document_id>', methods=['DELETE'])
    @api.response(200, description="Document deleted")
    @jwt_required()
    def api_delete_rag_document(document_id):
        """Delete document"""
        try:
            user_id = get_jwt_identity()
            rag_service = RAGService()
            result = rag_service.delete_document(document_id, user_id)
            return result
        except ValueError as e:
            agentic.abort(404, message=str(e))
        except Exception as e:
            agentic.abort(500, message=str(e))
    
    # ============================================================================
    # CHAT OPERATIONS
    # ============================================================================
    
    @staticmethod
    @api.route('/chat/tool-calling', methods=['POST'])
    @api.response(200, ToolChatResponseSchema)
    @jwt_required()
    def api_post_chat_tool_calling():
        """Chat with tool calling and optional image support"""
        try:
            user_id = get_jwt_identity()
            images = []
            message = None
            
            if request.files or request.form:
                message = request.form.get('message')
                if not message:
                    agentic.abort(400, message='Message is required')
                
                for key in request.files:
                    file = request.files[key]
                    if file and file.filename:
                        filename = secure_filename(file.filename)
                        ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
                        
                        allowed_image_types = {'jpg', 'jpeg', 'png', 'gif', 'webp'}
                        if ext not in allowed_image_types:
                            agentic.abort(400, message=f'Invalid image type. Allowed: {allowed_image_types}')
                        
                        temp_dir = os.path.join(Config.DOCUMENTS_PATH, 'temp_images')
                        os.makedirs(temp_dir, exist_ok=True)
                        
                        temp_filename = f"{uuid.uuid4()}_{filename}"
                        temp_path = os.path.join(temp_dir, temp_filename)
                        file.save(temp_path)
                        images.append(temp_path)
            else:
                json_data = request.get_json()
                if not json_data:
                     agentic.abort(400, message='No data provided')
                data = ToolChatRequestSchema().load(json_data)
                message = data['message']
            
            guardrails_result = GuardrailsService.check_content(
                message,
                user_id,
                'input'
            )
            
            if not guardrails_result['passed']:
                for img_path in images:
                    if os.path.exists(img_path):
                        os.remove(img_path)
                agentic.abort(400, message='Content violates guardrails', violations=guardrails_result['violations'])
            
            chat_service = ChatService()
            history = chat_service.get_chat_history(user_id, 'tool', limit=10)
            
            response = chat_service.chat_with_tools(
                message=message,
                user_id=user_id,
                chat_history=history,
                images=images if images else None
            )
            
            for img_path in images:
                if os.path.exists(img_path):
                    os.remove(img_path)
            
            output_check = GuardrailsService.check_content(
                response['answer'],
                user_id,
                'output'
            )
            
            if not output_check['passed']:
                response['answer'] = output_check['cleaned_content']
            
            return response
        except ValidationError as err:
            agentic.abort(400, message=str(err.messages))
        except ValueError as e:
            api.abort(400, message=str(e))
        except Exception as e:
            api.abort(500, message=f'Chat failed: {str(e)}')
    
    @staticmethod
    @api.route('/chat/history', methods=['GET'])
    @api.response(200, ChatHistorySchema(many=True))
    @jwt_required()
    def api_get_chat_history():
        """Get chat history"""
        try:
            user_id = get_jwt_identity()
            chat_service = ChatService()
            history = chat_service.get_chat_history(user_id, limit=50)
            return history
        except Exception as e:
            api.abort(500, message=str(e))
    
    @staticmethod
    @api.route('/chat/history', methods=['DELETE'])
    @api.response(200, description="History cleared")
    @jwt_required()
    def api_delete_chat_history():
        """Clear chat history"""
        try:
            user_id = get_jwt_identity()
            chat_service = ChatService()
            result = chat_service.clear_chat_history(user_id)
            return result
        except Exception as e:
            agentic.abort(500, message=str(e))
