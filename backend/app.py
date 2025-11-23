from flask import Flask
from flask_smorest import Api
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from dotenv import load_dotenv
from configs.app_config import Config
from models import db

from controllers import controllers_registers

def create_app(app_name=str, init_db:bool =True):
    """Application factory"""
    app = Flask(app_name)
    app.config.from_object(Config)
    
    # Flask-Smorest Config
    app.config["API_TITLE"] = "Enterprise API"
    app.config["API_VERSION"] = "v1"
    app.config["OPENAPI_VERSION"] = "3.0.2"
    app.config["OPENAPI_URL_PREFIX"] = "/"
    app.config["OPENAPI_SWAGGER_UI_PATH"] = "/docs"
    app.config["OPENAPI_SWAGGER_UI_URL"] = "https://cdn.jsdelivr.net/npm/swagger-ui-dist/"
    
    # Initialize config
    Config.init_app(app)
    
    # Initialize extensions
    db.init_app(app)
    jwt = JWTManager(app)
    CORS(app, origins=Config.CORS_ORIGINS, max_age=25, vary_header=True, supports_credentials=True, methods=['GET','POST','PUT','DELETE','OPTIONS'])
    
    # Initialize API
    api = Api(app)
    
    # Register all controller blueprints
    controllers_registers(api)
    
    # Initialize database and run migrations
    if init_db:
        from migrations.init_db import init_db
        init_db(app)
    
    @app.route('/health')
    def health():
        """Health check"""
        return {'status': 'healthy'}
    
    return app

if __name__ == '__main__':
    app = create_app(app_name="ONeApp", init_db=True)
    app.run(debug=True, host='0.0.0.0', port=5000)
