import os
import ssl

import gensim.downloader as api
import fasttext
import numpy as np

from src.python.embeddings.utils import _download_and_copy_ft

ssl._create_default_https_context = ssl._create_unverified_context

available_models = {
    'en_glove-wiki-gigaword-50': 'gensim',
    'en_glove-wiki-gigaword-100': 'gensim',
    'en_glove-wiki-gigaword-200': 'gensim',
    'en_glove-wiki-gigaword-300': 'gensim',
    'en_glove-twitter-25': 'gensim',

    'ru_fasttext_300': 'fasttext',
    'ru_fasttext_200': 'fasttext',
    'ru_fasttext_100': 'fasttext',
    'ru_fasttext_50': 'fasttext',
    'en_fasttext_300': 'fasttext',
    'en_fasttext_200': 'fasttext',
    'en_fasttext_100': 'fasttext',
    'en_fasttext_50': 'fasttext',
}


class Embedder:
    def __init__(self, model_name):
        self.model_name = model_name
        if self.model_name not in available_models:
            raise AttributeError(f'Model name {model_name} is not in model list: {available_models}')
        self.model_type = available_models[self.model_name]
        self.ft_emb_folder = 'embeddings/'
        self._download_emb()
        self.model = self._load_emb()
        if 'glove' in self.model_name:
            self.mean_glove_vec = self._get_mean_glove()

    def _download_emb(self):
        print(f'Downloading model {self.model_name}...')
        if available_models[self.model_name] == 'gensim':
            raw_model_name = self.model_name.split('_')[1]
            if raw_model_name not in os.listdir(api.base_dir):
                api.load(raw_model_name)
                print(f'Downloaded model {self.model_name} from {available_models[self.model_name]}.')
            else:
                print(f'{self.model_name} has been already downloaded.')
        elif available_models[self.model_name] == 'fasttext':
            lang, _, dim = self.model_name.split('_')
            _download_and_copy_ft(lang, dim, self.ft_emb_folder)
            print(f'Downloaded model {self.model_name} from {available_models[self.model_name]}.')
        else:
            pass

    def _load_emb(self):
        if self.model_type == 'gensim':
            raw_model_name = self.model_name.split('_')[1]
            return api.load(raw_model_name)
        elif self.model_type == 'fasttext':
            return fasttext.load_model(self.model_name)
        else:
            pass

    def _get_mean_glove(self):
        return np.mean([self.model.get_vector(word) for word in self.model.index_to_key], axis=0)

    def word_to_emb(self, word):
        if self.model_type == 'gensim':
            try:
                vector = self.model.get_vector(word)
            except KeyError:
                vector = self.mean_glove_vec
            return vector
        elif self.model_type == 'fasttext':
            return self.model.get_word_vector(word)
        else:
            pass
