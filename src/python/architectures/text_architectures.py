import torch
import torch.nn as nn


class BidirectionalLSTM(nn.Module):
    def __init__(self, n_input, n_hidden, n_out):
        super(BidirectionalLSTM, self).__init__()
        self.hidden_size = n_hidden
        self.rnn = nn.LSTM(n_input, n_hidden, bidirectional=True)
        self.embedding = nn.Linear(n_hidden * 2, n_out)
        self.init_hidden_state = torch.nn.Parameter(torch.zeros((2, 1, self.hidden_size)), requires_grad=False)
        self.init_cell_state = torch.nn.Parameter(torch.zeros((2, 1, self.hidden_size)), requires_grad=False)

    def forward(self, batch):
        batch_size = batch.size(1)
        init_hidden_state = self.init_hidden_state.expand(-1, batch_size, -1).contiguous()
        init_cell_state = self.init_cell_state.expand(-1, batch_size, -1).contiguous()

        _, (final_hidden_state, _) = self.rnn(batch, (init_hidden_state, init_cell_state))
        final_hidden_state = final_hidden_state.view(batch_size, self.hidden_size*2)

        output = self.embedding(final_hidden_state)
        return output


class LSTMClassifier(nn.Module):
    """
    Credits to: https://github.com/prakashpandey9/Text-Classification-Pytorch/blob/master/models/LSTM.py
    """

    def __init__(self, batch_size, output_size, hidden_size, vocab_size, embedding_length, weights):
        super(LSTMClassifier, self).__init__()
        self.batch_size = batch_size
        self.output_size = output_size
        self.hidden_size = hidden_size
        self.vocab_size = vocab_size
        self.embedding_length = embedding_length

        self.word_embeddings = nn.Embedding(vocab_size, embedding_length)  # Initializing the look-up table.
        self.word_embeddings.weight = nn.Parameter(weights, requires_grad=False)

        self.lstm = BidirectionalLSTM(embedding_length, hidden_size, output_size)
        pass

    def forward(self, input_sentence):
        """
        Parameters
        ----------
        input_sentence: input_sentence of shape = (batch_size, num_sequences)

        Returns
        -------
        Output of the linear layer containing logits for positive & negative class which receives its input as the
        final_hidden_state of the LSTM
        final_output.shape = (batch_size, output_size)

        """

        ''' Here we will map all the indexes present in the input sequence to the corresponding word vector using 
        our pre-trained word_embedddins.'''
        # embedded input of shape = (batch_size, num_sequences,  embedding_length)
        batch = self.word_embeddings(input_sentence)
        # input.size() = (num_sequences, batch_size, embedding_length)
        batch = batch.permute(1, 0, 2)

        final_output = self.lstm(batch)
        return final_output


def get_text_clf_architectures():
    return []


def get_txt_clf_model(batch_size, num_classes, hidden_size, vocab_size, embedding_length, weights):
    return LSTMClassifier(batch_size, num_classes, hidden_size, vocab_size, embedding_length, weights)


TASK_TO_FUNC = {
    'txtclf': get_text_clf_architectures,
}


def get_text_architectures_by_type(task_type):
    """Returns out-of-box architectures list by task type"""
    if task_type not in TASK_TO_FUNC:
        return []
    return TASK_TO_FUNC[task_type]()
