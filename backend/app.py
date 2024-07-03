from flask import Flask, request, jsonify
from flask_pymongo import PyMongo
from flask_cors import CORS
from bson import ObjectId
from dotenv import load_dotenv
import os
import jwt
import datetime
from functools import wraps

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# MongoDB configuration
app.config["MONGO_URI"] = os.getenv("MONGODB_URI", "mongodb://localhost:27017/taskmaster")
mongo = PyMongo(app)

# Add this after the mongo initialization
try:
    mongo.db.command('ping')
    print("Connected to MongoDB!")
except Exception as e:
    print("Failed to connect to MongoDB:", str(e))

# JWT configuration
JWT_SECRET = os.getenv("JWT_SECRET", "your_jwt_secret")

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        try:
            data = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            current_user = mongo.db.users.find_one({'_id': ObjectId(data['user_id'])})
        except:
            return jsonify({'error': 'Token is invalid'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    try:
        data = request.json
        print("Received signup data:", data)  # Debug print
        existing_user = mongo.db.users.find_one({'email': data['email']})
        if existing_user:
            return jsonify({'error': 'Email already exists'}), 400
        
        new_user = mongo.db.users.insert_one({
            'name': data['name'],
            'email': data['email'],
            'password': data['password']  # In a real app, hash this password
        })
        return jsonify({'message': 'User created successfully'}), 201
    except Exception as e:
        print("Signup error:", str(e))  # Debug print
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.json
        print("Received login data:", data)  # Debug print
        user = mongo.db.users.find_one({'email': data['email']})
        if user and user['password'] == data['password']:  # In a real app, verify the hashed password
            token = jwt.encode({
                'user_id': str(user['_id']),
                'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
            }, JWT_SECRET)
            return jsonify({'token': token, 'user': {'id': str(user['_id']), 'name': user['name'], 'email': user['email']}})
        return jsonify({'error': 'Invalid credentials'}), 401
    except Exception as e:
        print("Login error:", str(e))  # Debug print
        return jsonify({'error': str(e)}), 500

@app.route('/api/tasks', methods=['GET'])
@token_required
def get_tasks(current_user):
    tasks = list(mongo.db.tasks.find({'user_id': str(current_user['_id'])}))
    return jsonify([{**task, '_id': str(task['_id'])} for task in tasks])

@app.route('/api/tasks', methods=['POST'])
@token_required
def create_task(current_user):
    data = request.json
    new_task = mongo.db.tasks.insert_one({
        'user_id': str(current_user['_id']),
        'text': data['text'],
        'completed': data.get('completed', False),
        'important': data.get('important', False)
    })
    created_task = mongo.db.tasks.find_one({'_id': new_task.inserted_id})
    return jsonify({**created_task, '_id': str(created_task['_id'])}), 201

@app.route('/api/tasks/<task_id>', methods=['PUT'])
@token_required
def update_task(current_user, task_id):
    data = request.json
    updated_task = mongo.db.tasks.find_one_and_update(
        {'_id': ObjectId(task_id), 'user_id': str(current_user['_id'])},
        {'$set': data},
        return_document=True
    )
    if updated_task:
        return jsonify({**updated_task, '_id': str(updated_task['_id'])})
    return jsonify({'error': 'Task not found'}), 404

@app.route('/api/tasks/<task_id>', methods=['DELETE'])
@token_required
def delete_task(current_user, task_id):
    result = mongo.db.tasks.delete_one({'_id': ObjectId(task_id), 'user_id': str(current_user['_id'])})
    if result.deleted_count:
        return jsonify({'message': 'Task deleted successfully'})
    return jsonify({'error': 'Task not found'}), 404

@app.route('/')
def home():
    return "TaskMaster Pro API is running!"

if __name__ == '__main__':
    app.run(debug=True)