import json
from threading import Thread
from time import sleep
import os


class TrainThread(Thread):
    def __init__(self, project_name):
        super().__init__()
        if not os.path.exists('./projects/'):
            os.mkdir('./projects/')
        self.project_folder = os.path.join('./projects/', project_name)
        if not os.path.exists(self.project_folder):
            os.mkdir(self.project_folder)
        if os.path.exists(os.path.join(self.project_folder, 'log.json')):
            os.remove(os.path.join(self.project_folder, 'log.json'))

    def run(self):
        train(self.project_folder)


def train(project_folder):
    with open(f'{project_folder}/log.json', 'w+') as w:
        w.write(json.dumps({'project': project_folder,
                            'epochs': [],
                            'status': 'training'}, indent=4))

    for i in range(1, 10):
        with open(f'{project_folder}/log.json', 'r') as r:
            epochs = json.load(r)
            sleep(1)
            epochs['epochs'].append({'loss': 100 / i,
                                     'metrics': 79 + i,
                                     'epoch_num': i})
        with open(f'{project_folder}/log.json', 'w+') as w:
            w.write(json.dumps(epochs, indent=4))

    with open(f'{project_folder}/log.json', 'r') as r:
        epochs = json.load(r)
        epochs['status'] = 'done'
    with open(f'{project_folder}/log.json', 'w+') as w:
        w.write(json.dumps(epochs, indent=4))
