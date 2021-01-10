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
import numpy as np

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
                                                       use_pretrained=True)

    def init_datasets(self):
        transform_train = transforms.Compose([
            transforms.RandomResizedCrop(self.input_size),
            transforms.RandomHorizontalFlip(),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])
        tr_dataset = ImageClassificationDataset(self.train_folder, transform=transform_train)
        transform_val = transforms.Compose([
            transforms.Resize(self.input_size),
            transforms.CenterCrop(self.input_size),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])
        te_dataset = ImageClassificationDataset(self.test_folder, transform=transform_val)
        tr_loader = torch.utils.data.DataLoader(
            tr_dataset,
            batch_size=8,
            shuffle=True)
        te_loader = torch.utils.data.DataLoader(
            te_dataset,
            batch_size=8,
            shuffle=True)
        return tr_dataset, te_dataset, tr_loader, te_loader

    def write_log(self, data):
        with open(f'{self.project_folder}/log.json', 'w+') as w:
            w.write(json.dumps(data, indent=4))

    def read_log(self):
        with open(f'{self.project_folder}/log.json', 'r') as r:
            return json.load(r)

    def train(self):
        params_to_update = self.model.parameters()
        print("Params to learn:")
        freeze = True
        if freeze:
            params_to_update = []
            for name, param in self.model.named_parameters():
                if param.requires_grad:
                    params_to_update.append(param)
                    print("\t", name)
        else:
            for name, param in self.model.named_parameters():
                if param.requires_grad:
                    print("\t", name)
        optimizer = optim.Adam(params_to_update, lr=0.001)
        criterion = nn.CrossEntropyLoss()
        dataloaders = {'train': self.train_loader, 'val': self.test_loader}

        num_epochs = 10
        for epoch in range(num_epochs):
            print('Epoch {}/{}'.format(epoch, num_epochs - 1))
            print('-' * 10)

            # Each epoch has a training and validation phase
            for phase in ['train', 'val']:
                if phase == 'train':
                    self.model.train()  # Set model to training mode
                else:
                    self.model.eval()  # Set model to evaluate mode

                running_loss = 0.0
                running_corrects = 0

                # Iterate over data.
                for batch, (inputs, labels) in enumerate(dataloaders[phase]):
                    # inputs = inputs.to(device)
                    # labels = labels.to(device)
                    if batch % 10 == 0:
                        print(f'batch: {batch}')

                    # zero the parameter gradients
                    optimizer.zero_grad()

                    # forward
                    # track history if only in train
                    with torch.set_grad_enabled(phase == 'train'):
                        # Get model outputs and calculate loss
                        # Special case for inception because in training it has an auxiliary output. In train
                        #   mode we calculate the loss by summing the final output and the auxiliary output
                        #   but in testing we only consider the final output.
                        if self.architecture == 'inception_v3' and phase == 'train':
                            # From https://discuss.pytorch.org/t/how-to-optimize-inception-model-with-auxiliary-classifiers/7958
                            outputs, aux_outputs = self.model(inputs)
                            loss1 = criterion(outputs, labels)
                            loss2 = criterion(aux_outputs, labels)
                            loss = loss1 + 0.4 * loss2
                        else:
                            outputs = self.model(inputs)
                            loss = criterion(outputs, labels.long())

                        _, preds = torch.max(outputs, 1)

                        # backward + optimize only if in training phase
                        if phase == 'train':
                            loss.backward()
                            optimizer.step()

                    # statistics
                    running_loss += loss.item() * inputs.size(0)
                    running_corrects += torch.sum(preds == labels.data)

                epoch_loss = running_loss / len(dataloaders[phase].dataset)
                epoch_acc = running_corrects.double() / len(dataloaders[phase].dataset)

                print(f'{phase} Loss: {epoch_loss} Acc: {epoch_acc}')


thread = TrainThread({'projectName': 'project_1',
                      'datasetFolder': './projects/datasets/dogscats/',
                      'architecture': 'mobilenet_v2',
                      'num_classes': 2})
thread.start()
