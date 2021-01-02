import json
from threading import Thread
from time import sleep
import os
import shutil

import torch
import torch.nn.functional as F
import torch.nn as nn
from torch import optim
from torchvision import datasets, models, transforms

from src.python.utils.datasets import ImageClassificationDataset
from src.python.utils.architectures import get_im_clf_model
# except ImportError:
#     from utils.datasets import ImageClassificationDataset

import ssl

ssl._create_default_https_context = ssl._create_unverified_context


class TrainThread(Thread):
    def __init__(self, data):
        super().__init__()
        self.status = 'NOT INITIALIZED'
        self.raw_dataset_folder = data['datasetFolder']
        self.architecture = data['architecture']
        self.num_classes = data['num_classes']

        self.project_name = data['projectName']
        if not os.path.exists('./projects/'):
            os.mkdir('./projects/')

        self.project_folder = os.path.join('./projects/', self.project_name)
        if not os.path.exists(self.project_folder):
            os.mkdir(self.project_folder)

        data_folder = os.path.join(self.project_folder, 'dataset/')
        if not os.path.exists(data_folder):
            os.mkdir(data_folder)
        self.train_folder = os.path.join(data_folder, 'train/')
        self.test_folder = os.path.join(data_folder, 'val/')
        self.status = 'INITIALIZED'

        self.train_dataset = self.test_dataset = self.train_loader = self.test_loader = None
        self.model = None
        self.input_size = None

    def run(self):
        # self.copy_data()
        self.init_model()
        self.train_dataset, self.test_dataset, self.train_loader, self.test_loader = self.init_datasets()
        self.train()

    def copy_data(self):
        if os.path.exists(self.train_folder):
            shutil.rmtree(self.train_folder)
        shutil.copytree(os.path.join(self.raw_dataset_folder, 'train/'), self.train_folder)

        if os.path.exists(self.test_folder):
            shutil.rmtree(self.test_folder)
        shutil.copytree(os.path.join(self.raw_dataset_folder, 'val/'), self.test_folder)

    def init_model(self):
        self.model, self.input_size = get_im_clf_model(self.architecture,
                                                       num_classes=self.num_classes,
                                                       use_pretrained=False)

    def init_datasets(self):
        transform = transforms.Compose([
            transforms.Resize((self.input_size, self.input_size)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])
        tr_dataset = ImageClassificationDataset(self.train_folder, transform=transform)
        te_dataset = ImageClassificationDataset(self.test_folder, transform=transform)
        tr_loader = torch.utils.data.DataLoader(
            tr_dataset,
            batch_size=16,
            shuffle=True)
        te_loader = torch.utils.data.DataLoader(
            te_dataset,
            batch_size=16,
            shuffle=True)
        return tr_dataset, te_dataset, tr_loader, te_loader

    def write_log(self, data):
        with open(f'{self.project_folder}/log.json', 'w+') as w:
            w.write(json.dumps(data, indent=4))

    def read_log(self):
        with open(f'{self.project_folder}/log.json', 'r') as r:
            return json.load(r)

    def train(self):
        self.write_log({'project': self.project_folder, 'epochs': [], 'status': 'training'})

        self.model.train()
        optimizer = optim.Adam(self.model.parameters(), lr=0.0001)
        criterion = nn.CrossEntropyLoss() if self.num_classes > 2 else nn.BCELoss()
        NUM_TR_BATCHES = 10
        NUM_TE_BATCHES = 5

        for epoch in range(10):
            epoch_loss = 0
            for batch, (data, target) in enumerate(self.train_loader):
                if batch >= NUM_TR_BATCHES:
                    break
                optimizer.zero_grad()
                output = self.model(data)
                loss = criterion(torch.sigmoid(output) if self.num_classes == 2 else output, target.unsqueeze(1))
                loss.backward()
                optimizer.step()
                print(f'train: epoch {epoch}, batch {batch}, loss {loss.item()}')
            print()
            with torch.no_grad():
                for batch, (data, target) in enumerate(self.test_loader):
                    if batch >= NUM_TE_BATCHES:
                        break
                    output = self.model(data)
                    loss = criterion(torch.sigmoid(output) if self.num_classes == 2 else output, target.unsqueeze(1))
                    epoch_loss += loss.item()
                    print(f'test: epoch {epoch}, batch {batch}, loss {loss.item()}')
            print()
            epoch_loss /= NUM_TE_BATCHES

            epochs = self.read_log()
            epochs['epochs'].append({'loss': epoch_loss,
                                     'metrics': epoch_loss,
                                     'epoch_num': epoch})
            self.write_log(epochs)

        epochs = self.read_log()
        epochs['status'] = 'done'
        self.write_log(epochs)


thread = TrainThread({'projectName': 'project_1',
                      'datasetFolder': './projects/datasets/dogscats/',
                      'architecture': 'mobilenet_v2',
                      'num_classes': 2})
thread.start()
