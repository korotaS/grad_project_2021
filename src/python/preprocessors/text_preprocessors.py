import nltk
import numpy as np
import requests
import torch
from nltk import sent_tokenize, regexp_tokenize
from nltk.corpus import stopwords
from transformers import AutoTokenizer

from src.python.utils.embeddings import get_vectors


class BaseTextClassificationPreprocessor:
    def __init__(self, cfg, mode='train', device='cpu'):
        self.max_len = cfg['data']['max_item_len']
        self.lang = cfg['data']['lang']
        self.mode = mode
        self.device = device

        try:
            nltk.data.find('tokenizers/punkt')
        except LookupError:
            nltk.download('punkt')
        try:
            nltk.data.find('corpora/stopwords')
        except LookupError:
            nltk.download('stopwords')
        self.stopwords = self._get_stopwords()

    def _get_stopwords(self):
        if self.lang == 'en':
            return stopwords.words('english')
        else:
            url_stopwords_ru = "https://raw.githubusercontent.com/stopwords-iso/stopwords-ru/master/stopwords-ru.txt"
            r = requests.get(url_stopwords_ru)
            return r.text.lower().splitlines()

    def _remove_stopwords(self, tokens):
        return [token for token in tokens if token not in self.stopwords]

    def _tokenize(self, raw_text):
        pass

    def _encode(self, tokens):
        pass

    def process(self, text):
        pass


class LSTMTextClassificationPreprocessor(BaseTextClassificationPreprocessor):
    def __init__(self, cfg, mode='train', vocab=None, device='cpu'):
        super().__init__(cfg, mode, device)
        self.embeddings_name = cfg['embeddings']
        self.embeddings_folder = cfg['cache_folder']
        if vocab is None:
            self.vocab = get_vectors(self.embeddings_name, self.embeddings_folder)
        else:
            self.vocab = vocab
        self.unk_token = '<unk>'
        if self.unk_token not in self.vocab.stoi:
            self.vocab.itos = [self.unk_token] + self.vocab.itos
            self.vocab.stoi = {k: v + 1 for k, v in self.vocab.stoi.items()}
            self.vocab.stoi[self.unk_token] = 0
            self.vocab.vectors = torch.cat([torch.zeros((1, self.vocab.dim)), self.vocab.vectors], dim=0)

    def _tokenize(self, raw_text: str):
        text = raw_text.lower().strip()
        regexp = r'(?u)\b\w{1,}\b'
        tokens = [w for sent in sent_tokenize(text, language='english' if self.lang == 'en' else 'russian')
                  for w in regexp_tokenize(sent, regexp)]
        tokens = self._remove_stopwords(tokens)
        return tokens

    def _encode(self, tokens):
        encoded_placeholder = torch.full((self.max_len,), fill_value=self.vocab.stoi[self.unk_token], dtype=torch.int)
        encoded = torch.tensor([self.vocab.stoi[token] if token in self.vocab.stoi else self.vocab.stoi[self.unk_token]
                                for token in tokens], dtype=torch.int)
        length = min(self.max_len, len(encoded))
        encoded_placeholder[:length] = encoded[:length]
        return encoded_placeholder, length

    def process(self, text):
        tokens = self._tokenize(text)
        model_input, length = self._encode(tokens)
        if self.mode == 'inference':
            return torch.tensor(model_input, dtype=torch.int64, device=self.device).unsqueeze(0), \
                   torch.tensor(length, dtype=torch.int64, device=self.device).unsqueeze(0)
        return model_input, length


class BertTextClassificationPreprocessor(BaseTextClassificationPreprocessor):
    def __init__(self, cfg, mode='train', tokenizer=None, device='cpu'):
        super().__init__(cfg, mode, device)
        self.model_name = cfg['model']['model_name']
        if tokenizer is None:
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
        else:
            self.tokenizer = tokenizer

    def _tokenize(self, raw_text: str):
        tokens = raw_text.split()
        # tokens = self._remove_stopwords(tokens)
        text = ' '.join(tokens)
        return self.tokenizer(text.lower().strip(), padding='max_length', truncation=True, max_length=self.max_len)

    def _encode(self, tokens):
        input_ids = tokens['input_ids']
        mask = tokens['attention_mask']
        token_type_ids = np.empty(0)
        if 'distil' not in self.model_name:
            token_type_ids = tokens['token_type_ids']
        return input_ids, mask, token_type_ids

    def process(self, text):
        tokens = self._tokenize(text)
        input_ids, mask, token_type_ids = self._encode(tokens)
        input_ids, mask, token_type_ids = np.array(input_ids), np.array(mask), np.array(token_type_ids)
        if self.mode == 'inference':
            return torch.tensor([input_ids], dtype=torch.int64, device=self.device), \
                   torch.tensor([mask], dtype=torch.int64, device=self.device), \
                   torch.tensor([token_type_ids], dtype=torch.int64, device=self.device),
        return input_ids, mask, token_type_ids
