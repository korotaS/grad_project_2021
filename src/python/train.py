import os
import shutil
import ssl
from threading import Thread

import torch.nn as nn
from torch import optim
from torch.utils.data import DataLoader
from torchvision import transforms
from pytorch_lightning import Trainer

from src.python.utils.architectures import get_im_clf_model, ImageClassificationModel
from src.python.utils.datasets import ImageClassificationDataset

ssl._create_default_https_context = ssl._create_unverified_context


class TrainThread(Thread):
    def __init__(self, data):
        super().__init__()
        self.status = 'NOT INITIALIZED'
        self.raw_dataset_folder = data['datasetFolder']
        self.architecture = data['architecture']
        self.num_classes = 2

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
        self.val_folder = os.path.join(data_folder, 'val/')
        self.status = 'INITIALIZED'

        self.train_dataset = self.val_dataset = self.train_loader = self.val_loader = None
        self.model_raw = None
        self.model = None
        self.input_size = None

    def run(self):
        # self.copy_data()
        self.init_model()
        self.train_dataset, self.val_dataset, self.train_loader, self.val_loader = self.init_datasets()
        self.train()

    def copy_data(self):
        if os.path.exists(self.train_folder):
            shutil.rmtree(self.train_folder)
        shutil.copytree(os.path.join(self.raw_dataset_folder, 'train/'), self.train_folder)

        if os.path.exists(self.val_folder):
            shutil.rmtree(self.val_folder)
        shutil.copytree(os.path.join(self.raw_dataset_folder, 'val/'), self.val_folder)

    def init_model(self):
        self.model_raw, self.input_size = get_im_clf_model(self.architecture,
                                                           num_classes=self.num_classes,
                                                           use_pretrained=True,
                                                           freeze=False)

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
        val_dataset = ImageClassificationDataset(self.val_folder, transform=transform_val)
        tr_loader = DataLoader(tr_dataset, batch_size=8, shuffle=True)
        val_loader = DataLoader(val_dataset, batch_size=8, shuffle=False)
        return tr_dataset, val_dataset, tr_loader, val_loader

    def train(self):
        params_to_update = self.model_raw.parameters()
        print("Params to learn:")
        freeze = True
        if freeze:
            params_to_update = []
            for name, param in self.model_raw.named_parameters():
                if param.requires_grad:
                    params_to_update.append(param)
                    print("\t", name)
        else:
            for name, param in self.model_raw.named_parameters():
                if param.requires_grad:
                    print("\t", name)
        optimizer = optim.Adam(params_to_update, lr=0.001)
        criterion = nn.CrossEntropyLoss()
        self.model = ImageClassificationModel(self.model_raw, self.architecture, optimizer, criterion)

        trainer = Trainer(max_epochs=10, limit_train_batches=10, limit_val_batches=10)
        trainer.fit(self.model, self.train_loader, self.val_loader)


thread = TrainThread({'projectName': 'project_1',
                      'datasetFolder': './projects/datasets/dogscats/',
                      'architecture': 'mobilenet_v2',
                      'num_classes': 2})
thread.start()
