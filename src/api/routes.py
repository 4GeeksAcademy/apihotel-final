"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
from flask import Flask, request, jsonify, Blueprint
from api.utils import generate_sitemap, APIException
from flask_cors import CORS
from api.models import db, User, Hoteles, Theme, Category, HotelTheme, Branches, Maintenance, HouseKeeper, HouseKeeperTask, MaintenanceTask, Room
import datetime
import jwt
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_jwt_extended import JWTManager
from flask_jwt_extended import create_access_token

# from datetime import datetime

# Blueprint para los endpoints de la API
api = Blueprint('api', __name__)
app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'tu_clave_secreta'  # Cambia esto por una clave secreta segura
jwt = JWTManager(app)

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
@jwt_required()
def obtener_hoteles():
    hotel_id = get_jwt_identity()  # Ahora `hotel_id` es un string
    
    print("Usuario autenticado con hotel_id:", hotel_id)  # Verifica qué devuelve el token

    hotel = Hoteles.query.get(int(hotel_id))  # Convertimos a int para la consulta
    if not hotel:
        return jsonify({"error": "Hotel no encontrado"}), 404

    return jsonify(hotel.serialize()), 200

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
@jwt_required()
def delete_hoteles(id):
    hotel_id = get_jwt_identity()  # Obtener ID del hotel autenticado

    if int(hotel_id) != id:  # Comparar con el ID de la URL
        return jsonify({"error": "Acceso denegado"}), 403  # Bloquear acceso
    
    hotel = Hoteles.query.get(id)
    
    if not hotel:
        return jsonify({"error": "Hotel no encontrado"}), 404
    
    db.session.delete(hotel)
    db.session.commit()
    
    return jsonify({"message": "Hotel eliminado"}), 200



@api.route("/hoteles/<int:id>", methods=["PUT"])
@jwt_required()
def actualizar_hoteles(id):
    hotel_id = get_jwt_identity()  # Obtener ID del hotel autenticado

    if int(hotel_id) != id:  # Comparar con el ID de la URL
        return jsonify({"error": "Acceso denegado"}), 403  # Bloquear acceso

    hotel = Hoteles.query.get(id)
    
    if not hotel:
        return jsonify({"error": "Hotel no encontrado"}), 404
    
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
   
    return jsonify(category.serialize()), 200  # Código 200 para solicitud exitosa

# route para Branches

# Obtener todos los branches
@api.route('/branches', methods=['GET'])
@jwt_required()
def obtener_branches():
    hotel_id = get_jwt_identity()
    hotel = Hoteles.query.get(hotel_id)

    if not hotel:
        return jsonify({"error": "Hotel no encontrado"}), 404

    branches = Branches.query.filter_by(hotel_id=hotel.id).all()

    return jsonify([branch.serialize() for branch in branches]), 200

# Obtener un branch por ID
@api.route('/branches/<int:id>', methods=['GET'])
def get_branch(id):
    branch = Branches.query.get_or_404(id)
   
    return jsonify(branch.serialize()), 200  # Aquí se añade la respuesta JSON

# Crear un nuevo branch
@api.route('/branches', methods=['POST'])
@jwt_required()
def crear_branch():
    hotel_id = get_jwt_identity()
    hotel = Hoteles.query.get(hotel_id)

    data = request.get_json()
    print("Datos recibidos del frontend:", data)
    print("Hotel actual:", hotel.serialize() if hotel else "No encontrado")

    if not hotel:
        return jsonify({"error": "Hotel no encontrado"}), 404

    try:
        nuevo_branch = Branches(
            nombre=data["nombre"],
            direccion=data["direccion"],
            # Opcionales ahora, si no llegan desde el frontend:
            latitud=float(data.get("latitud", 0)),
            longitud=float(data.get("longitud", 0)),
            hotel_id=hotel.id
        )

        db.session.add(nuevo_branch)
        db.session.commit()

        return jsonify(nuevo_branch.serialize()), 201

    except Exception as e:
        print("Error al crear branch:", e)
        return jsonify({"error": str(e)}), 500

# Actualizar un branch existente
@api.route('/branches/<int:id>', methods=['PUT'])
@jwt_required()
def actualizar_branch(id):
    hotel_id = get_jwt_identity()
    branch = Branches.query.get(id)

    if not branch or branch.hotel_id != int(hotel_id):
        return jsonify({"error": "Acceso denegado"}), 403  # Solo el dueño puede editar

    data = request.get_json()
    branch.nombre = data.get("nombre", branch.nombre)
    branch.direccion = data.get("direccion", branch.direccion)
    db.session.commit()

    return jsonify(branch.serialize()), 200

# Eliminar un branch
@api.route('/branches/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_branch(id):
    hotel_id = get_jwt_identity()
    branch = Branches.query.get(id)

    if not branch or branch.hotel_id != int(hotel_id):
        return jsonify({"error": "Acceso denegado"}), 403  # Solo el dueño puede eliminar

    db.session.delete(branch)
    db.session.commit()

    return jsonify({"message": "Sucursal eliminada"}), 200

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
@jwt_required()
def obtener_rooms():
    hotel_id = int(get_jwt_identity())

    # Obtener todas las sucursales de este hotel
    branches = Branches.query.filter_by(hotel_id=hotel_id).all()
    branch_ids = [branch.id for branch in branches]

    # Obtener habitaciones que pertenecen a esas sucursales
    rooms = Room.query.filter(Room.branch_id.in_(branch_ids)).all()
    room_serialize = [room.serialize() for room in rooms]

    return jsonify(room_serialize), 200

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
@api.route('/maintenance', methods=['GET'])
@jwt_required()
def get_maintenance():
    hotel_id = get_jwt_identity()
    
    # Buscar todos los técnicos de mantenimiento asociados al hotel autenticado
    maintenances = Maintenance.query.filter_by(hotel_id=hotel_id).all()
    
    # Verificar si hay registros antes de serializar
    if not maintenances:
        return jsonify({"error": "No hay técnicos de mantenimiento registrados para este hotel"}), 404
    
    return jsonify([maintenance.serialize() for maintenance in maintenances]), 200

@api.route('/maintenance', methods=['POST'])
@jwt_required()
def create_maintenance():
    hotel_id = int(get_jwt_identity())
    data = request.get_json()

    if not data:
        return jsonify({"error": "No se proporcionaron datos"}), 400

    required_fields = ['nombre', 'email', 'password', 'branch_id']
    if not all(field in data and data[field] for field in required_fields):
        return jsonify({"error": "Faltan datos obligatorios"}), 400

    branch = Branches.query.get(data['branch_id'])
    if not branch or branch.hotel_id != hotel_id:
        return jsonify({"error": "Sucursal no encontrada o no pertenece al hotel autenticado"}), 403
    

    nuevo_maint = Maintenance(
        nombre=data['nombre'],
        email=data['email'],
        password=data['password'], 
        hotel_id=hotel_id,  # Muy importante
        branch_id=data['branch_id']
    )

    db.session.add(nuevo_maint)
    db.session.commit()

    return jsonify(nuevo_maint.serialize()), 201


@api.route('/maintenance/<int:id>', methods=['PUT'])
@jwt_required()
def update_maintenance(id):
    hotel_id = int(get_jwt_identity())
    maintenance = Maintenance.query.get_or_404(id)

    print(f"hotel_id token: {hotel_id}")
    print(f"maintenance.hotel_id: {maintenance.hotel_id}")

    if maintenance.hotel_id != hotel_id:
        return jsonify({"error": "No tienes permiso para modificar este técnico"}), 403

    data = request.get_json()
    print(data)

    maintenance.nombre = data.get("nombre", maintenance.nombre)
    maintenance.email = data.get("email", maintenance.email)
    maintenance.password = data.get("password", maintenance.password)
    maintenance.branch_id = data.get("branch_id", maintenance.branch_id)

    db.session.commit()

    return jsonify(maintenance.serialize()), 200


@api.route('/maintenance/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_maintenance(id):
    hotel_id = int(get_jwt_identity())
    maintenance = Maintenance.query.get_or_404(id)

    print(f"hotel_id token: {hotel_id}")
    print(f"maintenance.hotel_id: {maintenance.hotel_id}")

    if maintenance.hotel_id != hotel_id:
        return jsonify({"error": "No tienes permiso para eliminar este técnico"}), 403

    db.session.delete(maintenance)
    db.session.commit()

    return jsonify({"message": "Técnico eliminado con éxito"}), 200


# Ruta para housekepeers

@api.route('/housekeepers', methods=['GET'])
@jwt_required()
def get_housekeepers():
    hotel_id = get_jwt_identity()
    housekeepers = HouseKeeper.query.filter_by(hotel_id=hotel_id).all()
    
    return jsonify([housekeeper.serialize() for housekeeper in housekeepers]), 200

@api.route('/housekeepers/<int:id>', methods=['GET'])
@jwt_required()
def get_housekeeper(id):
    hotel_id = get_jwt_identity()
    housekeeper = HouseKeeper.query.get_or_404(id)

    if housekeeper.hotel_id != hotel_id:
        return jsonify({"error": "No tienes permiso para ver este Housekeeper"}), 403

    return jsonify(housekeeper.serialize()), 200



@api.route('/housekeepers', methods=['POST'])
@jwt_required()
def create_housekeeper():
    hotel_id = int(get_jwt_identity())
    data = request.get_json()
   
    if not data:
        return jsonify({"error": "No se proporcionaron datos"}), 400

    required_fields = ['nombre', 'email', 'password', 'branch_id']
    if not all(field in data and data[field] for field in required_fields):
        return jsonify({"error": "Faltan datos obligatorios"}), 400

    branch = Branches.query.get(data['branch_id'])
    if not branch or branch.hotel_id != hotel_id:
        return jsonify({"error": "Branch not found or does not belong to this hotel"}), 403

    #  Aquí el cambio importante
    new_housekeeper = HouseKeeper(
        nombre=data['nombre'],
        email=data['email'],
        password=data['password'],
        hotel_id=hotel_id,
        id_branche=data['branch_id']  # 👈 adaptado al nombre real del modelo
    )

    db.session.add(new_housekeeper)
    db.session.commit()

    return jsonify(new_housekeeper.serialize()), 201


@api.route('/housekeepers/<int:id>', methods=['PUT'])
@jwt_required()
def update_housekeeper(id):
    hotel_id = get_jwt_identity()
    housekeeper = HouseKeeper.query.get_or_404(id)

    data = request.get_json() 

    print(data)  
    if int(housekeeper.hotel_id) != int(hotel_id):
        return jsonify({"error": "No tienes permiso para modificar este Housekeeper"}), 403

    housekeeper.nombre = data.get('nombre', housekeeper.nombre)
    housekeeper.email = data.get('email', housekeeper.email)
    housekeeper.password = data.get('password', housekeeper.password)
    housekeeper.id_branche = data.get('branch_id', housekeeper.id_branche)  # 👈 Cuidado con la clave

    db.session.commit()

    return jsonify(housekeeper.serialize()), 200


@api.route('/housekeepers/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_housekeeper(id):
    hotel_id = get_jwt_identity()
    housekeeper = HouseKeeper.query.get_or_404(id)

    print(f"hotel_id token: {hotel_id}")
    print(f"housekeeper.hotel_id: {housekeeper.hotel_id}")

    if int(housekeeper.hotel_id) != int(hotel_id):
        return jsonify({"error": "No tienes permiso para eliminar este Housekeeper"}), 403

    db.session.delete(housekeeper)
    db.session.commit()

    return jsonify({"message": "Housekeeper eliminado con éxito"}), 200


# Ruta para obtener las tareas de los trabajadores de mantenimiento
@api.route('/maintenancetasks', methods=['GET'])
@jwt_required()
def get_all_maintenance_tasks():
    hotel_id = int(get_jwt_identity())
    # Se asume que cada tarea de mantenimiento está asociada a un técnico de mantenimiento,
    # y que el técnico tiene el campo hotel_id.
    tasks = MaintenanceTask.query.join(Maintenance).filter(Maintenance.hotel_id == hotel_id).all()
    return jsonify([task.serialize() for task in tasks]), 200

@api.route('/maintenancetasks/<int:id>', methods=['GET'])
def get_maintenance_task(id):

    maintenance_task = MaintenanceTask.query.get(id)
    if not maintenance_task:
        return jsonify({"message": "Tarea de mantenimiento no encontrada"}), 404
    return jsonify(maintenance_task.serialize()), 200

@api.route('/maintenancetasks', methods=['POST'])
@jwt_required()
def create_maintenance_task():
    data = request.get_json()
    hotel_id = int(get_jwt_identity())
    
    # Aquí se podría validar que el mantenimiento (maintenance_id) enviado
    # pertenezca al hotel autenticado:
    maintenance_id = data.get('maintenance_id')
    maintenance = Maintenance.query.get(maintenance_id)
    if not maintenance or maintenance.hotel_id != hotel_id:
        return jsonify({"message": "Maintenance not found or access denied"}), 403

    try:
        new_task = MaintenanceTask(
            nombre=data.get('nombre'),
            image_url=data.get('image_url'),
            condition=data.get('condition'),
            room_id=data.get('room_id'),
            maintenance_id=maintenance_id,
            housekeeper_id=data.get('housekeeper_id'),
            category_id=data.get('category_id')
        )
        db.session.add(new_task)
        db.session.commit()
        return jsonify(new_task.serialize()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Error creating maintenance task", "error": str(e)}), 400

@api.route('/maintenancetasks/<int:id>', methods=['PUT'])
@jwt_required()
def update_maintenance_task(id):
    hotel_id = int(get_jwt_identity())
    maintenance_task = MaintenanceTask.query.get(id)
    if not maintenance_task:
        return jsonify({"message": "Maintenance task not found"}), 404

    # Validar que la tarea pertenezca al hotel autenticado a través del técnico asociado:
    if maintenance_task.maintenance.hotel_id != hotel_id:
        return jsonify({"message": "Access denied"}), 403

    data = request.get_json()
    try:
        maintenance_task.nombre = data.get('nombre', maintenance_task.nombre)
        maintenance_task.image_url = data.get('image_url', maintenance_task.photo)
        maintenance_task.condition = data.get('condition', maintenance_task.condition)
        maintenance_task.room_id = data.get('room_id', maintenance_task.room_id)
        maintenance_task.maintenance_id = data.get('maintenance_id', maintenance_task.maintenance_id)
        maintenance_task.housekeeper_id = data.get('housekeeper_id', maintenance_task.housekeeper_id)
        maintenance_task.category_id = data.get('category_id', maintenance_task.category_id)
        db.session.commit()
        return jsonify(maintenance_task.serialize()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Error updating maintenance task", "error": str(e)}), 400

@api.route('/maintenancetasks/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_maintenance_task(id):
    hotel_id = int(get_jwt_identity())
    maintenance_task = MaintenanceTask.query.get(id)
    if not maintenance_task:
        return jsonify({"message": "Maintenance task not found"}), 404

    if maintenance_task.maintenance.hotel_id != hotel_id:
        return jsonify({"message": "Access denied"}), 403

    try:
        db.session.delete(maintenance_task)
        db.session.commit()
        return jsonify({"message": "Maintenance task deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Error deleting maintenance task", "error": str(e)}), 400



# houseKeeper_task
# Obtener todos los housekeepers_task
@api.route('/housekeeper_tasks', methods=['GET'])
@jwt_required()
def get_all_housekeeper_tasks():
    hotel_id = int(get_jwt_identity())
    # Se asume que cada tarea de housekeeper está asociada a un housekeeper
    # y que el housekeeper tiene el campo hotel_id.
    tasks = HouseKeeperTask.query.join(HouseKeeper).filter(HouseKeeper.hotel_id == hotel_id).all()
    return jsonify([task.serialize() for task in tasks]), 200

@api.route('/housekeeper_task/<int:id>', methods=['PUT'])
@jwt_required()
def update_housekeeper_task(id):
    hotel_id = int(get_jwt_identity())
    task = HouseKeeperTask.query.get(id)
    if not task:
        return jsonify({"error": "HouseKeeperTask not found"}), 404

    # Verificar que el housekeeper asociado a la tarea pertenezca al hotel autenticado
    if task.housekeeper.hotel_id != hotel_id:
        return jsonify({"error": "Access denied"}), 403

    data = request.get_json()
    try:
        if data.get('nombre'):
            task.nombre = data.get('nombre')
        if data.get('image_url'):
            task.image_url = data.get('image_url')
        if data.get('condition'):
            task.condition = data.get('condition')
        if data.get('assignment_date'):
            task.assignment_date = data.get('assignment_date')
        if data.get('submission_date'):
            task.submission_date = data.get('submission_date')
        if data.get('id_room'):
            task.id_room = data.get('id_room')
        if data.get('id_housekeeper'):
            # Verificar que el nuevo housekeeper también pertenezca al hotel autenticado
            new_housekeeper = HouseKeeper.query.get(data.get('id_housekeeper'))
            if not new_housekeeper or new_housekeeper.hotel_id != hotel_id:
                return jsonify({"error": "Access denied for the new housekeeper"}), 403
            task.id_housekeeper = data.get('id_housekeeper')
        db.session.commit()
        return jsonify(task.serialize()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Error updating housekeeper task: {str(e)}"}), 400

@api.route('/housekeeper_task/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_housekeeper_task(id):
    hotel_id = int(get_jwt_identity())
    task = HouseKeeperTask.query.get(id)
    if not task:
        return jsonify({"error": "HouseKeeperTask not found"}), 404

    if task.housekeeper.hotel_id != hotel_id:
        return jsonify({"error": "Access denied"}), 403

    try:
        db.session.delete(task)
        db.session.commit()
        return jsonify({"message": "HouseKeeperTask deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Error deleting housekeeper task: {str(e)}"}), 400

@api.route('/housekeeper_task', methods=['POST'])
@jwt_required()
def create_housekeeper_task():
    data = request.get_json()
    print(data)
    
    # Validar campos requeridos
    required_fields = ['nombre', 'image_url', 'condition', 'assignment_date', 'submission_date', 'id_room', 'id_housekeeper']
    for field in required_fields:
        if not data.get(field):
            return jsonify({"error": f"Missing required data: {field}"}), 400

    # Verificar que el room existe
    room = Room.query.get(data.get('id_room'))
    if not room:
        return jsonify({"error": "Room not found"}), 404

    # Verificar que el housekeeper existe y pertenece al hotel autenticado
    hotel_id = int(get_jwt_identity())
    housekeeper = HouseKeeper.query.get(data.get('id_housekeeper'))
    if not housekeeper or housekeeper.hotel_id != hotel_id:
        return jsonify({"error": "Invalid housekeeper or access denied"}), 403

    # Crear nueva tarea de HouseKeeperTask
    new_task = HouseKeeperTask(
        nombre=data['nombre'],
        image_url=data['image_url'],
        condition=data['condition'],
        assignment_date=data['assignment_date'],
        submission_date=data['submission_date'],
        id_room=data['id_room'],
        id_housekeeper=data['id_housekeeper']
    )

    db.session.add(new_task)
    db.session.commit()

    return jsonify(new_task.serialize()), 201


# READ a single HouseKeeperTask by ID
@api.route('/housekeeper_task/<int:id>', methods=['GET'])
def get_housekeeper_task(id):
    task = HouseKeeperTask.query.get(id)
    
    if task is None:
        return jsonify({"error": "HouseKeeperTask not found"}), 404
    
    return jsonify(task.serialize()), 200

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



@api.route("/loginhotel", methods=["POST"])
def loginhotel():
    email = request.json.get("email", None)
    password = request.json.get("password", None)
    
    hotel = Hoteles.query.filter_by(email=email).first()
    
    if hotel is None or password != hotel.password:
        return jsonify({"msg": "Correo o contraseña incorrectos"}), 401

    # Generar token con "hotel_id"
    access_token = create_access_token(identity=str(hotel.id))  # Convertimos el ID a string
    
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


app.register_blueprint(api, url_prefix='/api')
