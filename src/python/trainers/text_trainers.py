from pytorch_lightning import Trainer as PLTrainer
from pytorch_lightning.loggers import TensorBoardLogger
from torch import nn
from torch import optim
from torch.utils.data import DataLoader

from src.python.architectures import get_txt_clf_model
from src.python.datasets import LSTMTextClassificationDataset, BertTextClassificationDataset
from src.python.models import LSTMTextClassificationModel, BertTextClassificationModel
from src.python.trainers.base_trainers import BaseTextTrainer
from src.python.utils.embeddings import get_vectors
from src.python.utils.seed import worker_init_fn


class TextClassificationTrainer(BaseTextTrainer):
    def __init__(self, cfg):
        super().__init__(cfg)
        self.labels = self.cfg['data']['labels']
        self.num_classes = len(self.labels)

        if self.model_type == 'lstm':
            self.embeddings_name = self.cfg['embeddings']
            self.embeddings_folder = self.cfg['cache_folder']
            self.embeddings = get_vectors(self.embeddings_name, self.embeddings_folder)
            self.n_hidden = self.cfg['model']['n_hidden']
        elif self.model_type == 'bert':
            self.model_name = self.cfg['model']['model_name']
            self.cache_folder = self.cfg['cache_folder']

    def init_model(self):
        criterion = getattr(nn, self.criterion_name)()
        if self.model_type == 'lstm':
            self.model_raw = get_txt_clf_model(model_type=self.model_type,
                                               output_size=self.num_classes,
                                               hidden_size=self.n_hidden,
                                               vocab_size=len(self.embeddings.stoi),
                                               embedding_length=self.embeddings.dim,
                                               weights=self.embeddings.vectors)
            optimizer = getattr(optim, self.optimizer_name)(params=self.model_raw.parameters(), **self.optimizer_params)
            self.model = LSTMTextClassificationModel(model=self.model_raw,
                                                     optimizer=optimizer,
                                                     criterion=criterion,
                                                     labels=self.labels)
        elif self.model_type == 'bert':
            self.model_raw = get_txt_clf_model(model_type=self.model_type,
                                               model_name=self.model_name,
                                               cache_folder=self.cache_folder)
            optimizer = getattr(optim, self.optimizer_name)(params=self.model_raw.parameters(), **self.optimizer_params)
            self.model = BertTextClassificationModel(model=self.model_raw,
                                                     optimizer=optimizer,
                                                     criterion=criterion,
                                                     labels=self.labels)

    def init_data(self):
        if self.model_type == 'lstm':
            self.train_dataset = LSTMTextClassificationDataset(path=self.train_folder,
                                                               lang=self.lang,
                                                               vocab=self.embeddings,
                                                               labels=self.labels,
                                                               mode='train',
                                                               data_len=self.train_len)
            self.val_dataset = LSTMTextClassificationDataset(path=self.val_folder,
                                                             lang=self.lang,
                                                             vocab=self.embeddings,
                                                             labels=self.labels,
                                                             mode='val',
                                                             data_len=self.val_len)
        elif self.model_type == 'bert':
            self.train_dataset = BertTextClassificationDataset(path=self.train_folder,
                                                               lang=self.lang,
                                                               model_name=self.model_name,
                                                               labels=self.labels,
                                                               mode='train',
                                                               data_len=self.train_len)
            self.val_dataset = BertTextClassificationDataset(path=self.val_folder,
                                                             lang=self.lang,
                                                             model_name=self.model_name,
                                                             labels=self.labels,
                                                             mode='val',
                                                             data_len=self.val_len)

        self.train_loader = DataLoader(dataset=self.train_dataset,
                                       batch_size=self.batch_size_train,
                                       shuffle=self.shuffle_train,
                                       num_workers=self.num_workers,
                                       worker_init_fn=worker_init_fn)
        self.val_loader = DataLoader(dataset=self.val_dataset,
                                     batch_size=self.batch_size_val,
                                     shuffle=self.shuffle_val,
                                     num_workers=self.num_workers,
                                     worker_init_fn=worker_init_fn)

    def train(self):
        logger = TensorBoardLogger('tb_logs', name='txtclf')
        pl_trainer = PLTrainer(logger=logger,
                               log_every_n_steps=25,
                               num_sanity_val_steps=5,
                               callbacks=self.callbacks,
                               **self.trainer_params)
        pl_trainer.fit(model=self.model,
                       train_dataloader=self.train_loader,
                       val_dataloaders=self.val_loader)
