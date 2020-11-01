import json
from threading import Thread
from time import sleep
import os

import torch
import torch.nn.functional as F
import torch.nn as nn
from torch import optim
from torchvision import datasets, models, transforms

import ssl
ssl._create_default_https_context = ssl._create_unverified_context


class TrainThread(Thread):
    def __init__(self, data):
        super().__init__()
        self.status = 'NOT INITIALIZED'
        self.dataset_folder = data['datasetFolder']
        self.project_name = data['projectName']
        if not os.path.exists('./projects/'):
            os.mkdir('./projects/')
        self.project_folder = os.path.join('./projects/', project_name)
        self.data_folder = os.path.join(self.project_folder, 'dataset/')
        if not os.path.exists(self.project_folder):
            os.mkdir(self.project_folder)
        if not os.path.exists(self.data_folder):
            os.mkdir(self.data_folder)
        self.status = 'INITIALIZED'

    def run(self):
        self.train()

    def write_log(self, data):
        with open(f'{self.project_folder}/log.json', 'w+') as w:
            w.write(json.dumps(data, indent=4))

    def read_log(self):
        with open(f'{self.project_folder}/log.json', 'r') as r:
            return json.load(r)

    def train(self):
        try:
            dataset_class = getattr(datasets, self.dataset_folder)
        except AttributeError:
            dataset_class = datasets.MNIST

        train_loader = torch.utils.data.DataLoader(
            dataset_class(self.data_folder, train=True, download=True, transform=transforms.Compose([
                transforms.ToTensor(),
            ])),
            batch_size=32,
            shuffle=True)

        model = models.mobilenet_v2(pretrained=True)
        model.classifier[1] = nn.Linear(model.classifier[1].in_features, 10)

        self.write_log({'project': self.project_folder, 'epochs': [], 'status': 'training'})

        model.train()
        optimizer = optim.Adam(model.parameters(), lr=0.001)
        NUM_BATCHES = 10

        for epoch in range(10):
            epoch_loss = 0
            for batch, (data, target) in enumerate(train_loader):
                if batch >= NUM_BATCHES:
                    break
                optimizer.zero_grad()
                output = model(data)
                loss = F.cross_entropy(output, target)
                epoch_loss += loss.item()
                loss.backward()
                optimizer.step()
                print(epoch, batch, epoch_loss)

            epoch_loss /= NUM_BATCHES

            epochs = self.read_log()
            epochs['epochs'].append({'loss': epoch_loss,
                                     'metrics': epoch_loss,
                                     'epoch_num': epoch})
            self.write_log(epochs)

        epochs = self.read_log()
        epochs['status'] = 'done'
        self.write_log(epochs)
