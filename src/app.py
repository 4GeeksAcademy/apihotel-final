import os
from flask import Flask, jsonify, send_from_directory
from flask_migrate import Migrate
from api.utils import APIException, generate_sitemap
from api.models import db
from api.routes import api
from api.admin import setup_admin
from api.commands import setup_commands
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
from flasgger import Swagger



# Cargar variables de entorno
load_dotenv()

# Configuración
ENV = "development" if os.getenv("FLASK_DEBUG") == "1" else "production"
static_file_dir = os.path.join(os.path.dirname(os.path.realpath(__file__)), '../public/')
db_url = os.getenv("DATABASE_URL")

# Inicializar app Flask
app = Flask(__name__)
app.url_map.strict_slashes = False
swagger = Swagger(app)

# CORS para permitir acceso desde React

CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)



# JWT
jwt = JWTManager(app)

# Configuración base de datos
if db_url:
    app.config['SQLALCHEMY_DATABASE_URI'] = db_url.replace("postgres://", "postgresql://")
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:////tmp/test.db"

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Inicializar base de datos y migraciones
MIGRATE = Migrate(app, db, compare_type=True)
db.init_app(app)

# Admin y comandos
setup_admin(app)
setup_commands(app)

# Rutas API principales
app.register_blueprint(api, url_prefix='/api')

# Registrar la ruta del chatbot
# src/app.py

from api.chatbot import chatbot_api
app.register_blueprint(chatbot_api, url_prefix="/api")


# Manejo de errores
@app.errorhandler(APIException)
def handle_invalid_usage(error):
    return jsonify(error.to_dict()), error.status_code

# Sitemap
@app.route('/')
def sitemap():
    if ENV == "development":
        return generate_sitemap(app)
    return send_from_directory(static_file_dir, 'index.html')

# Archivos estáticos (SPA frontend)
@app.route('/<path:path>', methods=['GET', 'POST'])
def serve_any_other_file(path):
    file_path = os.path.join(static_file_dir, path)
    if not os.path.isfile(file_path):
        path = 'index.html'
    response = send_from_directory(static_file_dir, path)
    response.cache_control.max_age = 0
    return response

# Ruta simple de prueba
@app.route("/home")
def home():
    return "API funcionando correctamente"

# Ejecutar app
if __name__ == '__main__':
    PORT = int(os.environ.get('PORT', 3001))
    app.run(host='0.0.0.0', port=PORT, debug=True)
