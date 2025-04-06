from flask_sqlalchemy import SQLAlchemy
import datetime


db = SQLAlchemy()


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(80), nullable=False)
    is_active = db.Column(db.Boolean(), default=True, nullable=False)
    theme = db.Column(db.String(120), unique=True, nullable=False)

    def __repr__(self):
        return f'<User {self.id}>'

    def serialize(self):
        return {
            "id": self.id,
            "email": self.email,
        }

class Hoteles(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(120), unique=True, nullable=False)
    email = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(80), nullable=False)

    def __repr__(self):
        return f'<Hoteles {self.nombre}>'

    def serialize(self):
        return {
            "id": self.id,
            "nombre": self.nombre,
            "email": self.email,
            "password": self.password
        }

class Theme(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(120), unique=True, nullable=False)

    def __repr__(self):
        return f'<Theme {self.id}>'

    def serialize(self):
        return {
            "id": self.id,
            "nombre": self.nombre,
        }

class HotelTheme(db.Model):
    __tablename__ = 'hoteltheme'
    id = db.Column(db.Integer, primary_key=True)
    id_hoteles = db.Column(db.Integer, db.ForeignKey('hoteles.id'), nullable=True)
    id_theme = db.Column(db.Integer, db.ForeignKey('theme.id'), nullable=True)

    hoteles = db.relationship('Hoteles', backref='hoteltheme')
    theme = db.relationship('Theme', backref='hoteltheme')

    def __repr__(self):
        return f'<HotelTheme {self.id}>'

    def serialize(self):
        return {
            "id": self.id,
            "id_hoteles": self.id_hoteles,
            "id_theme": self.id_theme
        }


class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(120), nullable=False)

    def __repr__(self):
        return f'<Category {self.nombre}>'

    def serialize(self):
        return {
            "id": self.id,
            "nombre": self.nombre
        }


class Branches(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(120), nullable=False)
    direccion = db.Column(db.String(120), nullable=False)
    longitud = db.Column(db.Float, nullable=True)
    latitud = db.Column(db.Float, nullable=True)
    hotel_id = db.Column(db.Integer, db.ForeignKey('hoteles.id'), nullable=False)

    hotel = db.relationship("Hoteles")

    def __repr__(self):
        return f'<Branches {self.nombre}>'

    def serialize(self):
        return {
            "id": self.id,
            "nombre": self.nombre,
            "direccion": self.direccion,
            "longitud": self.longitud,
            "latitud": self.latitud,
            "hotel_id": self.hotel_id
        }


class Room(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(120), nullable=False)
    branch_id = db.Column(db.Integer, db.ForeignKey('branches.id'), nullable=False)

    branch = db.relationship("Branches")
    maintenance_tasks = db.relationship("MaintenanceTask", back_populates="room", cascade="all, delete-orphan")
    housekeeper_tasks = db.relationship("HouseKeeperTask", back_populates="room", cascade="all, delete-orphan")

    def __repr__(self):
        return f'<Room {self.nombre}>'

    def serialize(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'branch_id': self.branch_id,
            'branch': self.branch.nombre if self.branch else None
        }


class Maintenance(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(80), nullable=False)
    photo_url = db.Column(db.String(300), nullable=True)
    hotel_id = db.Column(db.Integer, db.ForeignKey('hoteles.id'), nullable=False)
    branch_id = db.Column(db.Integer, db.ForeignKey('branches.id'), nullable=False)

    hotel = db.relationship('Hoteles')
    branch = db.relationship('Branches')

    def __repr__(self):
        return f'<Maintenance {self.nombre}>'

    def serialize(self):
        return {
            "id": self.id,
            "nombre": self.nombre,
            "email": self.email,
            "password": self.password,
            "photo_url": self.photo_url,
            "hotel_id": self.hotel_id,
            "hotel": self.hotel.nombre if self.hotel else None,
            "branch_id": self.branch_id,
            "branch_nombre": self.branch.nombre if self.branch else None
        }


class HouseKeeper(db.Model):
    __tablename__ = 'housekeeper'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(120), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(80), nullable=False)
    photo_url = db.Column(db.String(300), nullable=True)
    id_branche = db.Column(db.Integer, db.ForeignKey('branches.id'), nullable=True)
   

    branches = db.relationship('Branches')

    def __repr__(self):
        return f'<HouseKeeper {self.id}>'

    def serialize(self):
        return {
            "id": self.id,
            "nombre": self.nombre,
            "email": self.email,
            "password": self.password,
            "photo_url": self.photo_url,
            "id_branche": self.id_branche,
            "branch_nombre": self.branches.nombre if self.branches else None,
           
        }

class HouseKeeperTask(db.Model):
    __tablename__ = 'housekeepertask'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(120), nullable=False)
    photo_url = db.Column(db.String(500), nullable=True)
    condition = db.Column(db.String(80), nullable=False, default='PENDIENTE')
    assignment_date = db.Column(db.String(80), nullable=False)
    submission_date = db.Column(db.String(80), nullable=False)
    id_room = db.Column(db.Integer, db.ForeignKey('room.id'), nullable=True)
    id_housekeeper = db.Column(db.Integer, db.ForeignKey('housekeeper.id'), nullable=True)
    nota_housekeeper = db.Column(db.String(500))  # nuevo campo para observaciones

    room = db.relationship('Room', back_populates='housekeeper_tasks')
    housekeeper = db.relationship('HouseKeeper', backref='housekeepertask')

    def __repr__(self):
        return f'<HouseKeeperTask {self.id}>'

    def serialize(self):
        return {
            "id": self.id,
            "nombre": self.nombre,
            "photo_url": self.photo_url if self.photo_url else None,
            "condition": self.condition,
            "assignment_date": self.assignment_date,
            "submission_date": self.submission_date,
            "id_room": self.id_room,
            "room_nombre": self.room.nombre if self.room else None,
            "room_branch_id": self.room.branch_id if self.room else None,
            "room_branch_nombre": self.room.branch.nombre if self.room and self.room.branch else None,
            "id_housekeeper": self.id_housekeeper,
            "housekeeper_nombre": self.housekeeper.nombre if self.housekeeper else None,
            "nota_housekeeper": self.nota_housekeeper,
        }


class MaintenanceTask(db.Model):
    __tablename__ = 'maintenancetask'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(120), nullable=False)
    photo_url = db.Column(db.String(500), nullable=True)
    condition = db.Column(db.String(120), nullable=True)
    room_id = db.Column(db.Integer, db.ForeignKey('room.id'), nullable=True)
    maintenance_id = db.Column(db.Integer, db.ForeignKey('maintenance.id'), nullable=True)
    housekeeper_id = db.Column(db.Integer, db.ForeignKey('housekeeper.id'), nullable=True)
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    finalizado_por = db.Column(db.String(120), nullable=True)



    room = db.relationship('Room', back_populates='maintenance_tasks')
    maintenance = db.relationship('Maintenance')
    housekeeper = db.relationship('HouseKeeper')
    category = db.relationship('Category')

    def __repr__(self):
        return f'<MaintenanceTask {self.nombre}>'

    def serialize(self):
        return {
            "id": self.id,
            "nombre": self.nombre,
            "photo_url": self.photo_url if self.photo_url else None,
            "condition": self.condition,
            "room": self.room.serialize() if self.room else None,
            "room_id": self.room_id,
            "room_nombre": self.room.nombre if self.room else None,
            "maintenance": self.maintenance.serialize() if self.maintenance else None,
            "maintenance_id": self.maintenance_id,
            "maintenance_nombre": self.maintenance.nombre if self.maintenance else None,
            "housekeeper": self.housekeeper.serialize() if self.housekeeper else None,
            "housekeeper_id": self.housekeeper_id,
            "housekeeper_nombre": self.housekeeper.nombre if self.housekeeper else None,  
            "category": self.category.serialize() if self.category else None,
            "category_id": self.category_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "finalizado_por": self.finalizado_por,


        }

