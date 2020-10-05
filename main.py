from flask import Flask

app = Flask(__name__)


@app.route("/")
def hello():
    return "Hello World from Flask!"


@app.route("/run/<car>")
def run(car):
    return f'{car} is your choice!!!'


if __name__ == "__main__":
    app.run(host='127.0.0.1', port=5000)
