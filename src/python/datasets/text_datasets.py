import json
import os
import ssl
from glob import glob

import nltk
import numpy as np
import requests
import torch
from nltk import sent_tokenize, regexp_tokenize
from nltk.corpus import stopwords
from torchtext.vocab import Vocab
from transformers import AutoTokenizer

from src.python.datasets.base_datasets import BaseDataset, DatasetContentError, DatasetStructureError

ssl._create_default_https_context = ssl._create_unverified_context


class BaseTextClassificationDataset(BaseDataset):
    def __init__(self, path, lang, labels, max_len=200, device='cpu',
                 mode='train', split=False, data_len=-1):
        super().__init__()
        self.path = path
        self.lang = lang
        assert self.lang in ['ru', 'en']
        self.max_len = max_len
        self.device = device
        self.mode = mode
        self.split = split
        self.data_len = data_len

        try:
            nltk.data.find('tokenizers/punkt')
        except LookupError:
            nltk.download('punkt')
        try:
            nltk.data.find('corpora/stopwords')
        except LookupError:
            nltk.download('stopwords')
        self.stopwords = self._get_stopwords()

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
        else:
            for key, value in self.data.items():
                if 'text' not in value or 'label' not in value:
                    raise DatasetContentError(f'"text" or "label" key missing in {self.json_path}, key={key}')
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

    def _get_stopwords(self):
        if self.lang == 'en':
            return stopwords.words('english')
        else:
            url_stopwords_ru = "https://raw.githubusercontent.com/stopwords-iso/stopwords-ru/master/stopwords-ru.txt"
            r = requests.get(url_stopwords_ru)
            return r.text.lower().splitlines()

    def _tokenize(self, raw_text):
        pass

    def _encode(self, tokens):
        pass


class LSTMTextClassificationDataset(BaseTextClassificationDataset):
    def __init__(self, path, lang, vocab: Vocab, labels, max_len=200, device='cpu',
                 mode='train', split=False, data_len=-1):
        super().__init__(path, lang, labels, max_len, device, mode, split, data_len)
        self.vocab = vocab
        self.unk_token = '<unk>'
        if self.unk_token not in self.vocab.stoi:
            self.vocab.itos = [self.unk_token] + self.vocab.itos
            self.vocab.stoi = {k: v + 1 for k, v in self.vocab.stoi.items()}
            self.vocab.stoi[self.unk_token] = 0
            self.vocab.vectors = torch.cat([torch.zeros((1, self.vocab.dim)), self.vocab.vectors], dim=0)

    def __getitem__(self, idx):
        raw_text, raw_label = self._get_raw_item(idx)
        label = torch.tensor(raw_label, dtype=torch.float, device=self.device)
        tokens = self._tokenize(raw_text)
        model_input, length = self._encode(tokens)
        return raw_text, model_input, length, label

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


class BertTextClassificationDataset(BaseTextClassificationDataset):
    def __init__(self, path, lang, labels, model_name, max_len=200, device='cpu',
                 mode='train', split=False, data_len=-1):
        super().__init__(path, lang, labels, max_len, device, mode, split, data_len)
        self.model_name = model_name
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)

    def __getitem__(self, idx):
        raw_text, raw_label = self._get_raw_item(idx)
        label = torch.tensor(raw_label, dtype=torch.float, device=self.device)
        tokens = self._tokenize(raw_text)
        input_ids, mask, token_type_ids = self._encode(tokens)
        return raw_text, np.array(input_ids), np.array(mask), np.array(token_type_ids), label

    def _tokenize(self, raw_text: str):
        return self.tokenizer(raw_text.lower().strip(), padding='max_length', truncation=True, max_length=self.max_len)

    def _encode(self, tokens):
        input_ids = tokens['input_ids']
        mask = tokens['attention_mask']
        token_type_ids = np.empty(0)
        if 'distil' not in self.model_name:
            token_type_ids = tokens['token_type_ids']
        return input_ids, mask, token_type_ids
