from flask import Flask, jsonify
from time import sleep
from threading import Thread

app = Flask(__name__)

array = []
done = False


class DataThread(Thread):
    def __init__(self, time):
        super().__init__()
        self.sleep = time

    def run(self):
        global done
        global array
        for i in range(10):
            array.append(i)
            sleep(int(self.sleep)/1000)
        done = True


@app.route("/")
def hello():
    return "Hello World from Flask!"


@app.route("/test")
def test():
    return jsonify({'data': str(array), 'done': done})


@app.route("/run/<time>")
def run(time):
    thread = DataThread(time)
    thread.start()
    return 'ok'


if __name__ == "__main__":
    app.run(host='127.0.0.1', port=5000)
