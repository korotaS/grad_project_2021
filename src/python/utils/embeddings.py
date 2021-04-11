import os
import shutil
import ssl

import gensim.downloader as api
from torchtext.vocab import Vectors, FastText

ssl._create_default_https_context = ssl._create_unverified_context

available_models = {
    'en_glove-wiki-gigaword-50': 'gensim',
    'en_glove-wiki-gigaword-100': 'gensim',
    'en_glove-wiki-gigaword-200': 'gensim',
    'en_glove-wiki-gigaword-300': 'gensim',
    'en_glove-twitter-25': 'gensim',

    'ru_fasttext_300': 'fasttext',
    'en_fasttext_300': 'fasttext',
}


def get_vectors(model_name, emb_folder):
    if model_name not in available_models:
        raise AttributeError(f'Model name {model_name} is not in model list: {available_models}')

    model_type = available_models[model_name]
    if model_type == 'fasttext':
        lang = model_name.split('_')[0]
        fasttext_emb_folder = os.path.join(os.getcwd(), emb_folder, 'fasttext')
        if not os.path.exists(fasttext_emb_folder):
            os.mkdir(fasttext_emb_folder)
        vectors = FastText(language=lang, cache=fasttext_emb_folder)
        fasttext_model_name = os.path.join(fasttext_emb_folder, f'wiki.{lang}.vec')
        os.remove(fasttext_model_name)
        return vectors
    elif model_type == 'gensim':
        glove_emb_folder = os.path.join(os.getcwd(), emb_folder, 'glove')
        if not os.path.exists(glove_emb_folder):
            os.mkdir(glove_emb_folder)
        api.BASE_DIR = glove_emb_folder

        raw_model_name = model_name.split('_')[1]
        w2v_model_name = os.path.join(glove_emb_folder, raw_model_name + '.txt')
        if not os.path.exists(w2v_model_name + '.pt'):
            model_gensim = api.load(raw_model_name)
            model_gensim.save_word2vec_format(w2v_model_name)
            shutil.rmtree(os.path.join(glove_emb_folder, raw_model_name))
            os.remove(w2v_model_name)
        return Vectors(w2v_model_name, cache=glove_emb_folder)
