import os
import ssl

try:
    from urllib.request import urlopen
except ImportError:
    from urllib2 import urlopen

import fasttext
import fasttext.util as ftutil
import gensim.downloader as api
from tqdm.auto import tqdm

ssl._create_default_https_context = ssl._create_unverified_context

available_models = {
    'en_glove-wiki-gigaword-50': 'gensim',
    'en_glove-wiki-gigaword-100': 'gensim',
    'en_glove-wiki-gigaword-200': 'gensim',
    'en_glove-wiki-gigaword-300': 'gensim',

    'ru_fasttext_300': 'fasttext',
    'ru_fasttext_200': 'fasttext',
    'ru_fasttext_100': 'fasttext',
    'ru_fasttext_50': 'fasttext',
    'en_fasttext_300': 'fasttext',
    'en_fasttext_200': 'fasttext',
    'en_fasttext_100': 'fasttext',
}


def download_pretrained(model_name):
    if model_name not in available_models:
        raise AttributeError(f'Model name {model_name} is not in model list: {available_models}')

    print(f'Downloading model {model_name}...')
    if available_models[model_name] == 'gensim':
        raw_model_name = model_name.split('_')[1]
        if raw_model_name not in os.listdir(api.base_dir):
            api.load(raw_model_name)
    elif available_models[model_name] == 'fasttext':
        lang, _, dim = model_name.split('_')
        download_and_copy_ft(lang, dim)
    else:
        pass
    print(f'Loaded model {model_name} from {available_models[model_name]}.')


def download_and_copy_ft(lang, dim):
    emb_folder = 'embeddings/'
    loaded_models = [name for name in os.listdir(emb_folder) if name.endswith('.bin')]
    if f'cc.{lang}.{dim}.bin' not in loaded_models:
        if f'cc.{lang}.300.bin' in loaded_models:
            ft_full = fasttext.load_model(emb_folder + f'cc.{lang}.300.bin')
            ft_reduced = ftutil.reduce_model(ft_full, int(dim))
            ft_reduced.save_model(emb_folder + f'cc.{lang}.{dim}.bin')

            del ft_full
            del ft_reduced
        else:
            _download_fasttext(lang, emb_folder)
            os.remove(emb_folder + f'cc.{lang}.300.bin.gz')
            if dim != '300':
                ft_full = fasttext.load_model(emb_folder + f'cc.{lang}.300.bin')
                ft_reduced = ftutil.reduce_model(ft_full, int(dim))
                ft_reduced.save_model(emb_folder + f'cc.{lang}.{dim}.bin')
                del ft_reduced
                del ft_full


def _download_fasttext(lang, folder):
    """
    slightly modified
    https://github.com/facebookresearch/fastText/blob/master/python/fasttext_module/fasttext/util/util.py
    """
    file_name = f"cc.{lang}.300.bin"
    raw_gz_file_name = f"{file_name}.gz"
    gz_file_name = folder + raw_gz_file_name
    url = f"https://dl.fbaipublicfiles.com/fasttext/vectors-crawl/{raw_gz_file_name}"
    _download_file(url, gz_file_name)


def _download_file(url, write_file_name, chunk_size=2 ** 13):
    """
    slightly modified
    https://github.com/facebookresearch/fastText/blob/master/python/fasttext_module/fasttext/util/util.py
    """
    response = urlopen(url)
    if hasattr(response, 'getheader'):
        file_size = int(response.getheader('Content-Length').strip())
    else:
        file_size = int(response.info().getheader('Content-Length').strip())
    downloaded = 0
    download_file_name = write_file_name + ".part"
    with open(download_file_name, 'wb') as f:
        with tqdm(unit='B', unit_scale=True, unit_divisor=1024, miniters=1, total=file_size) as pbar:
            while True:
                chunk = response.read(chunk_size)
                downloaded += len(chunk)
                if not chunk:
                    break
                f.write(chunk)
                pbar.update(len(chunk))

    os.rename(download_file_name, write_file_name)
