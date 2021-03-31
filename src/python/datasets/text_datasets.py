import json
import os
import ssl
from glob import glob

import requests

ssl._create_default_https_context = ssl._create_unverified_context

import nltk
nltk.download('stopwords')
nltk.download('punkt')
from nltk.corpus import stopwords
from nltk import sent_tokenize, regexp_tokenize

from src.python.datasets.base import BaseDataset, DatasetContentError, DatasetStructureError


class TextClassificationDataset(BaseDataset):
    def __init__(self, path, lang, device='cpu', mode='train', split=False):
        super().__init__()
        self.path = path
        self.lang = lang
        assert self.lang in ['ru', 'en']
        self.device = device
        self.mode = mode
        self.split = split

        self.stopwords = self.get_stopwords()

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

        self.stopwords = self.get_stopwords()

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
        raw_text = item['text']
        text = self.preprocess_text(raw_text)
        return text, label

    def preprocess_text(self, raw_text: str):
        text = raw_text.lower().strip()
        regexp = r'(?u)\b\w{1,}\b'
        tokens = [w for sent in sent_tokenize(text, language='english' if self.lang == 'en' else 'russian')
                  for w in regexp_tokenize(sent, regexp)]
        tokens = [token for token in tokens if token not in self.stopwords]
        return tokens

    def get_stopwords(self):
        if self.lang == 'en':
            return stopwords.words('english')
        else:
            url_stopwords_ru = "https://raw.githubusercontent.com/stopwords-iso/stopwords-ru/master/stopwords-ru.txt"
            r = requests.get(url_stopwords_ru)
            return r.text.lower().splitlines()
