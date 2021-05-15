import json
import os
import ssl
from glob import glob

import numpy as np
import torch

from src.python.datasets.base_datasets import BaseDataset, DatasetContentError, DatasetStructureError

ssl._create_default_https_context = ssl._create_unverified_context


class BaseTextClassificationDataset(BaseDataset):
    def __init__(self, path, labels, mode='train', split=False, data_len=-1):
        super().__init__()
        self.path = path
        self.mode = mode
        self.split = split
        self.data_len = data_len

        self.labels = {label: i for i, label in enumerate(labels)}

        if self.split:
            self.json_filenames = sorted(glob(os.path.join(self.path, '*.json')))
        else:
            self.json_path = os.path.join(self.path, f'{self.mode}.json')
        self.check_structure()
        if not self.split:
            with open(self.json_path, 'r') as r:
                self.data = json.load(r)
        self.check_content()

    def check_structure(self):
        if self.split:
            if len(self.json_filenames) == 0:
                raise DatasetStructureError(f'There are no .json files in {self.path}')
        else:
            if not os.path.exists(self.json_path):
                raise DatasetStructureError(f'There is no {self.mode}.json in {self.path}')

    def check_content(self):
        if self.split:
            for filename in self.json_filenames:
                with open(filename, 'r') as r:
                    data = json.load(r)
                if 'text' not in data or 'label' not in data:
                    raise DatasetContentError(f'"text" or "label" key missing in {filename}')
                if data['label'] not in self.labels:
                    raise DatasetContentError(f'Label "{data["label"]}" from {self.json_path} '
                                              f'is not in {list(self.labels.keys())}')
        else:
            for key, value in self.data.items():
                if 'text' not in value or 'label' not in value:
                    raise DatasetContentError(f'"text" or "label" key missing in {self.json_path}, key={key}')
                if value['label'] not in self.labels:
                    raise DatasetContentError(f'Label "{value["label"]}" from {self.json_path} '
                                              f'(key={key}) is not in {list(self.labels.keys())}')
            if max([int(key) for key in self.data.keys()]) != len(self.data) - 1:
                raise DatasetContentError(f'{self.json_path} must contain keys from 0 to len(data)-1. ')

    def __len__(self):
        if self.data_len != -1:
            return self.data_len
        if self.split:
            return len(self.json_filenames)
        else:
            return len(self.data)

    def _get_raw_item(self, idx):
        if self.split:
            with open(self.json_filenames[idx], 'r') as r:
                item = json.load(r)
        else:
            try:
                item = self.data[idx]
            except KeyError:
                item = self.data[str(idx)]
        raw_label = self.labels[item['label']]
        raw_text = item['text']
        return raw_text, raw_label


class LSTMTextClassificationDataset(BaseTextClassificationDataset):
    def __init__(self, path, preprocessor, labels, mode='train', split=False, data_len=-1):
        super().__init__(path, labels, mode, split, data_len)
        self.preprocessor = preprocessor

    def __getitem__(self, idx):
        raw_text, raw_label = self._get_raw_item(idx)
        label = torch.tensor(raw_label, dtype=torch.float)
        model_input, length = self.preprocessor.process(raw_text)
        return raw_text, model_input, length, label


class BertTextClassificationDataset(BaseTextClassificationDataset):
    def __init__(self, path, preprocessor, labels, mode='train', split=False, data_len=-1):
        super().__init__(path, labels, mode, split, data_len)
        self.preprocessor = preprocessor

    def __getitem__(self, idx):
        raw_text, raw_label = self._get_raw_item(idx)
        label = torch.tensor(raw_label, dtype=torch.float)
        input_ids, mask, token_type_ids = self.preprocessor.process(raw_text)
        return raw_text, np.array(input_ids), np.array(mask), np.array(token_type_ids), label
