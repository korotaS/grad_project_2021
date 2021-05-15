import pytorch_lightning as pl
import segmentation_models_pytorch as smp
import torch
import torch.nn as nn
import numpy as np
from sklearn.metrics import classification_report, accuracy_score

from src.python.utils.draw import draw_im_clf_predictions, draw_confusion_matrix, draw_prediction_masks_on_image, \
    draw_prediction_masks
from src.python.utils.utils import _configure_optimizers, StoppingTrainingException


class ImageClassificationModel(pl.LightningModule):
    def __init__(self, model, architecture, optimizer_cfg, scheduler_cfg, criterion, labels, freeze_backbone):
        super().__init__()
        self.model = model
        self.architecture = architecture
        self.optimizer_cfg = optimizer_cfg
        self.scheduler_cfg = scheduler_cfg
        self.criterion = criterion
        self.labels = labels
        self.freeze_backbone = freeze_backbone
        self.metrics = {
            'acc': pl.metrics.Accuracy()
        }

        self.running = True

    def forward(self, x):
        return self.model(x)

    def _step(self, inputs, labels):
        if self.architecture == 'inception_v3':
            outputs, aux_outputs = self.model(inputs)
            loss1 = self.criterion(outputs, labels)
            loss2 = self.criterion(aux_outputs, labels)
            loss = loss1 + 0.4 * loss2
        else:
            outputs = self.model(inputs)
            loss = self.criterion(outputs, labels.long())
        return outputs, loss

    def training_step(self, batch, batch_idx):
        if not self.running:
            print('\nSTOPPING TRAINING\n')
            raise StoppingTrainingException

        self.model.train()
        raw_images, inputs, labels = batch
        outputs, loss = self._step(inputs, labels)
        _, preds = torch.max(outputs, 1)
        # socketio.emit('batch', {'batch': str(batch_idx)})
        tb_logs = {
            'train_loss': loss.cpu()
        }
        for metric_name, metric in self.metrics.items():
            tb_logs['train_' + metric_name] = metric(preds.cpu(), labels.data.cpu().int())
        for key, value in tb_logs.items():
            self.log(key, value)
        return {
            'loss': loss.cpu(),
        }

    def validation_step(self, batch, batch_idx):
        if not self.running:
            print('\nSTOPPING TRAINING\n')
            raise StoppingTrainingException

        self.model.eval()
        raw_images, inputs, labels = batch
        outputs, loss = self._step(inputs, labels)
        _, preds = torch.max(outputs, 1)
        logits = nn.functional.softmax(outputs, dim=1)
        tb_logs = {
            'val_loss': loss.cpu()
        }
        for metric_name, metric in self.metrics.items():
            tb_logs['val_' + metric_name] = metric(preds.cpu(), labels.data.cpu().int())
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

    def test_step(self, batch, batch_idx):
        return self.validation_step(batch, batch_idx)

    def test_epoch_end(self, outputs):
        true_labels = [int(one_lab.item()) for x in outputs for one_lab in x["true_labels"]]
        pred_labels = [int(one_lab.item()) for x in outputs for one_lab in x["pred_labels"]]
        print('\n', classification_report(true_labels, pred_labels, target_names=self.labels, digits=3))

        avg_loss = torch.stack([x["loss"] for x in outputs]).mean().item()
        self.log('val_loss', avg_loss)
        self.log('val_acc', accuracy_score(true_labels, pred_labels))

    def configure_optimizers(self):
        return _configure_optimizers(self.optimizer_cfg, self.scheduler_cfg, self.model, self.freeze_backbone)


# Only semantic segmentation (instance segmentation TBD)
class ImageSegmentationModel(pl.LightningModule):
    def __init__(self, model, optimizer_cfg, scheduler_cfg, criterion):
        super().__init__()
        self.model = model
        self.optimizer_cfg = optimizer_cfg
        self.scheduler_cfg = scheduler_cfg
        self.criterion = criterion
        self.metrics = {
            'iou': smp.utils.metrics.IoU()
        }

        self.running = True

    def forward(self, x):
        return self.model(x)

    def training_step(self, batch, batch_idx):
        if not self.running:
            print('\nSTOPPING TRAINING\n')
            raise StoppingTrainingException

        self.model.train()
        raw_images, images, masks = batch
        outputs = self.model(images)
        loss = self.criterion(outputs, masks.long())
        # socketio.emit('batch', {'batch': str(batch_idx)})
        tb_logs = {
            'train_loss': loss.cpu()
        }
        for metric_name, metric in self.metrics.items():
            tb_logs['train_' + metric_name] = metric(outputs.cpu(), masks.cpu())
        for key, value in tb_logs.items():
            self.log(key, value)
        return {
            'loss': loss.cpu(),
        }

    def validation_step(self, batch, batch_idx):
        if not self.running:
            print('\nSTOPPING TRAINING\n')
            raise StoppingTrainingException

        self.model.eval()
        raw_images, images, masks = batch
        outputs = self.model(images)
        loss = self.criterion(outputs, masks.long())
        tb_logs = {
            'val_loss': loss.cpu()
        }
        res_metrics = {}
        for metric_name, metric in self.metrics.items():
            res_metric = metric(outputs.cpu(), masks.cpu()).item()
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
        metrics = [self.metrics['iou'](pr, tr) for pr, tr in zip(pred_masks, true_masks)]
        seg_type = 'single' if true_masks[0].shape[0] == 1 else 'multi'
        fig = draw_prediction_masks_on_image(raw_images, pred_masks, true_masks, metrics, 4, 2, seg_type=seg_type)
        self.logger.experiment.add_figure('predictions', fig, self.current_epoch)
        fig = draw_prediction_masks(raw_images, pred_masks, 4, 2, seg_type=seg_type)
        self.logger.experiment.add_figure('predictions_raw', fig, self.current_epoch)

    def test_step(self, batch, batch_idx):
        return self.validation_step(batch, batch_idx)

    def test_epoch_end(self, outputs):
        true_masks = [mask for o in outputs for mask in o['true_masks']]
        pred_masks = [mask for o in outputs for mask in o['pred_masks']]

        mean_class_ious = []
        for class_id in range(true_masks[0].shape[0]):
            class_ious = [self.metrics['iou'](pr[class_id], tr[class_id]).cpu().numpy()
                          for pr, tr in zip(pred_masks, true_masks)]
            mean_class_iou = np.mean(class_ious)
            mean_class_ious.append(mean_class_iou)
            self.log(f'val_iou_class_{class_id}', mean_class_iou)
            # print(f'\nMean IOU for class {class_id}: {mean_class_iou:.3f}')

        mean_iou = np.mean(mean_class_ious)
        avg_loss = torch.stack([x["loss"] for x in outputs]).mean().item()
        self.log('val_loss', avg_loss)
        self.log('val_iou', mean_iou)

    def configure_optimizers(self):
        return _configure_optimizers(self.optimizer_cfg, self.scheduler_cfg, self.model)
