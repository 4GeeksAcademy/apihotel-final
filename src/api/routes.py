
"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
from flask import Flask, request, jsonify, url_for, Blueprint
from api.utils import generate_sitemap, APIException
from flask_cors import CORS
from api.models import db, User, Hoteles, Theme, Category, HotelTheme, Branches, Maintenance, HouseKeeper, HouseKeeperTask, MaintenanceTask, Room
import datetime
import jwt
from werkzeug.security import check_password_hash, generate_password_hash
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_jwt_extended import JWTManager
from flask_jwt_extended import create_access_token
# from datetime import datetime

# Blueprint para los endpoints de la API
api = Blueprint('api', __name__)
app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'tu_clave_secreta'  # Cambia esto por una clave secreta segura
# jwt = JWTManager(app)

SECRET_KEY = "your_secret_key"
# Permitir solicitudes CORS a esta API
CORS(api)

# Endpoint de prueba para la API
@api.route('/hello', methods=['POST', 'GET'])
def handle_hello():
    response_body = {
        "message": "Hello! I'm a message that came from the backend, check the network tab on the google inspector and you will see the GET request"
    }
    return jsonify(response_body), 200

@api.route('/user', methods=['GET'])
def get_users():
    users = User.query.all()
    if not users:
        return jsonify(message="No users found"), 404
    all_users = list(map(lambda x: x.serialize(), users))
    return jsonify(message="Users", users=all_users), 200


# rutas para hoteles

@api.route('/hoteles', methods=['GET'])
def obtener_hoteles():
    hoteles = Hoteles.query.all()  # Obtener todos los hotel
    hoteles_serialize = [hotel.serialize() for hotel in hoteles]  # Serializar cada hotel
    return jsonify(hoteles_serialize), 200  # Retornar los datos serializados como JSON

@api.route("/hoteles/<int:id>", methods=["GET"])
def obtener_hotel_por_id(id):
    hotel = Hoteles.query.get(id)
    
    if not hotel:
        return jsonify({"error": "Hotel no encontrado"}), 404
   
    return jsonify(hotel.serialize()), 200

@api.route('/hoteles', methods=['POST'])
def crear_hoteles():
    data = request.get_json()
    #crear hoteles
    if "password" not in data or not data["password"]:
        return jsonify({"error": "Password is requires"}), 400
    if "email" not in data or not data["email"]:
        return jsonify({"error": "Email is required"}), 400

    # Validar que el email contenga "@"
    if "@" not in data["email"]:
        return jsonify({"error": "Email must contain '@'"}), 400
    
    existing_hotel = Hoteles.query.filter_by(nombre=data["nombre"]).first()
    if existing_hotel:
        return jsonify({"error": "Hotel con este nombre ya existe"}), 400
    
    # Verificar si el email ya está registrado
    existing_email = Hoteles.query.filter_by(email=data["email"]).first()
    if existing_email:
        return jsonify({"error": "Email is already in use"}), 400
        
    nuevo_hotel =Hoteles(
        nombre=data["nombre"],
        email=data["email"],
            password=data["password"]
    )
   
    db.session.add(nuevo_hotel)
    db.session.commit()
        
    return jsonify(nuevo_hotel.serialize()), 200

@api.route("/hoteles/<int:id>", methods=["DELETE"])
def delete_hoteles(id):
    hotel = Hoteles.query.get(id)
    
    if not hotel:
        return jsonify({"error": "Hotel no encontrado"}), 400
    
    db.session.delete(hotel)
    db.session.commit()
    
    return jsonify({"message" : "Hotel eliminado"}), 200

@api.route("/hoteles/<int:id>", methods=["PUT"])
def actualizar_hoteles(id):
    hotel = Hoteles.query.get(id)
    
    if not hotel:
        return jsonify({"error": "Hotel no encontrado"}), 400
    
    data = request.get_json()
    hotel.nombre = data.get("nombre", hotel.nombre)
    hotel.email = data.get("email", hotel.email)
   
    db.session.commit()
   
    return jsonify(hotel.serialize()), 200

@api.route('/theme', methods=['GET'])
def get_themes():
    themes = Theme.query.all()
    if not themes:
        return jsonify(message="No themes found"), 404
    all_themes = list(map(lambda x: x.serialize(), themes))
    return jsonify(message="Themes", themes=all_themes), 200

@api.route('/theme/<int:id>', methods=['GET'])
def get_theme_by_id(id):
    theme = Theme.query.get(id)
    if not theme:
        return jsonify(message="Theme not found"), 404
    return jsonify(message="Theme", theme=theme.serialize()), 200

@api.route('/theme', methods=['POST'])
def add_new_theme():
    body = request.get_json(silent=True)
    if body is None:
        return jsonify({"msg": "Body missing"}), 400
    if "nombre" not in body:
        return jsonify({"msg": "nombre missing"}), 400
    
    new_theme = Theme()
    new_theme.nombre = body['nombre']
    
    try:
        with db.session.begin():
            db.session.add(new_theme)
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": f"Error creating theme: {str(e)}"}), 500
    
    return jsonify({'msg': f'Theme {body["nombre"]} has been created', 'theme': new_theme.serialize()}), 201

@api.route('/theme/<int:id>', methods=['PUT'])
def update_theme(id):
    theme = Theme.query.get(id)
    if not theme:
        return jsonify(message="Theme not found"), 404
    
    data = request.get_json()
    if 'nombre' in data:
        theme.nombre = data['nombre']
    
    db.session.commit()
    
    return jsonify(message="Theme updated successfully", theme=theme.serialize()), 200

@api.route('/theme/<int:id>', methods=['DELETE'])
def delete_theme(id):
    theme = Theme.query.get(id)
    if not theme:
        return jsonify(message="Theme not found"), 404
    
    db.session.delete(theme)
    db.session.commit()
    
    return jsonify(message="Theme deleted successfully"), 200

# Obtener todas las categorías
@api.route('/categories', methods=['GET'])
def obtener_categories():
    categories = Category.query.all()  # Obtener todas las categorías
    categories_serialize = [category.serialize() for category in categories]  # Serializar cada categoría
    return jsonify(categories_serialize), 200  # Retornar los datos serializados como JSON

# Crear una nueva categoría
@api.route('/categories', methods=['POST'])
def crear_category():
    data = request.get_json()

    # Validación: Verificar que se reciba el nombre
    if not data.get("nombre"):
        return jsonify({"error": "El nombre de la categoría es obligatorio"}), 400

    # Verificar si la categoría ya existe
    existing_category = Category.query.filter_by(nombre=data["nombre"]).first()
    if existing_category:
        return jsonify({"error": "Categoría con este nombre ya existe"}), 400

    # Crear nueva categoría
    nuevo_category = Category(
        nombre=data["nombre"],
    )
    db.session.add(nuevo_category)
    db.session.commit()

    return jsonify(nuevo_category.serialize()), 201  # Usar código 201 para creación exitosa

# Eliminar una categoría por ID
@api.route("/categories/<int:id>", methods=["DELETE"])
def delete_category(id):
    category = Category.query.get(id)

    if not category:
        return jsonify({"error": "Categoría no encontrada"}), 404  # Código 404 para no encontrado

    db.session.delete(category)
    db.session.commit()

    return jsonify({"message": "Categoría eliminada"}), 200

# Actualizar una categoría por ID
@api.route("/categories/<int:id>", methods=["PUT"])
def actualizar_category(id):
    category = Category.query.get(id)

    if not category:
        return jsonify({"error": "Categoría no encontrada"}), 404  # Código 404 para no encontrado

    data = request.get_json()

    # Validación para el nombre
    if not data.get("nombre"):
        return jsonify({"error": "El nombre de la categoría es obligatorio"}), 400

    category.nombre = data.get("nombre", category.nombre)
    db.session.commit()

    # if "nombre" in data:
    #     category.nombre = data["nombre"]

    # try:
    #     db.session.commit()
    # except Exception as e:
    #     db.session.rollback()  # Si ocurre un error, deshacer los cambios
    #     return jsonify({"error": f"Error al actualizar la categoría: {str(e)}"}), 500

    return jsonify(category.serialize()), 200  # Código 200 para solicitud exitosa

# route para Branches
# Obtener todos los branches
@api.route('/branches', methods=['GET'])
def obtener_branches():
    branches = Branches.query.all()  # Obtener todos los branches
    branches_serialize = [branch.serialize() for branch in branches]  # Serializar cada branch
   
    return jsonify(branches_serialize), 200  # Retornar los datos serializados como JSON

# Obtener un branch por ID
@api.route('/branches/<int:id>', methods=['GET'])
def get_branch(id):
    branch = Branches.query.get_or_404(id)
   
    return jsonify(branch.serialize()), 200  # Aquí se añade la respuesta JSON

# Crear un nuevo branch
@api.route('/branches', methods=['POST'])
def crear_branch():
    data = request.get_json()
   
    nuevo_branch = Branches(
        nombre=data["nombre"],
        direccion=data["direccion"],
        longitud=data["longitud"],
        latitud=data["latitud"],
        hotel_id=data["hotel_id"]
    )

    db.session.add(nuevo_branch)
    db.session.commit()
    
    return jsonify(nuevo_branch.serialize()), 201

# Actualizar un branch existente
@api.route('/branches/<int:id>', methods=['PUT'])
def actualizar_branch(id):
    branch = Branches.query.get_or_404(id)
    data = request.get_json()
    branch.nombre = data.get("nombre", branch.nombre)
    branch.direccion = data.get("direccion", branch.direccion)
    branch.longitud = data.get("longitud", branch.longitud)
    branch.latitud = data.get("latitud", branch.latitud)
    branch.hotel_id = data.get("hotel_id", branch.hotel_id)
    
    db.session.commit()

    return jsonify(branch.serialize()), 200

# Eliminar un branch
@api.route('/branches/<int:id>', methods=['DELETE'])
def delete_branch(id):
    branch = Branches.query.get_or_404(id)

    db.session.delete(branch)
    db.session.commit()
    
    return jsonify({"message": "Branch eliminado"}), 200

@api.route('/hoteltheme', methods=['POST'])
def create_hoteltheme():
    body = request.get_json()
    if not body or not body.get('id_hoteles') or not body.get('id_theme'):
        return jsonify({"message": "id_hoteles and id_theme are required"}), 400
    hotel = Hoteles.query.get(body.get('id_hoteles'))
    theme = Theme.query.get(body.get('id_theme'))
    if not hotel or not theme:
        return jsonify({"message": "Hotel or Theme not found"}), 404
    new_hoteltheme = HotelTheme(
        id_hoteles=body.get('id_hoteles'),
        id_theme=body.get('id_theme')
    )
    db.session.add(new_hoteltheme)
    db.session.commit()
    return jsonify(new_hoteltheme.serialize()), 201

@api.route('/hoteltheme', methods=['GET'])
def get_hotelthemes():
    hotelthemes = HotelTheme.query.all()
    return jsonify([hoteltheme.serialize() for hoteltheme in hotelthemes]), 200

@api.route('/hoteltheme/<int:id>', methods=['GET'])
def get_hoteltheme(id):
    hoteltheme = HotelTheme.query.get(id)
    if not hoteltheme:
        return jsonify({"message": "HotelTheme not found"}), 404
    return jsonify(hoteltheme.serialize()), 200

@api.route('/hoteltheme/<int:id>', methods=['PUT'])
def update_hoteltheme(id):
    hoteltheme = HotelTheme.query.get(id)
    if not hoteltheme:
        return jsonify({"message": "HotelTheme not found"}), 404
    body = request.get_json()
    hotel = Hoteles.query.get(body.get('id_hoteles', hoteltheme.id_hoteles))
    theme = Theme.query.get(body.get('id_theme', hoteltheme.id_theme))
    if not hotel or not theme:
        return jsonify({"message": "Hotel or Theme not found"}), 404
    hoteltheme.id_hoteles = body.get('id_hoteles', hoteltheme.id_hoteles)
    hoteltheme.id_theme = body.get('id_theme', hoteltheme.id_theme)
    db.session.commit()
    return jsonify(hoteltheme.serialize()), 200

@api.route('/hoteltheme/<int:id>', methods=['DELETE'])
def delete_hoteltheme(id):
    hoteltheme = HotelTheme.query.get(id)
    if not hoteltheme:
        return jsonify({"message": "HotelTheme not found"}), 404
    db.session.delete(hoteltheme)
    db.session.commit()
    return jsonify({"message": "HotelTheme deleted"}), 200

# Obtener todas las habitaciones
@api.route('/rooms', methods=['GET'])
def obtener_rooms():
    rooms = Room.query.all()  # Obtener todas las habitaciones
    room_serialize = [room.serialize() for room in rooms]  # Serializar cada habitacion
    return jsonify(room_serialize), 200  # Retornar los datos serializados como JSON

# Crear una nueva habitacion
@api.route('/rooms', methods=['POST'])
def crear_room():
    data = request.get_json()

    # Validación: Verificar que se reciba el nombre
    if not data.get("nombre"):
        return jsonify({"error": "El nombre de la habitación es obligatorio"}), 400

    # Verificar si la habitacion ya existe
    print(data)
    existing_room = Room.query.filter_by(nombre=data["nombre"]).filter_by(branch_id=data["branchId"]).first()
    if existing_room:
        return jsonify({"error": "Habitación con este nombre ya existe"}), 400
    # Crear nueva habitacion
    nuevo_room = Room(
        nombre=data["nombre"],
        branch_id=data["branchId"]
    )
    db.session.add(nuevo_room)
    db.session.commit()

    return jsonify(nuevo_room.serialize()), 201  # Usar código 201 para creación exitosa

# Eliminar una habitación por ID
@api.route("/rooms/<int:id>", methods=["DELETE"])
def delete_room(id):
    room = Room.query.get(id)

    if not room:
        return jsonify({"error": "Habitación no encontrada"}), 404  # Código 404 para no encontrado

    db.session.delete(room)
    db.session.commit()

    return jsonify({"message": "Habitación eliminada"}), 200

# Actualizar una habitación por ID
@api.route("/rooms/<int:id>", methods=["PUT"])
def actualizar_room(id):
    room = Room.query.get(id)

    if not room:
        return jsonify({"error": "Habitación no encontrada"}), 404  # Código 404 para no encontrado

    data = request.get_json()

    # Validación para el nombre
    if not data.get("nombre"):
        return jsonify({"error": "El nombre de la habitación es obligatorio"}), 400

    room.nombre = data.get("nombre", room.nombre)  # Actualizar el nombre
    db.session.commit()

    return jsonify(room.serialize()), 200  # Código 200 para solicitud exitosa

@api.route('/rooms/<int:id>', methods=['GET'])
def obtener_rooms_id(id):
    room = Room.query.get(id)
    if not room:
        return jsonify({"message": "RoomTheme not found"}), 404
    return jsonify(room.serialize()), 200
  
# Rutas para Maintenance

# Ruta para obtener todos los trabajadores de mantenimiento
@api.route('/maintenance', methods=['GET'])
def get_maintenance():
    maintenance = Maintenance.query.all()
    
    return jsonify([maint.serialize() for maint in maintenance]), 200

# Ruta para obtener un trabajador de mantenimiento por ID
@api.route('/maintenance/<int:id>', methods=['GET'])
def get_maint(id):
    maint = Maintenance.query.get_or_404(id)
    
    return jsonify([maint.serialize() for maint in maint]), 200

# Ruta para crear un nuevo trabajador de mantenimiento
from flask import jsonify

@api.route('/maintenance', methods=['POST'])
def create_maintenance():
    data = request.get_json()
    
    # Verificamos que los datos estén presentes
    if not data.get('nombre') or not data.get('email') or not data.get('password') or not data.get('hotel_id') or not data.get('branch_id'):
        return jsonify({"error": "Missing data"}), 400
    
    # Verificamos si el hotel existe
    hotel = Hoteles.query.get(data['hotel_id'])
    if not hotel:
        return jsonify({"error": "Hotel not found"}), 404
    
    # Verificamos si la sucursal existe
    branch = Branches.query.get(data['branch_id'])
    if not branch:
        return jsonify({"error": "Branch not found"}), 404
    
    nuevo_maint = Maintenance(
        nombre=data['nombre'],
        email=data['email'],
        password=data['password'],
        hotel_id=data['hotel_id'],
        branch_id=data['branch_id']
    )
    
    db.session.add(nuevo_maint)
    db.session.commit()
    
    return jsonify(nuevo_maint.serialize()), 201


# Ruta para actualizar un trabajador de mantenimiento
@api.route('/maintenance/<int:id>', methods=['PUT'])
def update_maintenance(id):
    maint = Maintenance.query.get_or_404(id)
    data = request.get_json()
    
    # Verificamos si el hotel existe
    hotel = Hoteles.query.get(data['hotel_id'])
    if not hotel:
        return jsonify({"error": "Hotel not found"}), 404
    
    # Verificamos si la sucursal existe
    branch = Branches.query.get(data['branch_id'])
    if not branch:
        return jsonify({"error": "Branch not found"}), 404
    
    maint.nombre = data['nombre']
    maint.email = data['email']
    maint.password = data['password']
    maint.hotel_id = data['hotel_id']
    maint.branch_id = data['branch_id']
    
    db.session.commit()
   
    return jsonify(maint.serialize())


# Ruta para eliminar un trabajador de mantenimiento
@api.route('/maintenance/<int:id>', methods=['DELETE'])
def delete_maintenance(id):
    maint = Maintenance.query.get_or_404(id)
    
    db.session.delete(maint)
    db.session.commit()
    
    return jsonify({"message": "Trabajador de mantenimiento eliminado con éxito"}), 200

# houseKeeper

@api.route('/housekeepers', methods=['POST'])
def create_housekeeper():
    data = request.get_json()

    # Verificamos que los datos estén presentes
    if not data.get('nombre') or not data.get('email') or not data.get('password'):
        return jsonify({"error": "Missing data"}), 400

    new_housekeeper = HouseKeeper(
        nombre=data['nombre'],
        email=data['email'],
        password=data['password'],  # En un proyecto real deberías cifrar la contraseña
        hotel_id=data['hotel_id'],
        id_branche=data.get('id_branche')
    )

    db.session.add(new_housekeeper)
    db.session.commit()

    return jsonify(new_housekeeper.serialize()), 201


# Obtener todos los housekeepers
@api.route('/housekeepers', methods=['GET'])
def get_housekeepers():
    housekeepers = HouseKeeper.query.all()
    return jsonify([housekeeper.serialize() for housekeeper in housekeepers]), 200


# Obtener un housekeeper por ID
@api.route('/housekeepers/<int:id>', methods=['GET'])
def get_housekeeper(id):
    housekeeper = HouseKeeper.query.get(id)
    if not housekeeper:
        return jsonify({"error": "Housekeeper not found"}), 404
    return jsonify(housekeeper.serialize()), 200


# Actualizar un housekeeper
@api.route('/housekeepers/<int:id>', methods=['PUT'])
def update_housekeeper(id):
    housekeeper = HouseKeeper.query.get(id)
    if not housekeeper:
        return jsonify({"error": "Housekeeper not found"}), 404

    data = request.get_json()

    housekeeper.nombre = data.get('nombre', housekeeper.nombre)
    housekeeper.email = data.get('email', housekeeper.email)
    housekeeper.password = data.get('password', housekeeper.password)
    housekeeper.hotel = data.get('hotel', housekeeper.hotel)
    housekeeper.id_branche = data.get('id_branche', housekeeper.id_branche)

    db.session.commit()

    return jsonify(housekeeper.serialize()), 200


# Eliminar un housekeeper
@api.route('/housekeepers/<int:id>', methods=['DELETE'])
def delete_housekeeper(id):
    housekeeper = HouseKeeper.query.get(id)
    if not housekeeper:
        return jsonify({"error": "Housekeeper not found"}), 404

    db.session.delete(housekeeper)
    db.session.commit()

    return jsonify({"message": "Housekeeper deleted successfully"}), 200

@api.route('/loginHouseKeeper', methods=['POST'])
def login_housekeeper():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    if not email or not password:
        return jsonify({"error": "Missing email or password"}), 400
    housekeeper = HouseKeeper.query.filter_by(email=email).first()
    if not housekeeper:
        return jsonify({"error": "Invalid housekeeper credentials"}), 401
    if housekeeper.password != password:
        return jsonify({"error": "Invalid password credentials"}), 401
    token = jwt.encode({
        'housekeeper_id': housekeeper.id,
        'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=5)
    }, SECRET_KEY, algorithm='HS256')
    return jsonify({'token': token}), 200

@api.route('/loginMaintenance', methods=['POST'])
def login_maintenance():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    if not email or not password:
        return jsonify({"error": "Missing email or password"}), 400
    maintenance = Maintenance.query.filter_by(email=email).first()
    if not maintenance:
        return jsonify({"error": "Invalid housekeeper credentials"}), 401
    if maintenance.password != password:
        return jsonify({"error": "Invalid password credentials"}), 401
    token = jwt.encode({
        'maintenance_id': maintenance.id,
        'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=5)
    }, SECRET_KEY, algorithm='HS256')
    return jsonify({'token': token}), 200

@api.route('/housekeeper_task', methods=['POST'])
def create_housekeeper_task():
    data = request.get_json()

    # Validate if the required fields are in the request (without photo and condition)
    if not data.get('nombre') or not data.get('assignment_date') or not data.get('submission_date') or not data.get('id_room') or not data.get('id_housekeeper'):
        return jsonify({"error": "Missing required data"}), 400

    # Check if room and housekeeper IDs are valid
    room = Room.query.get(data.get('id_room'))
    housekeeper = HouseKeeper.query.get(data.get('id_housekeeper'))

    if not room or not housekeeper:
        return jsonify({"error": "Invalid room or housekeeper ID"}), 404

    # Use default empty strings for optional fields if they are not provided
    photo = data.get('photo', '')  # Default empty string if not provided
    condition = data.get('condition', '')  # Default empty string if not provided

    # Create new HouseKeeperTask
    new_task = HouseKeeperTask(
        nombre=data['nombre'],
        photo=photo,
        condition=condition,
        assignment_date=data['assignment_date'],
        submission_date=data['submission_date'],
        id_room=data['id_room'],
        id_housekeeper=data['id_housekeeper']
    )

    db.session.add(new_task)
    db.session.commit()

    return jsonify(new_task.serialize()), 201


# READ all HouseKeeperTasks
@api.route('/housekeeper_tasks', methods=['GET'])
def get_all_housekeeper_tasks():
    tasks = HouseKeeperTask.query.all()
    return jsonify([task.serialize() for task in tasks]), 200

# READ a single HouseKeeperTask by ID
@api.route('/housekeeper_task/<int:id>', methods=['GET'])
def get_housekeeper_task(id):
    task = HouseKeeperTask.query.get(id)
    
    if task is None:
        return jsonify({"error": "HouseKeeperTask not found"}), 404
    
    return jsonify(task.serialize()), 200

# UPDATE a HouseKeeperTask by ID
@api.route('/housekeeper_task/<int:id>', methods=['PUT'])
def update_housekeeper_task(id):
    task = HouseKeeperTask.query.get(id)

    if task is None:
        return jsonify({"error": "HouseKeeperTask not found"}), 404
    
    data = request.get_json()

    # Update fields if they are provided in the request
    if data.get('nombre'):
        task.nombre = data['nombre']
    if data.get('photo'):
        task.photo = data['photo']
    if data.get('condition'):
        task.condition = data['condition']
    if data.get('assignment_date'):
        task.assignment_date = data['assignment_date']
    if data.get('submission_date'):
        task.submission_date = data['submission_date']
    if data.get('id_room'):
        task.id_room = data['id_room']
    if data.get('id_housekeeper'):
        task.id_housekeeper = data['id_housekeeper']

    db.session.commit()

    return jsonify(task.serialize()), 200

# DELETE a HouseKeeperTask by ID
@api.route('/housekeeper_task/<int:id>', methods=['DELETE'])
def delete_housekeeper_task(id):
    task = HouseKeeperTask.query.get(id)
    
    if task is None:
        return jsonify({"error": "HouseKeeperTask not found"}), 404
    
    db.session.delete(task)
    db.session.commit()

    return jsonify({"message": "HouseKeeperTask deleted successfully"}), 200

@api.route('/maintenancetasks', methods=['GET'])
def get_all_maintenance_tasks():
    """Obtener todas las tareas de mantenimiento"""
    maintenance_tasks = MaintenanceTask.query.all()
    return jsonify([task.serialize() for task in maintenance_tasks]), 200


@api.route('/maintenancetasks/<int:id>', methods=['GET'])
def get_maintenance_task(id):
    """Obtener una tarea de mantenimiento específica por ID"""
    maintenance_task = MaintenanceTask.query.get(id)
    if not maintenance_task:
        return jsonify({"message": "Tarea de mantenimiento no encontrada"}), 404
    return jsonify(maintenance_task.serialize()), 200

@api.route('/maintenancetasks', methods=['POST'])
def create_maintenance_task():
    data = request.get_json()

    try:
        nombre = data.get('nombre')
        photo = data.get('photo', None)
        condition = data.get('condition', None)
        room_id = data.get('room_id', None)
        maintenance_id = data.get('maintenance_id', None)
        housekeeper_id = data.get('housekeeper_id', None)
        category_id = data.get('category_id', None)

        new_task = MaintenanceTask(
            nombre=nombre,
            photo=photo,
            condition=condition,
            room_id=room_id,
            maintenance_id=maintenance_id,
            housekeeper_id=housekeeper_id,
            category_id=category_id
        )

        db.session.add(new_task)
        db.session.commit()

        return jsonify(new_task.serialize()), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Error al crear la tarea de mantenimiento", "error": str(e)}), 400

@api.route('/maintenancetasks/<int:id>', methods=['PUT'])
def update_maintenance_task(id):
    """Actualizar una tarea de mantenimiento existente"""
    maintenance_task = MaintenanceTask.query.get(id)

    if not maintenance_task:
        return jsonify({"message": "Tarea de mantenimiento no encontrada"}), 404

    data = request.get_json()

    try:
        maintenance_task.nombre = data.get('nombre', maintenance_task.nombre)
        maintenance_task.photo = data.get('photo', maintenance_task.photo)
        maintenance_task.condition = data.get('condition', maintenance_task.condition)
        maintenance_task.room_id = data.get('room_id', maintenance_task.room_id)
        maintenance_task.maintenance_id = data.get('maintenance_id', maintenance_task.maintenance_id)
        maintenance_task.housekeeper_id = data.get('housekeeper_id', maintenance_task.housekeeper_id)
        maintenance_task.category_id = data.get('category_id', maintenance_task.category_id)

        db.session.commit()

        return jsonify(maintenance_task.serialize()), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Error al actualizar la tarea de mantenimiento", "error": str(e)}), 400

@api.route('/maintenancetasks/<int:id>', methods=['DELETE'])
def delete_maintenance_task(id):
    """Eliminar una tarea de mantenimiento"""
    maintenance_task = MaintenanceTask.query.get(id)

    if not maintenance_task:
        return jsonify({"message": "Tarea de mantenimiento no encontrada"}), 404

    try:
        db.session.delete(maintenance_task)
        db.session.commit()
        return jsonify({"message": "Tarea de mantenimiento eliminada exitosamente"}), 200
    except Exception as e:
        db.session.rollback()

        return jsonify({"message": "Error al eliminar la tarea de mantenimiento", "error": str(e)}), 400


# @api.route('/rooms', methods=['GET'])
# def get_all_rooms():
#     rooms = Room.query.all()
#     return jsonify([room.serialize() for room in rooms]), 200

# crear un login de hotel

@api.route("/loginhotel", methods=["POST"])
def loginhotel():
    email = request.json.get("email", None)
    password = request.json.get("password", None)
    
    hotel = Hoteles.query.filter_by(email=email).first()
    
     # Si no se encuentra el hotel
    if hotel is None:
        return jsonify({"msg": "Correo no encontrado"}), 401

    # Verificar la contraseña (deberías usar hashing para contraseñas en producción)
    if password != hotel.password:
        return jsonify({"msg": "Correo o contraseña incorrectos"}), 401
    
    access_token = create_access_token(identity=email)
    return jsonify(access_token=access_token), 200

# crear signup de hotel
@api.route("/signuphotel", methods=["POST"])
def signuphotel():
     # Obtener los datos de la solicitud de registro
    body = request.get_json()

    # Verificar si el correo ya está registrado
    hotel = Hoteles.query.filter_by(email=body["email"]).first()
    
    if hotel:
        return jsonify({"msg": "Ya se encuentra un hotel con ese correo"}), 401

    # Crear un nuevo hotel
    hotel = Hoteles(email=body["email"], password=body["password"], nombre=body["nombre"])
    db.session.add(hotel)
    db.session.commit()

    # Responder con mensaje de éxito
    response_body = {
        "msg": "Hotel creado exitosamente"
    }
    return jsonify(response_body), 200

# pagina privada de hotel         
@api.route("/privatehotel", methods=["GET"])
@jwt_required()
def privatehotel():
    current_user = get_jwt_identity() #obtiene la identidad del usuario desde el token
    return jsonify(logget_in_as=current_user), 200