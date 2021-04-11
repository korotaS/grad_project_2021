from pytorch_lightning import Trainer as PLTrainer
from pytorch_lightning.loggers import TensorBoardLogger
from torch import nn
from torch import optim
from torch.utils.data import DataLoader

from src.python.architectures import get_txt_clf_model
from src.python.datasets import TextClassificationDataset
from src.python.models import TextClassificationModel
from src.python.trainers.base import BaseTextTrainer
from src.python.utils.embeddings import get_vectors


class TextClassificationTrainer(BaseTextTrainer):
    def __init__(self, cfg):
        super().__init__(cfg)
        self.labels = self.cfg['data']['labels']
        self.num_classes = len(self.labels)

        self.embeddings_name = self.cfg['model']['embeddings']['model']
        self.embeddings_folder = self.cfg['model']['embeddings']['cache_folder']
        self.embeddings = get_vectors(self.embeddings_name, self.embeddings_folder)

        self.n_hidden = self.cfg['model']['n_hidden']

    def init_model(self):
        self.model_raw = get_txt_clf_model(self.batch_size, self.num_classes, self.n_hidden,
                                           len(self.embeddings.stoi), self.embeddings.dim, self.embeddings.vectors)
        optimizer = getattr(optim, self.optimizer_name)(params=self.model_raw.parameters(), lr=self.lr)
        criterion = getattr(nn, self.criterion_name)()
        self.model = TextClassificationModel(self.model_raw, optimizer, criterion, self.labels)

    def init_data(self):
        self.train_dataset = TextClassificationDataset(self.train_folder, self.lang, self.embeddings, self.labels)
        self.train_loader = DataLoader(self.train_dataset, batch_size=self.batch_size, shuffle=True)

        self.val_dataset = TextClassificationDataset(self.val_folder, self.lang, self.embeddings, self.labels)
        self.val_loader = DataLoader(self.val_dataset, batch_size=self.batch_size, shuffle=False)

    def train(self):
        logger = TensorBoardLogger('tb_logs', name='txtclf')
        pl_trainer = PLTrainer(max_epochs=self.max_epochs, logger=logger, log_every_n_steps=25,
                               num_sanity_val_steps=5, callbacks=self.callbacks)
        pl_trainer.fit(self.model, self.train_loader, self.val_loader)
