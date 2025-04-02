
"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
# Rutas y utilidades propias
from api.utils import generate_sitemap, APIException
from api.models import db, User, Hoteles, Theme, Category, HotelTheme, Branches, Maintenance, HouseKeeper, HouseKeeperTask, MaintenanceTask, Room
from flask_cors import CORS
from flask import Flask, request, jsonify, Blueprint
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity, create_access_token
from werkzeug.security import check_password_hash, generate_password_hash
from datetime import datetime, timedelta, timezone
from api.utils import generate_sitemap, APIException
from sqlalchemy import or_
import jwt
import os
import openai



# Blueprint para los endpoints de la API
api = Blueprint('api', __name__)
app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'tu_clave_secreta'  # Cambia esto por una clave secreta segura
#jwt = JWTManager(app)


SECRET_KEY = "your_secret_key"
# Permitir solicitudes CORS a esta API
CORS(api)

# Clave de OpenAI desde variables de entorno
openai.api_key = os.getenv("OPENAI_API_KEY")

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


# ruta para autenticacion para proteger un hotel
@api.route('/hoteles_by_hotel', methods=['GET'])
@jwt_required()
def obtener_hoteles_by_hotel():
    hotel_email = get_jwt_identity() #obtiene la identidad del usuario desde el token
    print(hotel_email)
    hotel = Hoteles.query.filter_by(email=hotel_email).first()
    print(hotel)  
    hoteles_serialize = hotel.serialize()  # solo uno, ya que el email es unico
    return jsonify(hoteles_serialize), 200  # Retornar los datos serializados como JSON

# ruta para editar un hotel
@api.route("/hoteles_by_hotel", methods=["PUT"])
@jwt_required()
def update_authenticated_hotel():
    email = get_jwt_identity()
    hotel = Hoteles.query.filter_by(email=email).first()

    if not hotel:
        return jsonify({"msg": "Hotel no encontrado"}), 404

    data = request.get_json()
    hotel.nombre = data.get("nombre", hotel.nombre)
    hotel.email = data.get("email", hotel.email)
    hotel.password = data.get("password", hotel.password)

    db.session.commit()
    return jsonify(hotel.serialize()), 200

#ruta para crear un hotel autenticado
@api.route('/hoteles_by_hotel', methods=['POST'])
@jwt_required()
def crear_hotel_desde_hotel_autenticado():
    email = get_jwt_identity()
    hotel_autenticado = Hoteles.query.filter_by(email=email).first()

    if not hotel_autenticado:
        return jsonify({"msg": "Hotel no autorizado"}), 401

    data = request.get_json()

    if "email" not in data or "password" not in data or "nombre" not in data:
        return jsonify({"msg": "Faltan campos obligatorios"}), 400

    if "@" not in data["email"]:
        return jsonify({"msg": "El email debe contener @"}), 400

    existente = Hoteles.query.filter_by(email=data["email"]).first()
    if existente:
        return jsonify({"msg": "Este email ya está registrado"}), 400

    nuevo = Hoteles(
        nombre=data["nombre"],
        email=data["email"],
        password=data["password"]
    )
    db.session.add(nuevo)
    db.session.commit()

    return jsonify(nuevo.serialize()), 201


 #ruta para eliminar un hotel
@api.route("/hoteles_by_hotel", methods=["DELETE"])
@jwt_required()
def delete_authenticated_hotel():
    email = get_jwt_identity()
    hotel = Hoteles.query.filter_by(email=email).first()

    if not hotel:
        return jsonify({"msg": "Hotel no encontrado"}), 404

    db.session.delete(hotel)
    db.session.commit()
    return jsonify({"msg": "Hotel eliminado correctamente"}), 200


# Obtener todos los branches de un hotel
@api.route('/branches_by_hotel', methods=['GET'])
@jwt_required()
def obtener_branches_by_hotel():
    hotel_email = get_jwt_identity() #obtiene la identidad del usuario desde el token
    print(hotel_email)
    hotel=Hoteles.query.filter_by(email=hotel_email).first()
    print(hotel)
    branches = Branches.query.filter_by(hotel_id=hotel.id)  # Obtener todos los branches
    branches_serialize = [branch.serialize() for branch in branches]  # Serializar cada branch
   
    return jsonify(branches_serialize), 200  # Retornar los datos serializados como JS

# Crear una nueva branch (sucursal) para el hotel autenticado
@api.route('/branches_by_hotel', methods=['POST'])
@jwt_required()
def create_branch_by_hotel():
    email = get_jwt_identity()
    hotel = Hoteles.query.filter_by(email=email).first()

    if not hotel:
        return jsonify({"msg": "Hotel no autorizado"}), 401

    data = request.get_json()

    nueva_branch = Branches(
    nombre=data["nombre"],
    direccion=data.get("direccion"),
    latitud=data.get("latitud"),
    longitud=data.get("longitud"),
    hotel_id=hotel.id
)

    db.session.add(nueva_branch)
    db.session.commit()
    return jsonify(nueva_branch.serialize()), 201

@api.route('/branches_by_hotel/<int:id>', methods=['PUT'])
@jwt_required()
def update_branch_by_hotel(id):
    email = get_jwt_identity()
    hotel = Hoteles.query.filter_by(email=email).first()

    if not hotel:
        return jsonify({"msg": "Hotel no autorizado"}), 401

    branch = Branches.query.get(id)
    if not branch or branch.hotel_id != hotel.id:
        return jsonify({"msg": "No autorizado para editar esta sucursal"}), 401

    data = request.get_json()
    branch.nombre = data.get("nombre", branch.nombre)
    branch.direccion = data.get("direccion", branch.direccion)
    branch.latitud = data.get("latitud", branch.latitud)
    branch.longitud = data.get("longitud", branch.longitud)

    db.session.commit()
    return jsonify(branch.serialize()), 200



@api.route('/branches_by_hotel/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_branch_by_hotel(id):
    email = get_jwt_identity()
    hotel = Hoteles.query.filter_by(email=email).first()
    if not hotel:
        return jsonify({"msg": "Hotel no autorizado"}), 401

    branch = Branches.query.get(id)
    if not branch or branch.hotel_id != hotel.id:
        return jsonify({"msg": "No tienes permiso para eliminar esta sucursal"}), 401

    db.session.delete(branch)
    db.session.commit()
    return jsonify({"msg": "Sucursal eliminada correctamente"}), 200

# obtener tecnico del hotel autenticado
@api.route("/maintenance_by_hotel", methods=["GET"])
@jwt_required()
def get_maintenances_by_hotel():
   user_email = get_jwt_identity()
   hotel = Hoteles.query.filter_by(email=user_email).first()


   if not hotel:
        return jsonify({"msg": "Hotel no encontrado"}), 404

   maintenances = Maintenance.query.filter_by(hotel_id=hotel.id).all()
   return jsonify([m.serialize() for m in maintenances]), 200



#crear tecnico (solo el hotel autenticado)

@api.route("/maintenance_by_hotel", methods=["POST"])
@jwt_required()
def create_maintenance():
    data = request.get_json()
    
    user_email = get_jwt_identity()
    hotel = Hoteles.query.filter_by(email=user_email).first()


    if not hotel:
        return jsonify({"msg": "Hotel no encontrado"}), 404

    branch_id = data.get("branch_id")
    branch = Branches.query.get(branch_id)

    if not branch or branch.hotel_id != hotel.id:
        return jsonify({"msg": "Sucursal no válida o no pertenece al hotel"}), 401

    new_maintenance = Maintenance(
    nombre=data["nombre"],
    email=data["email"],
    password=data["password"],
    photo_url=data.get("photo_url"),
    hotel_id=hotel.id,
    branch_id=branch.id
)

    db.session.add(new_maintenance)
    db.session.commit()

    return jsonify(new_maintenance.serialize()), 201


#editar tecnico que so pertenece al hotel
@api.route("/maintenance_by_hotel/<int:id>", methods=["PUT"])
@jwt_required()
def update_maintenance(id):
    user_email = get_jwt_identity()
    hotel = Hoteles.query.filter_by(email=user_email).first()

    data = request.get_json()

    maintenance = Maintenance.query.get(id)
    if not maintenance or maintenance.hotel_id != hotel.id:
        return jsonify({"msg": "Técnico no encontrado o no autorizado"}), 404

    branch_id = data.get("branch_id", maintenance.branch_id)
    branch = Branches.query.get(branch_id)

    if not branch or branch.hotel_id != hotel.id:
        return jsonify({"msg": "Sucursal no válida o no pertenece al hotel"}), 401

    maintenance.nombre = data.get("nombre", maintenance.nombre)
    maintenance.email = data.get("email", maintenance.email)
    maintenance.password = data.get("password", maintenance.password)
    maintenance.photo_url = data.get("photo_url", maintenance.photo_url)
    maintenance.branch_id = branch.id

    db.session.commit()
    return jsonify(maintenance.serialize()), 200


#eliminar tecnico solo si pertenece al hotel

@api.route("/maintenance_by_hotel/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_maintenance(id):
    user_email = get_jwt_identity()
    hotel = Hoteles.query.filter_by(email=user_email).first()


    maintenance = Maintenance.query.get(id)
    if not maintenance or maintenance.hotel_id != hotel.id:
        return jsonify({"msg": "Técnico no encontrado o no autorizado"}), 404

    db.session.delete(maintenance)
    db.session.commit()
    return jsonify({"msg": "Técnico eliminado"}), 200


# obtener Housekeepers del hotel autenticado

@api.route('/housekeepers_by_hotel', methods=['GET'])
@jwt_required()
def get_housekeepers_by_hotel():
    email = get_jwt_identity()
    hotel = Hoteles.query.filter_by(email=email).first()

    if not hotel:
        return jsonify({"msg": "Hotel no autorizado"}), 401

    branches = Branches.query.filter_by(hotel_id=hotel.id).all()
    branch_ids = [b.id for b in branches]

    housekeepers = HouseKeeper.query.filter(HouseKeeper.id_branche.in_(branch_ids)).all()
    return jsonify([h.serialize() for h in housekeepers]), 200

#crear una housekeeper solo para el hotel autenticado

@api.route('/housekeeper_by_hotel', methods=['POST'])
@jwt_required()
def create_housekeeper():
    email = get_jwt_identity()
    hotel = Hoteles.query.filter_by(email=email).first()

    if not hotel:
        return jsonify({"msg": "Hotel no autorizado"}), 401

    data = request.get_json()
    branch = Branches.query.get(data["id_branche"])
    
    if not branch or branch.hotel_id != hotel.id:
        return jsonify({"msg": "No puedes asignar a esta sucursal"}), 401

    nueva = HouseKeeper(
        nombre=data["nombre"],
        email=data["email"],
        password=data["password"],
        id_branche=branch.id,
        photo_url=data.get("photo_url")

    )
    db.session.add(nueva)
    db.session.commit()

    return jsonify(nueva.serialize()), 201

# editar housekeeper solo la sucursal es del hotel autenticado

@api.route('/housekeeper_by_hotel/<int:id>', methods=['PUT'])
@jwt_required()
def update_housekeeper(id):
    email = get_jwt_identity()
    hotel = Hoteles.query.filter_by(email=email).first()

    if not hotel:
        return jsonify({"msg": "Hotel no autorizado"}), 401

    hk = HouseKeeper.query.get(id)
    if not hk:
        return jsonify({"msg": "Housekeeper no encontrada"}), 404

    data = request.get_json()
    new_branche_id = data.get("id_branche")

    # Validar que la nueva sucursal pertenezca al hotel
    branch = Branches.query.get(new_branche_id)
    if not branch or branch.hotel_id != hotel.id:
        return jsonify({"msg": "No tienes permiso para asignar esta sucursal"}), 401

    # Actualizar los campos del housekeeper
    hk.nombre = data.get("nombre", hk.nombre)
    hk.email = data.get("email", hk.email)
    hk.password = data.get("password", hk.password)
    hk.photo_url = data.get("photo_url", hk.photo_url)
    hk.id_branche = new_branche_id  



    db.session.commit()
    return jsonify(hk.serialize()), 200

# eliminar housekeeper solo si pertenece al hotel autenticado

@api.route('/housekeeper_by_hotel/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_housekeeper(id):
    email = get_jwt_identity()
    hotel = Hoteles.query.filter_by(email=email).first()
    if not hotel:
        return jsonify({"msg": "Hotel no autorizado"}), 401

    hk = HouseKeeper.query.get(id)
    if not hk:
        return jsonify({"msg": "Housekeeper no encontrada"}), 404

    branch = Branches.query.get(hk.id_branche)
    if not branch or branch.hotel_id != hotel.id:
        return jsonify({"msg": "No tienes permiso para eliminar esta housekeeper"}), 401

    db.session.delete(hk)
    db.session.commit()
    return jsonify({"msg": "Housekeeper eliminada"}), 200

# obtener todas las habitaciones del hotel autenticado

@api.route('/rooms_by_hotel', methods=['GET'])
@jwt_required()
def get_rooms_by_hotel():
    hotel_email = get_jwt_identity()  # ← esto es un string (email)
    hotel = Hoteles.query.filter_by(email=hotel_email).first()

    if not hotel:
        return jsonify({"msg": "Hotel no autorizado"}), 401

    branches = Branches.query.filter_by(hotel_id=hotel.id).all()
    branch_ids = [b.id for b in branches]

    rooms = Room.query.filter(Room.branch_id.in_(branch_ids)).all()
    # Añadir info de sucursal opcional
    response = []
    for room in rooms:
        room_data = room.serialize()
        branch = Branches.query.get(room.branch_id)
        room_data["sucursal"] = {
            "id": branch.id,
            "nombre": branch.nombre
        } if branch else None
        response.append(room_data)

    return jsonify(response), 200

#crear habitaciones solo en branches del hotel autenticado

@api.route('/rooms_by_hotel', methods=['POST'])
@jwt_required()
def create_room_by_hotel():
    hotel_email = get_jwt_identity()
    hotel = Hoteles.query.filter_by(email=hotel_email).first()

    if not hotel:
        return jsonify({'error': 'Hotel no autorizado'}), 401

    data = request.get_json()
    branch_id = data.get('branch_id')
    nombre = data.get('nombre')

    branch = Branches.query.filter_by(id=branch_id, hotel_id=hotel.id).first()
    if not branch:
        return jsonify({'error': 'La sucursal no pertenece al hotel autenticado'}), 400

    # Validación: no repetir nombre en la misma sucursal
    existing = Room.query.filter_by(nombre=nombre, branch_id=branch.id).first()
    if existing:
        return jsonify({'error': 'Ya existe una habitación con ese nombre en esta sucursal'}), 400

    nueva_room = Room(nombre=nombre, branch_id=branch.id)
    db.session.add(nueva_room)
    db.session.commit()

    return jsonify(nueva_room.serialize()), 201


#crear habitaciones masiva por plantas
@api.route('/bulk_create_rooms', methods=['POST'])
@jwt_required()
def create_multiples_rooms():
    email = get_jwt_identity()
    hotel = Hoteles.query.filter_by(email=email).first()
    if not hotel:
        return jsonify({"msg": "Hotel no autorizado"}), 401

    data = request.get_json()
    branch_id = data.get("branch_id")
    floors = data.get("floors")  # cantidad de plantas
    rooms_per_floor = data.get("rooms_per_floor")  # habitaciones por planta (lista de enteros)

    if not branch_id or not floors or not isinstance(rooms_per_floor, list):
        return jsonify({"msg": "Datos incompletos o incorrectos"}), 400

    branch = Branches.query.get(branch_id)
    if not branch or branch.hotel_id != hotel.id:
        return jsonify({"msg": "Sucursal no válida o no pertenece al hotel"}), 401

    new_rooms = []

    for floor in range(1, floors + 1):
        try:
            count = rooms_per_floor[floor - 1]
        except IndexError:
            count = rooms_per_floor[-1]  # Usar último valor si no hay más definidos

        for i in range(1, count + 1):
            room_number = int(f"{floor}{i:02d}")
            new_room = Room(nombre=str(room_number), branch_id=branch_id)
            db.session.add(new_room)
            new_rooms.append(new_room)

    db.session.commit()

    return jsonify({"msg": f"{len(new_rooms)} habitaciones creadas con éxito", "rooms": [r.serialize() for r in new_rooms]}), 201


#editar habitacion verificando que la branche es del hotel

@api.route('/rooms_by_hotel/<int:room_id>', methods=['PUT'])
@jwt_required()
def update_room_by_hotel(room_id):
    hotel_email = get_jwt_identity()
    hotel = Hoteles.query.filter_by(email=hotel_email).first()

    if not hotel:
        return jsonify({'error': 'Hotel no autorizado'}), 401

    room = Room.query.get_or_404(room_id)

    # Verificar que la habitación pertenece al hotel
    current_branch = Branches.query.filter_by(id=room.branch_id, hotel_id=hotel.id).first()
    if not current_branch:
        return jsonify({'error': 'La habitación no pertenece al hotel autenticado'}), 400

    data = request.get_json()
    new_nombre = data.get('nombre', room.nombre)
    new_branch_id = data.get('branch_id', room.branch_id)

    # Verificar que la nueva sucursal pertenece al hotel
    new_branch = Branches.query.filter_by(id=new_branch_id, hotel_id=hotel.id).first()
    if not new_branch:
        return jsonify({'error': 'La nueva sucursal no pertenece al hotel autenticado'}), 400

    # Validar que no haya otra habitación con ese mismo nombre en esa sucursal
    duplicate = Room.query.filter(
        Room.id != room.id,
        Room.nombre == new_nombre,
        Room.branch_id == new_branch_id
    ).first()
    if duplicate:
        return jsonify({'error': 'Ya existe otra habitación con ese nombre en esta sucursal'}), 400

    # Actualizar
    room.nombre = new_nombre
    room.branch_id = new_branch_id

    db.session.commit()

    return jsonify(room.serialize()), 200



#eliminar habitacion verificando que la branche sea del hotel

@api.route('/rooms_by_hotel/<int:room_id>', methods=['DELETE'])
@jwt_required()
def delete_room_by_hotel(room_id):
    hotel_email = get_jwt_identity()
    hotel = Hoteles.query.filter_by(email=hotel_email).first()

    if not hotel:
        return jsonify({'error': 'Hotel no autorizado'}), 401

    room = Room.query.get_or_404(room_id)
    branch = Branches.query.filter_by(id=room.branch_id, hotel_id=hotel.id).first()

    if not branch:
        return jsonify({'error': 'La habitación no pertenece al hotel autenticado'}), 400

    db.session.delete(room)
    db.session.commit()

    return jsonify({'message': 'Habitación eliminada correctamente'}), 200



#obtener todas las tareas del hotel autenticado

@api.route('/housekeeper_tasks_by_hotel', methods=['GET'])
@jwt_required()
def get_housekeeper_tasks_by_hotel():
    email = get_jwt_identity()
    hotel = Hoteles.query.filter_by(email=email).first()
    

    if not hotel:
        return jsonify({"msg": "Hotel no autorizado"}), 401

    branches = Branches.query.filter_by(hotel_id=hotel.id).all()
    branch_ids = [b.id for b in branches]
   
    housekeepers = HouseKeeper.query.filter(HouseKeeper.id_branche.in_(branch_ids)).all()
    housekeeper_ids = [h.id for h in housekeepers]
    
    rooms = Room.query.filter(Room.branch_id.in_(branch_ids)).all()
    room_ids = [r.id for r in rooms]
    

    tasks = HouseKeeperTask.query.filter(
        HouseKeeperTask.id_housekeeper.in_(housekeeper_ids),
        db.or_(
            HouseKeeperTask.id_room == None,
            HouseKeeperTask.id_room.in_(room_ids)
        )
    ).all()

    print("Tareas encontradas:", [t.serialize() for t in tasks])

    return jsonify([t.serialize() for t in tasks]), 200



# crear tareas de housekeeper 

@api.route('/housekeeper_tasks_by_hotel', methods=['POST'])
@jwt_required()
def create_housekeeper_task_by_hotel():
    email = get_jwt_identity()
    hotel = Hoteles.query.filter_by(email=email).first()
    if not hotel:
        return jsonify({"msg": "Hotel no autorizado"}), 401

    data = request.get_json()

    required_fields = ["nombre", "condition", "assignment_date", "submission_date", "id_housekeeper"]
    if not all(field in data for field in required_fields):
        return jsonify({"msg": "Faltan campos obligatorios"}), 400

    # Verificamos que la camarera pertenezca al hotel autenticado (por medio de su sucursal)
    housekeeper = HouseKeeper.query.get(data["id_housekeeper"])
    if not housekeeper:
        return jsonify({"msg": "Camarera no encontrada"}), 404

    # Verificamos que la sucursal de la camarera pertenezca al hotel
    if not housekeeper.branches or housekeeper.branches.hotel_id != hotel.id:
        return jsonify({"msg": "La camarera no pertenece al hotel"}), 401

    # Verificamos si hay room_id
    room_id = data.get("id_room")
    if room_id:
        room = Room.query.get(room_id)
        if not room or room.branch.hotel_id != hotel.id:
            return jsonify({"msg": "Habitación no pertenece al hotel"}), 401
    else:
        room = None

    new_task = HouseKeeperTask(
        nombre=data["nombre"],
        photo_url=data.get("photo_url"),
        condition=data["condition"],
        assignment_date=data["assignment_date"],
        submission_date=data["submission_date"],
        id_room=room_id,  # puede ser None (zona común)
        id_housekeeper=data["id_housekeeper"]
    )

    db.session.add(new_task)
    db.session.commit()

    return jsonify(new_task.serialize()), 201



#editar tareas de housekeeper

@api.route('/housekeeper_tasks_by_hotel/<int:id>', methods=['PUT'])
@jwt_required()
def update_housekeeper_task_by_hotel(id):
    email = get_jwt_identity()
    hotel = Hoteles.query.filter_by(email=email).first()
    if not hotel:
        return jsonify({"msg": "Hotel no autorizado"}), 401

    task = HouseKeeperTask.query.get(id)
    if not task:
        return jsonify({"msg": "Tarea no encontrada"}), 404

    # Validar que la camarera pertenece a una sucursal del hotel
    housekeepers = HouseKeeper.query.join(Branches).filter(Branches.hotel_id == hotel.id).all()
    housekeeper_ids = [h.id for h in housekeepers]

    if task.id_housekeeper not in housekeeper_ids:
        return jsonify({"msg": "Tarea no pertenece al hotel"}), 401

    data = request.get_json()

    # Si se proporciona id_room, validamos que la habitación también sea del hotel
    if data.get('id_room'):
        room = Room.query.get(data['id_room'])
        if not room or room.branch.hotel_id != hotel.id:
            return jsonify({"msg": "La habitación no pertenece al hotel"}), 401
        task.id_room = data['id_room']
    else:
        task.id_room = None  # zona común

    # Actualizar campos permitidos
    task.nombre = data.get('nombre', task.nombre)
    task.photo_url = data.get('photo_url', task.photo_url)
    task.condition = data.get('condition', task.condition)
    task.assignment_date = data.get('assignment_date', task.assignment_date)
    task.submission_date = data.get('submission_date', task.submission_date)

    db.session.commit()
    return jsonify(task.serialize()), 200


#eliminar traeas de housekeeper

@api.route('/housekeeper_tasks_by_hotel/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_housekeeper_task_by_hotel(id):
    email = get_jwt_identity()
    hotel = Hoteles.query.filter_by(email=email).first()
    if not hotel:
        return jsonify({"msg": "Hotel no autorizado"}), 401

    task = HouseKeeperTask.query.get(id)
    if not task:
        return jsonify({"msg": "Tarea no encontrada"}), 404

    # Validar que la camarera asociada pertenece al hotel autenticado
    housekeepers = HouseKeeper.query.join(Branches).filter(Branches.hotel_id == hotel.id).all()
    housekeeper_ids = [h.id for h in housekeepers]

    if task.id_housekeeper not in housekeeper_ids:
        return jsonify({"msg": "No tienes permiso para eliminar esta tarea"}), 401

    db.session.delete(task)
    db.session.commit()
    return jsonify({"msg": "Tarea eliminada correctamente"}), 200



@api.route('/bulk_create_housekeeper_tasks', methods=['POST'])
@jwt_required()
def bulk_create_housekeeper_tasks():
    email = get_jwt_identity()
    hotel = Hoteles.query.filter_by(email=email).first()

    if not hotel:
        return jsonify({"msg": "Hotel no autorizado"}), 401

    data = request.get_json()
    tasks = data.get("tasks")

    if not isinstance(tasks, list) or not tasks:
        return jsonify({"msg": "Lista de tareas no válida"}), 400

    created_tasks = []

    for task_data in tasks:
        nombre = task_data.get("nombre")
        photo_url = task_data.get("photo_url", "")
        condition = task_data.get("condition", "PENDIENTE")
        assignment_date = task_data.get("assignment_date")
        submission_date = task_data.get("submission_date")
        id_room = task_data.get("id_room")
        id_housekeeper = task_data.get("id_housekeeper")

        if not all([nombre, assignment_date, submission_date, id_room, id_housekeeper]):
            continue

        # Verificar que la camarera pertenece a una sucursal del hotel
        housekeeper = HouseKeeper.query.get(id_housekeeper)
        if not housekeeper or not housekeeper.branches or housekeeper.branches.hotel_id != hotel.id:
            continue

        # Verificar que la habitación pertenece a una sucursal del hotel
        room = Room.query.get(id_room)
        if not room or room.branch.hotel_id != hotel.id:
            continue

        nueva_tarea = HouseKeeperTask(
            nombre=nombre,
            photo_url=photo_url,
            condition=condition,
            assignment_date=assignment_date,
            submission_date=submission_date,
            id_room=id_room,
            id_housekeeper=id_housekeeper
        )
        db.session.add(nueva_tarea)
        created_tasks.append(nueva_tarea)

    db.session.commit()

    return jsonify({
        "msg": f"{len(created_tasks)} tareas creadas con éxito.",
        "tareas": [t.serialize() for t in created_tasks]
    }), 201

# recibir multiples habitaciones para la misma tareas de limpieza

@api.route('/bulk_housekeeper_tasks', methods=['POST'])
@jwt_required()
def create_bulk_housekeeper_tasks():
    email = get_jwt_identity()
    hotel = Hoteles.query.filter_by(email=email).first()
    if not hotel:
        return jsonify({"msg": "No autorizado"}), 401

    data = request.get_json()
    nombre = data.get("nombre")
    photo_url = data.get("photo_url")
    condition = data.get("condition", "PENDIENTE")
    assignment_date = data.get("assignment_date")
    submission_date = data.get("submission_date")
    id_housekeeper = data.get("id_housekeeper")
    room_ids = data.get("room_ids", [])  # lista de habitaciones

    housekeeper = HouseKeeper.query.get(id_housekeeper)
    if not housekeeper or housekeeper.branches.hotel_id != hotel.id:
        return jsonify({"msg": "Camarera no válida o no pertenece al hotel"}), 401

    created_tasks = []
    for room_id in room_ids:
        room = Room.query.get(room_id)
        if room and room.branch.hotel_id == hotel.id:
            new_task = HouseKeeperTask(
                nombre=nombre,
                photo_url=photo_url,
                condition=condition,
                assignment_date=assignment_date,
                submission_date=submission_date,
                id_housekeeper=id_housekeeper,
                id_room=room_id
            )
            db.session.add(new_task)
            created_tasks.append(new_task)

    db.session.commit()
    return jsonify({"msg": f"{len(created_tasks)} tareas creadas", "tasks": [t.serialize() for t in created_tasks]}), 201


#obtener tareas de maintenance

@api.route('/maintenancetask_by_hotel', methods=['GET'])
@jwt_required()
def get_maintenance_tasks_by_hotel():
    email = get_jwt_identity()
    hotel = Hoteles.query.filter_by(email=email).first()
    if not hotel:
        return jsonify({"msg": "Hotel no autorizado"}), 401

    # Obtener IDs de todas las sucursales del hotel
    branch_ids = [b.id for b in Branches.query.filter_by(hotel_id=hotel.id).all()]

    # Obtener IDs de habitaciones de esas sucursales
    room_ids = [r.id for r in Room.query.filter(Room.branch_id.in_(branch_ids)).all()]

    # Obtener IDs de técnicos del hotel
    tech_ids = [t.id for t in Maintenance.query.filter_by(hotel_id=hotel.id).all()]

    # Filtrar tareas por técnicos del hotel o por habitaciones del hotel
    tasks = MaintenanceTask.query.filter(
        (MaintenanceTask.maintenance_id.in_(tech_ids)) |
        ((MaintenanceTask.room_id != None) & (MaintenanceTask.room_id.in_(room_ids)))
    ).all()

    return jsonify([t.serialize() for t in tasks]), 200




# crear tareas de mantenimiento

@api.route('/maintenancetask_by_hotel', methods=['POST'])
@jwt_required()
def create_maintenance_task_by_hotel():
    email = get_jwt_identity()
    hotel = Hoteles.query.filter_by(email=email).first()
    if not hotel:
        return jsonify({"msg": "Hotel no autorizado"}), 401

    data = request.get_json()

    # Validación básica
    if 'nombre' not in data or 'condition' not in data or 'maintenance_id' not in data:
        return jsonify({"msg": "Faltan campos obligatorios"}), 400

    room_id = data.get('room_id')  # puede ser None si es zona común

    # Verificar si hay room_id
    if room_id:
        room = Room.query.get(room_id)
        if not room or room.branch.hotel_id != hotel.id:
            return jsonify({"msg": "Habitación no pertenece al hotel"}), 401

    # Verificar técnico
    technician = Maintenance.query.get(data['maintenance_id'])
    if not technician or technician.hotel_id != hotel.id:
        return jsonify({"msg": "Técnico no pertenece al hotel"}), 401

    new_task = MaintenanceTask(
        nombre=data['nombre'],
        photo_url=data.get('photo_url'),
        condition=data['condition'],
        room_id=room_id,  # puede ser None
        maintenance_id=data['maintenance_id']
    )

    db.session.add(new_task)
    db.session.commit()
    return jsonify(new_task.serialize()), 201


#  Editar tarea de mantenimiento (solo si pertenece al hotel autenticado)
@api.route('/maintenancetask_by_hotel/<int:id>', methods=['PUT'])
@jwt_required()
def update_maintenance_task_by_hotel(id):
    email = get_jwt_identity()
    hotel = Hoteles.query.filter_by(email=email).first()
    if not hotel:
        return jsonify({"msg": "Hotel no autorizado"}), 401

    task = MaintenanceTask.query.get(id)
    if not task:
        return jsonify({"msg": "Tarea no encontrada"}), 404

    # Verificar que el técnico pertenece al hotel
    technician = Maintenance.query.get(task.maintenance_id)
    if not technician or technician.hotel_id != hotel.id:
        return jsonify({"msg": "Tarea no pertenece al hotel"}), 401

    data = request.get_json()
    task.nombre = data.get('nombre', task.nombre)
    task.condition = data.get('condition', task.condition)
    task.photo_url = data.get('photo_url', task.photo_url)
    task.room_id = data.get('room_id', task.room_id)

    db.session.commit()
    return jsonify(task.serialize()), 200




#eliminar tareas de maintenance

@api.route('/maintenancetask_by_hotel/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_maintenance_task_by_hotel(id):
    email = get_jwt_identity()
    hotel = Hoteles.query.filter_by(email=email).first()
    if not hotel:
        return jsonify({"msg": "Hotel no autorizado"}), 401

    task = MaintenanceTask.query.get(id)
    if not task:
        return jsonify({"msg": "Tarea no encontrada"}), 404

    technician = Maintenance.query.get(task.maintenance_id)
    if not technician or technician.hotel_id != hotel.id:
        return jsonify({"msg": "No tienes permiso para eliminar esta tarea"}), 401

    db.session.delete(task)
    db.session.commit()
    return jsonify({"msg": "Tarea eliminada correctamente"}), 200


# ruta para que cuando selecione la tarea de housekeeper traiga solamente las habitaciones dela branche que ella pertenece

@api.route('/rooms_by_housekeeper/<int:housekeeper_id>', methods=['GET'])
@jwt_required()
def get_rooms_by_housekeeper(housekeeper_id):
    email = get_jwt_identity()
    hotel = Hoteles.query.filter_by(email=email).first()
    if not hotel:
        return jsonify({"msg": "Hotel no autorizado"}), 401

    housekeeper = HouseKeeper.query.get(housekeeper_id)
    if not housekeeper or not housekeeper.branches or housekeeper.branches.hotel_id != hotel.id:
        return jsonify({"msg": "No autorizado para ver las habitaciones de esta housekeeper"}), 401

    rooms = Room.query.filter_by(branch_id=housekeeper.id_branche).all()
    return jsonify([room.serialize() for room in rooms]), 200

# ruta para que cuando selecione la sucursal traiga solo las habitaciones de esa sucursal
@api.route('/rooms_by_branch/<int:branch_id>', methods=['GET'])
@jwt_required()
def get_rooms_by_branch(branch_id):
    email = get_jwt_identity()
    hotel = Hoteles.query.filter_by(email=email).first()
    branch = Branches.query.get(branch_id)
    if not branch or branch.hotel_id != hotel.id:
        return jsonify({"msg": "Sucursal no autorizada"}), 401

    rooms = Room.query.filter_by(branch_id=branch_id).all()
    return jsonify([r.serialize() for r in rooms]), 200




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

# rutas para hotel theme

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

# login housekeeper
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
      'exp': datetime.now(timezone.utc) + timedelta(hours=5)
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
        return jsonify({"error": "Invalid maintenance credentials"}), 401

    if maintenance.password != password:
        return jsonify({"error": "Invalid password"}), 401

    token = jwt.encode({
        'maintenance_id': maintenance.id,
        'exp': datetime.now(timezone.utc) + timedelta(hours=5)
    }, SECRET_KEY, algorithm='HS256')

    return jsonify({'token': token}), 200


# CREATE a new HouseKeeperTask (with improved photo handling)
@api.route('/housekeeper_task', methods=['POST'])
def create_housekeeper_task():
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['nombre', 'condition', 'assignment_date', 'submission_date', 'id_housekeeper']
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required data"}), 400

    # Check if housekeeper exists
    housekeeper = HouseKeeper.query.get(data.get('id_housekeeper'))
    if not housekeeper:
        return jsonify({"error": "Invalid housekeeper ID"}), 404

    # Check room if provided
    if 'id_room' in data:
        room = Room.query.get(data.get('id_room'))
        if not room:
            return jsonify({"error": "Invalid room ID"}), 404

    # Validate condition
    if data['condition'] not in ['PENDIENTE', 'EN PROCESO', 'FINALIZADA']:
        return jsonify({"error": "Invalid condition value"}), 400

    # Create new task
    new_task = HouseKeeperTask(
        nombre=data['nombre'],
        photo_url=data.get('photo_url'),  # Optional field
        condition=data['condition'],
        assignment_date=data['assignment_date'],
        submission_date=data['submission_date'],
        id_room=data.get('id_room'),
        id_housekeeper=data['id_housekeeper']
    )

    db.session.add(new_task)
    db.session.commit()

    return jsonify(new_task.serialize()), 201

# GET all HouseKeeperTasks with filtering
@api.route('/housekeeper_tasks', methods=['GET'])
def get_all_housekeeper_tasks():
    # Get query parameters
    status = request.args.get('condition')  # Changed to 'condition' to match field name
    housekeeper_id = request.args.get('housekeeper_id', type=int)
    room_id = request.args.get('room_id', type=int)
    
    # Start query
    query = HouseKeeperTask.query
    
    # Apply filters if provided
    if status:
        query = query.filter_by(condition=status)
    if housekeeper_id:
        query = query.filter_by(id_housekeeper=housekeeper_id)
    if room_id:
        query = query.filter_by(id_room=room_id)
    
    tasks = query.all()
    return jsonify([task.serialize() for task in tasks]), 200

# GET single HouseKeeperTask
@api.route('/housekeeper_task/<int:id>', methods=['GET'])
def get_housekeeper_task(id):
    task = HouseKeeperTask.query.get(id)
    if not task:
        return jsonify({"error": "HouseKeeperTask not found"}), 404
    return jsonify(task.serialize()), 200

# UPDATE HouseKeeperTask (full implementation)
@api.route('/housekeeper_task/<int:id>', methods=['PUT'])
def update_housekeeper_task(id):
    task = HouseKeeperTask.query.get(id)
    if not task:
        return jsonify({"error": "HouseKeeperTask not found"}), 404
    
    data = request.get_json()

    # Update fields
    if 'nombre' in data:
        task.nombre = data['nombre']
    if 'photo_url' in data:
        task.photo_url = data['photo_url'] if data['photo_url'] else None
    if 'condition' in data:
        if data['condition'] not in ['PENDIENTE', 'EN PROCESO', 'FINALIZADA']:
            return jsonify({"error": "Invalid condition value"}), 400
        task.condition = data['condition']
    if 'assignment_date' in data:
        task.assignment_date = data['assignment_date']
    if 'submission_date' in data:
        task.submission_date = data['submission_date']
    if 'id_room' in data:
        if data['id_room']:
            room = Room.query.get(data['id_room'])
            if not room:
                return jsonify({"error": "Invalid room ID"}), 404
        task.id_room = data['id_room']
    if 'id_housekeeper' in data:
        housekeeper = HouseKeeper.query.get(data['id_housekeeper'])
        if not housekeeper:
            return jsonify({"error": "Invalid housekeeper ID"}), 404
        task.id_housekeeper = data['id_housekeeper']

    db.session.commit()
    return jsonify(task.serialize()), 200

# DELETE HouseKeeperTask
@api.route('/housekeeper_task/<int:id>', methods=['DELETE'])
def delete_housekeeper_task(id):
    task = HouseKeeperTask.query.get(id)
    if not task:
        return jsonify({"error": "HouseKeeperTask not found"}), 404
    
    db.session.delete(task)
    db.session.commit()
    return jsonify({"message": "HouseKeeperTask deleted successfully"}), 200

# Mark task as completed (updated)
@api.route('/housekeeper_task/mark_completed/<int:id>', methods=['PUT'])
def mark_task_completed(id):
    task = HouseKeeperTask.query.get(id)
    if not task:
        return jsonify({"error": "HouseKeeperTask not found"}), 404
    
    task.condition = 'FINALIZADA'
    task.submission_date = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    db.session.commit()
    return jsonify(task.serialize()), 200

#nueva ruta para tecnico logueado

@api.route('/maintenancetasks_by_branch', methods=['GET'])
def get_maintenancetasks_by_branch():
    token = request.headers.get('Authorization', None)
    if not token:
        return jsonify({"msg": "Token requerido"}), 401
    
    try:
        token = token.replace("Bearer ", "")
        decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        maintenance_id = decoded.get('maintenance_id')
    except Exception as e:
        return jsonify({"msg": "Token inválido", "error": str(e)}), 401

    maintenance = Maintenance.query.get(maintenance_id)
    if not maintenance:
        return jsonify({"msg": "Técnico no encontrado"}), 404

    branch_id = maintenance.branch_id
    rooms = Room.query.filter_by(branch_id=branch_id).all()
    room_ids = [r.id for r in rooms]

    tasks = MaintenanceTask.query.filter(
        or_(
            MaintenanceTask.room_id.in_(room_ids),
            MaintenanceTask.room_id == None
        )
    ).all()

    return jsonify([t.serialize() for t in tasks]), 200




@api.route('/maintenancetasks', methods=['GET'])
def get_all_maintenance_tasks():
    """Obtener todas las tareas de mantenimiento"""
    maintenance_tasks = MaintenanceTask.query.all()
    return jsonify([task.serialize() for task in maintenance_tasks]), 200



@api.route('/maintenancetasks/filter', methods=['GET'])
def get_maintenance_tasks_filtered():
    """Obtener tareas de mantenimiento filtradas por housekeeper_id y room_id"""
    
    # Obtenemos los parámetros de la query string
    housekeeper_id = request.args.get('housekeeper_id', type=int)  # El id del housekeeper
    room_id = request.args.get('room_id', type=int)  # El id de la habitación
    
    # Verificamos si se proporciona al menos un parámetro para filtrar
    if not housekeeper_id and not room_id:
        return jsonify({"message": "Se requiere al menos housekeeper_id o room_id para filtrar."}), 400
    
    # Iniciamos la consulta
    query = MaintenanceTask.query
    
    # Filtramos por housekeeper_id si está presente
    if housekeeper_id:
        query = query.filter(MaintenanceTask.housekeeper_id == housekeeper_id)
    
    # Filtramos por room_id si está presente
    if room_id:
        query = query.filter(MaintenanceTask.room_id == room_id)
    
    # Obtenemos las tareas filtradas
    maintenance_tasks = query.all()
    
    # Devolvemos las tareas en formato JSON
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
    """Crear una nueva tarea de mantenimiento"""
    data = request.get_json()

    try:
        nombre = data.get('nombre')
        photo_url = data.get('photo_url', None)  # Cambiado a photo_url para coincidir con el modelo
        condition = data.get('condition', 'PENDIENTE')
        room_id = data.get('room_id', None)
        maintenance_id = data.get('maintenance_id', None)
        housekeeper_id = data.get('housekeeper_id', None)
        category_id = data.get('category_id', None)

        if condition not in ['PENDIENTE', 'EN PROCESO', 'FINALIZADA']:
            return jsonify({"message": "Estado no válido"}), 400

        new_task = MaintenanceTask(
            nombre=nombre,
            photo_url=photo_url,  # Usando photo_url
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
        # Actualización condicional de campos
        if 'nombre' in data:
            maintenance_task.nombre = data['nombre']
            
        # Manejo mejorado de la foto - siempre actualizar si viene en el request
        if 'photo_url' in data:
            maintenance_task.photo_url = data['photo_url'] if data['photo_url'] else None
            
        # Manejo robusto del campo condition
        if 'condition' in data:
            new_condition = data['condition']
            if new_condition not in ['PENDIENTE', 'EN PROCESO', 'FINALIZADA']:
                return jsonify({"message": "Estado no válido. Valores permitidos: PENDIENTE, EN PROCESO, FINALIZADA"}), 400
            maintenance_task.condition = new_condition

        # Campos opcionales (solo actualizar si vienen en el request)
        optional_fields = ['room_id', 'maintenance_id', 'housekeeper_id', 'category_id']
        for field in optional_fields:
            if field in data:
                setattr(maintenance_task, field, data[field])

        # Forzar la actualización del timestamp (si tu modelo lo tiene)
        if hasattr(maintenance_task, 'updated_at'):
            maintenance_task.updated_at = datetime.utcnow()

        db.session.commit()

        return jsonify({
            "message": "Tarea actualizada exitosamente",
            "task": maintenance_task.serialize()
        }), 200

    except IntegrityError as e:
        db.session.rollback()
        return jsonify({
            "message": "Error de integridad en la base de datos",
            "error": str(e.orig)
        }), 400
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "message": "Error al actualizar la tarea",
            "error": str(e)
        }), 400


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
    

@app.route('/api/creartarea', methods=['POST'])
def create_maintenance_task_v2():
    data = request.get_json()

    # Validación básica de datos
    if not data.get('nombre'):
        return jsonify({"message": "El nombre de la tarea es obligatorio"}), 400
    if not data.get('room_id'):
        return jsonify({"message": "La habitación es obligatoria"}), 400
    if not data.get('housekeeper_id'):
        return jsonify({"message": "El ID del housekeeper es obligatorio"}), 400

    # Si no hay foto, establecemos photo_url como None
    # photo_url = data.get('photo_url', None)

    try:
        # Crear la tarea de mantenimiento
        new_task = MaintenanceTask(
            nombre=data['nombre'],
            room_id=data['room_id'],
            housekeeper_id=data['housekeeper_id'],
            # photo_url=photo_url
        )
        db.session.add(new_task)
        db.session.commit()

        return jsonify(new_task.serialize()), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Error al crear la tarea de mantenimiento", "error": str(e)}), 400




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

@api.route("/datos_by_hotel", methods=["GET"])
@jwt_required()
def get_hotel_datos():
    try:
        hotel_email = get_jwt_identity()
        hotel = Hoteles.query.filter_by(email=hotel_email).first()

        if not hotel:
            return jsonify({"msg": "Hotel no autorizado"}), 401

        hotel_id = hotel.id

        num_sucursales = Branches.query.filter_by(hotel_id=hotel_id).count()
        
        # Para contar camareras, primero obtén las branches del hotel
        branch_ids = [b.id for b in Branches.query.filter_by(hotel_id=hotel_id).all()]
        num_camareras = HouseKeeper.query.filter(HouseKeeper.id_branche.in_(branch_ids)).count()

        num_tecnicos = Maintenance.query.filter_by(hotel_id=hotel_id).count()
        num_habitaciones = Room.query.filter(Room.branch_id.in_(branch_ids)).count()

        num_tareas_limpieza = HouseKeeperTask.query.join(HouseKeeper).filter(
            HouseKeeper.id_branche.in_(branch_ids)
        ).count()

        num_tareas_mantenimiento = MaintenanceTask.query.join(Maintenance).filter(
            Maintenance.hotel_id == hotel_id
        ).count()

        num_incidencias = MaintenanceTask.query.filter(MaintenanceTask.condition != "FINALIZADA").count()

        return jsonify({
            "sucursales": num_sucursales,
            "camareras": num_camareras,
            "tecnicos": num_tecnicos,
            "habitaciones": num_habitaciones,
            "tareasLimpieza": num_tareas_limpieza,
            "tareasMantenimiento": num_tareas_mantenimiento,
            "incidencias": num_incidencias
        }), 200

    except Exception as e:
        print("Error en /datos_by_hotel:", e)
        return jsonify({"msg": "Error interno", "error": str(e)}), 500

