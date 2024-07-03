from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from functools import wraps
from dotenv import load_dotenv
import os
import jwt
import datetime

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# SQLite configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///instance/taskmaster.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# JWT configuration
JWT_SECRET = os.getenv("JWT_SECRET", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c")

# Define User and Task models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    text = db.Column(db.String(200), nullable=False)
    completed = db.Column(db.Boolean, default=False)
    important = db.Column(db.Boolean, default=False)
    user = db.relationship('User', backref=db.backref('tasks', lazy=True))

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        try:
            data = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            current_user = User.query.get(data['user_id'])
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    try:
        data = request.json
        print("Received signup data:", data)  # Debug print
        existing_user = User.query.filter_by(email=data['email']).first()
        if existing_user:
            return jsonify({'error': 'Email already exists'}), 400
        
        new_user = User(
            name=data['name'],
            email=data['email'],
            password=data['password']  # In a real app, hash this password
        )
        db.session.add(new_user)
        db.session.commit()
        return jsonify({'message': 'User created successfully'}), 201
    except Exception as e:
        print("Signup error:", str(e))  # Debug print
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.json
        print("Received login data:", data)  # Debug print
        user = User.query.filter_by(email=data['email']).first()
        if user and user.password == data['password']:  # In a real app, verify the hashed password
            token = jwt.encode({
                'user_id': user.id,
                'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
            }, JWT_SECRET)
            return jsonify({'token': token, 'user': {'id': user.id, 'name': user.name, 'email': user.email}})
        return jsonify({'error': 'Invalid credentials'}), 401
    except Exception as e:
        print("Login error:", str(e))  # Debug print
        return jsonify({'error': str(e)}), 500

@app.route('/api/tasks', methods=['GET'])
@token_required
def get_tasks(current_user):
    tasks = Task.query.filter_by(user_id=current_user.id).all()
    return jsonify([{
        'id': task.id,
        'text': task.text,
        'completed': task.completed,
        'important': task.important
    } for task in tasks])

@app.route('/api/tasks', methods=['POST'])
@token_required
def create_task(current_user):
    data = request.json
    new_task = Task(
        user_id=current_user.id,
        text=data['text'],
        completed=data.get('completed', False),
        important=data.get('important', False)
    )
    db.session.add(new_task)
    db.session.commit()
    return jsonify({
        'id': new_task.id,
        'text': new_task.text,
        'completed': new_task.completed,
        'important': new_task.important
    }), 201

@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
@token_required
def update_task(current_user, task_id):
    data = request.json
    task = Task.query.filter_by(id=task_id, user_id=current_user.id).first()
    if task:
        task.text = data.get('text', task.text)
        task.completed = data.get('completed', task.completed)
        task.important = data.get('important', task.important)
        db.session.commit()
        return jsonify({
            'id': task.id,
            'text': task.text,
            'completed': task.completed,
            'important': task.important
        })
    return jsonify({'error': 'Task not found'}), 404

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
@token_required
def delete_task(current_user, task_id):
    task = Task.query.filter_by(id=task_id, user_id=current_user.id).first()
    if task:
        db.session.delete(task)
        db.session.commit()
        return jsonify({'message': 'Task deleted successfully'})
    return jsonify({'error': 'Task not found'}), 404

@app.route('/')
def home():
    return "TaskMaster Pro API is running!"

if __name__ == '__main__':
    db.create_all()
    app.run(host='0.0.0.0', port=5000, debug=True)
