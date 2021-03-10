from flask import Flask
from flask_socketio import SocketIO, send


app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins='*', ping_timeout=5000, async_mode='threading')


@socketio.on('connect')
def connected():
    print('connected!')
    send('hi, client!')


@socketio.on('message')
def get_message(message):
    print(message)


@socketio.on('disconnect')
def disconnected():
    print('disconnected!')
