# Instruction for YAML input forms

There are 2 fields in The App which have to be entered by hand in YAML format:
train transforms and optimizer params.

## Train transforms

This field's input is based on albumentations
[Compose](https://albumentations.ai/docs/api_reference/core/composition/#albumentations.core.composition.Compose) and
[OneOf](https://albumentations.ai/docs/api_reference/core/composition/#albumentations.core.composition.OneOf) methods.

If you want to enter transforms, you need to choose transforms from
[transforms API](https://albumentations.ai/docs/api_reference/augmentations/transforms/) and to combine two methods
mentioned above, including probability of each transform wrt its direct parent. 
For example, this config
```yaml
- ShiftScaleRotate:
    shift_limit_y: 0.0625
    shift_limit_x: 0.0225
    p: 0.3
- OneOf:
    args:
      - Blur:
          blur_limit: 
            - 3
            - 3
          p: 1.0
      - GaussianBlur:
          p: 1.0
      - ImageCompression:
          p: 1.0
          quality_lower: 45
          quality_upper: 99
    p: 0.5
```
will produce Compose of ShiftScaleRotate and OneOf (made from Blur, GaussianBlur and 
ImageCompression). 

## Optimizer params

This field is pretty simple. You choose optimizer from 
[torch.optim](https://pytorch.org/docs/stable/optim.html)
and enter key-value pairs to YAML form. For example, if you choose optimizer 
Adadelta, you can enter its params like this:
```yaml
rho: 0.91
eps: 0.00001
weight_decay: 0.999
```
