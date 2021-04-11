import json
import os
import ssl
from glob import glob

import nltk
import requests
import torch
from nltk import sent_tokenize, regexp_tokenize
from nltk.corpus import stopwords
from torchtext.vocab import Vocab

from src.python.datasets.base import BaseDataset, DatasetContentError, DatasetStructureError

ssl._create_default_https_context = ssl._create_unverified_context


class TextClassificationDataset(BaseDataset):
    def __init__(self, path, lang, vocab: Vocab, max_len=200, device='cpu', mode='train', split=False):
        super().__init__()
        self.path = path
        self.lang = lang
        assert self.lang in ['ru', 'en']
        self.vocab = vocab
        self.unk_token = '<unk>'
        if self.unk_token not in self.vocab.stoi:
            self.vocab.itos = [self.unk_token] + self.vocab.itos
            self.vocab.stoi = {k: v + 1 for k, v in self.vocab.stoi.items()}
            self.vocab.stoi[self.unk_token] = 0
            self.vocab.vectors = torch.cat([torch.zeros((1, self.vocab.dim)), self.vocab.vectors], dim=0)
        self.max_len = max_len
        self.device = device
        self.mode = mode
        self.split = split

        nltk.download('stopwords')
        nltk.download('punkt')
        self.stopwords = self._get_stopwords()

        self.labels = None

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
            unique_labels = set()
            for filename in self.json_filenames:
                with open(filename, 'r') as r:
                    data = json.load(r)
                if 'text' not in data or 'label' not in data:
                    raise DatasetContentError(f'"text" or "label" key missing in {filename}')
                unique_labels.add(data['label'])
            self.labels = {label: i for i, label in enumerate(sorted(unique_labels))}
        else:
            for key, value in self.data.items():
                if 'text' not in value or 'label' not in value:
                    raise DatasetContentError(f'"text" or "label" key missing in {self.json_path}, key={key}')
            if max([int(key) for key in self.data.keys()]) != len(self.data) - 1:
                raise DatasetContentError(f'{self.json_path} must contain keys from 0 to len(data)-1. ')
            unique_labels = set([value['label'] for value in self.data.values()])
            self.labels = {label: i for i, label in enumerate(sorted(unique_labels))}

    def __len__(self):
        if self.split:
            return len(self.json_filenames)
        else:
            return len(self.data)

    def __getitem__(self, idx):
        if self.split:
            with open(self.json_filenames[idx], 'r') as r:
                item = json.load(r)
        else:
            try:
                item = self.data[idx]
            except KeyError:
                item = self.data[str(idx)]
        label = self.labels[item['label']]
        label = torch.tensor(label, dtype=torch.float, device=self.device)
        raw_text = item['text']
        tokens = self._tokenize(raw_text)
        model_input, length = self._encode(tokens)
        return raw_text, model_input, label

    def _tokenize(self, raw_text: str):
        text = raw_text.lower().strip()
        regexp = r'(?u)\b\w{1,}\b'
        tokens = [w for sent in sent_tokenize(text, language='english' if self.lang == 'en' else 'russian')
                  for w in regexp_tokenize(sent, regexp)]
        tokens = [token for token in tokens if token not in self.stopwords]
        return tokens

    def _encode(self, tokens):
        encoded_placeholder = torch.full((self.max_len,), fill_value=self.vocab.stoi[self.unk_token], dtype=torch.int)
        encoded = torch.tensor([self.vocab.stoi[token] if token in self.vocab.stoi else self.vocab.stoi[self.unk_token]
                                for token in tokens], dtype=torch.int)
        length = min(self.max_len, len(encoded))
        encoded_placeholder[:length] = encoded[:length]
        return encoded_placeholder, length

    def _get_stopwords(self):
        if self.lang == 'en':
            return stopwords.words('english')
        else:
            url_stopwords_ru = "https://raw.githubusercontent.com/stopwords-iso/stopwords-ru/master/stopwords-ru.txt"
            r = requests.get(url_stopwords_ru)
            return r.text.lower().splitlines()
