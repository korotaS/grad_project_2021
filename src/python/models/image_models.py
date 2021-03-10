import pytorch_lightning as pl
import segmentation_models_pytorch as smp
import torch
import torch.nn as nn

from src.python.utils.draw import draw_im_clf_predictions, draw_confusion_matrix, \
    draw_prediction_masks_on_image


class ImageClassificationModel(pl.LightningModule):
    def __init__(self, model, architecture, optimizer, criterion, labels):
        super().__init__()
        self.model = model
        self.architecture = architecture
        self.optimizer = optimizer
        self.criterion = criterion
        self.labels = labels

        self.metrics = {
            'acc': pl.metrics.Accuracy()
        }

    def forward(self, x):
        return self.model(x)

    def training_step(self, batch, batch_idx):
        raw_images, inputs, labels = batch
        if self.architecture == 'inception_v3':
            outputs, aux_outputs = self.model(inputs)
            loss1 = self.criterion(outputs, labels)
            loss2 = self.criterion(aux_outputs, labels)
            loss = loss1 + 0.4 * loss2
        else:
            outputs = self.model(inputs)
            loss = self.criterion(outputs, labels.long())
        _, preds = torch.max(outputs, 1)
        # socketio.emit('batch', {'batch': str(batch_idx)})
        tb_logs = {
            'train_loss': loss.cpu()
        }
        for metric_name, metric in self.metrics.items():
            tb_logs['train_' + metric_name] = metric(preds, labels.data)
        for key, value in tb_logs.items():
            self.log(key, value)
        return {
            'loss': loss.cpu(),
        }

    def validation_step(self, batch, batch_idx):
        raw_images, inputs, labels = batch
        if self.architecture == 'inception_v3':
            outputs, aux_outputs = self.model(inputs)
            loss1 = self.criterion(outputs, labels)
            loss2 = self.criterion(aux_outputs, labels)
            loss = loss1 + 0.4 * loss2
        else:
            outputs = self.model(inputs)
            loss = self.criterion(outputs, labels.long())
        _, preds = torch.max(outputs, 1)
        logits = nn.functional.softmax(outputs, dim=1)
        tb_logs = {
            'val_loss': loss.cpu()
        }
        for metric_name, metric in self.metrics.items():
            tb_logs['val_' + metric_name] = metric(preds, labels.data)
        for key, value in tb_logs.items():
            self.log(key, value)
        return {
            'loss': loss.cpu(),
            'images': raw_images,
            'logits': logits,
            'pred_labels': preds,
            'true_labels': labels
        }

    def validation_epoch_end(self, outputs):
        images = outputs[0]['images'].cpu().numpy()
        logits = outputs[0]['logits'].cpu().numpy()
        pred_labels = [output['pred_labels'].cpu().numpy() for output in outputs]
        pred_labels = [int(label) for batch in pred_labels for label in batch]
        true_labels = [output['true_labels'].cpu().numpy() for output in outputs]
        true_labels = [int(label) for batch in true_labels for label in batch]

        pred_figure = draw_im_clf_predictions(images, logits, self.labels, fontsize=10)
        self.logger.experiment.add_figure('predictions', pred_figure, self.current_epoch)

        conf_matr_figure = draw_confusion_matrix(pred_labels, true_labels, self.labels)
        self.logger.experiment.add_figure('confusion matrix', conf_matr_figure, self.current_epoch)

    def configure_optimizers(self):
        return self.optimizer


# Only semantic segmentation (instance segmentation TBD)
class ImageSegmentationModel(pl.LightningModule):
    def __init__(self, model, optimizer, criterion):
        super().__init__()
        self.model = model
        self.optimizer = optimizer
        self.criterion = criterion
        self.metrics = {
            'IOU': smp.utils.metrics.IoU()
        }

    def forward(self, x):
        return self.model(x)

    def training_step(self, batch, batch_idx):
        raw_images, images, masks = batch
        outputs = self.model(images)
        loss = self.criterion(outputs, masks.long())
        # socketio.emit('batch', {'batch': str(batch_idx)})
        tb_logs = {
            'train_loss': loss.cpu()
        }
        for metric_name, metric in self.metrics.items():
            tb_logs['train_'+metric_name] = metric(outputs, masks)
        for key, value in tb_logs.items():
            self.log(key, value)
        return {
            'loss': loss.cpu(),
        }

    def validation_step(self, batch, batch_idx):
        raw_images, images, masks = batch
        outputs = self.model(images)
        loss = self.criterion(outputs, masks.long())
        tb_logs = {
            'val_loss': loss.cpu()
        }
        res_metrics = {}
        for metric_name, metric in self.metrics.items():
            res_metric = metric(outputs, masks).item()
            tb_logs['val_' + metric_name] = res_metric
            res_metrics[metric_name] = res_metric
        for key, value in tb_logs.items():
            self.log(key, value)
        return {
            'loss': loss.cpu(),
            'pred_masks': outputs,
            'true_masks': masks,
            'raw_images': raw_images
        }

    def validation_epoch_end(self, outputs):
        true_masks = outputs[0]['true_masks']
        pred_masks = outputs[0]['pred_masks']
        raw_images = outputs[0]['raw_images']
        metrics = [self.metrics['IOU'](pr, tr) for pr, tr in zip(pred_masks, true_masks)]
        fig = draw_prediction_masks_on_image(raw_images, pred_masks, true_masks, metrics, 4, 2)
        self.logger.experiment.add_figure('predictions', fig, self.current_epoch)

    def configure_optimizers(self):
        return self.optimizer
