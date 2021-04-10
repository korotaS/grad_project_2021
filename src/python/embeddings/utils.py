import os
import ssl

try:
    from urllib.request import urlopen
except ImportError:
    from urllib2 import urlopen

import fasttext
import fasttext.util as ftutil
from tqdm.auto import tqdm

ssl._create_default_https_context = ssl._create_unverified_context


def _download_and_copy_ft(lang, dim, emb_folder):
    loaded_models = [name for name in os.listdir(emb_folder) if name.endswith('.bin')]
    to_reduce = False
    if f'cc.{lang}.{dim}.bin' not in loaded_models:
        if f'cc.{lang}.300.bin' in loaded_models:
            to_reduce = True
        else:
            _download_fasttext(lang, emb_folder)
            print(f'Loaded model {lang}_fasttext_300 from fasttext.')
            os.remove(emb_folder + f'cc.{lang}.300.bin.gz')
            if dim != '300':
                to_reduce = True

    if to_reduce:
        print(f'Reducing cc.{lang}.300.bin to dim {dim}')
        ft_full = fasttext.load_model(emb_folder + f'cc.{lang}.300.bin')
        ft_reduced = ftutil.reduce_model(ft_full, int(dim))
        ft_reduced.save_model(emb_folder + f'cc.{lang}.{dim}.bin')
        print(f'Reducing complete.')

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