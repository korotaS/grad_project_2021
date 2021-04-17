import os
import ssl

import torch
import torch.nn as nn
from torch.nn.utils.rnn import pack_padded_sequence, pad_packed_sequence
from transformers import AutoModelForSequenceClassification

ssl._create_default_https_context = ssl._create_unverified_context


class BidirectionalLSTM(nn.Module):
    def __init__(self, n_input, n_hidden, n_out):
        super(BidirectionalLSTM, self).__init__()
        self.hidden_size = n_hidden
        self.rnn = nn.LSTM(n_input, n_hidden, bidirectional=True, batch_first=True)
        self.embedding = nn.Linear(n_hidden * 2, n_out)
        self.init_hidden_state = torch.nn.Parameter(torch.zeros((2, 1, self.hidden_size)), requires_grad=False)
        self.init_cell_state = torch.nn.Parameter(torch.zeros((2, 1, self.hidden_size)), requires_grad=False)

    def forward(self, batch, input_lengths):
        packed_batch = pack_padded_sequence(batch, input_lengths.cpu(), batch_first=True, enforce_sorted=False)
        output, _ = self.rnn(packed_batch)
        output_unpacked, _ = pad_packed_sequence(output, batch_first=True)
        out_forward = output_unpacked[range(len(output_unpacked)), input_lengths - 1, :self.hidden_size]
        out_reverse = output_unpacked[:, 0, self.hidden_size:]
        out_reduced = torch.cat((out_forward, out_reverse), 1)

        output = self.embedding(out_reduced)
        return output


class LSTMClassifier(nn.Module):
    """
    Credits to: https://github.com/prakashpandey9/Text-Classification-Pytorch/blob/master/models/LSTM.py
    """
    def __init__(self, output_size, hidden_size, vocab_size, embedding_length, weights):
        super(LSTMClassifier, self).__init__()
        self.output_size = output_size
        self.hidden_size = hidden_size
        self.vocab_size = vocab_size
        self.embedding_length = embedding_length

        self.word_embeddings = nn.Embedding(self.vocab_size, self.embedding_length)
        self.word_embeddings.weight = nn.Parameter(weights, requires_grad=False)

        self.lstm = BidirectionalLSTM(self.embedding_length, self.hidden_size, self.output_size)

    def forward(self, input_sentence, input_lengths):
        batch = self.word_embeddings(input_sentence)

        final_output = self.lstm(batch, input_lengths)
        return final_output


class BertClassifier(nn.Module):
    def __init__(self, model_name, cache_folder):
        super().__init__()
        self.model_name = model_name
        bert_cache_folder = os.path.join(cache_folder, 'bert')
        self.encoder = AutoModelForSequenceClassification.from_pretrained(self.model_name,
                                                                          cache_dir=bert_cache_folder)

    def forward(self, input_ids, input_mask, segment_ids):
        if 'distil' in self.model_name:
            return self.encoder(input_ids, input_mask).logits
        return self.encoder(input_ids, input_mask, segment_ids).logits


def get_text_clf_architectures():
    return []


def get_txt_clf_model(model_type, *args, **kwargs):
    if model_type == 'lstm':
        return LSTMClassifier(*args, **kwargs)
    elif model_type == 'bert':
        return BertClassifier(*args, **kwargs)


TASK_TO_FUNC = {
    'txtclf': get_text_clf_architectures,
}


def get_text_architectures_by_type(task_type):
    """Returns out-of-box architectures list by task type"""
    if task_type not in TASK_TO_FUNC:
        return []
    return TASK_TO_FUNC[task_type]()
