# Dataset structures

## 1. Image classification

File structure: 
```
dataset_for_im_clf 
│
└───train
│   │   info.json
│   └───images
│       │   image1.jpg
│       │   image2.jpg
└───val
    │   info.json
    └───images
        │   image1.jpg
        │   image2.jpg
```

info.json:

```json
{
    "0": {
        "filename": "image1.jpg",
        "label": "label1"
    },
    "1": {
        "filename": "image2.jpg",
        "label": "label2"
    },
    ...
}
```

## 2. Image segmentation

File structure: 
```
dataset_for_im_sgm
│
└───train
│   │   info.json
│   └───images
│   │   │   image1.jpg
│   │   │   image2.jpg
│   └───masks
│       │   mask1.png
│       │   mask2.png
└───val
    │   info.json
    └───images
    │   │   image1.jpg
    │   │   image2.jpg
    └───masks
        │   mask1.png
        │   mask2.png
```

info.json:

```json
{
    "0": {
        "image_filename": "image1.jpg",
        "mask_filename": "mask1.png"
    },
    "1": {
        "image_filename": "image2.jpg",
        "mask_filename": "mask2.png"
    },
    ...
}
```

## 3. Text classification

### 3.1 With split=false

If you have a not very big dataset, you can put every text in one file with 
this file structure: 

```
dataset_for_txt_clf
│   train.json
│   val.json
```

train/val.json:

```json
{
    "0": {
        "text": "This is text 1.",
        "label": "label1"
    },
    "1": {
        "text": "This is text 2.",
        "label": "label2"
    },
    ...
}
```

### 3.2 With split=true

If you have a big dataset, you should split texts into separate filed with 
this file structure: 

```
dataset_for_txt_clf
│
└───train
│   │   1.json
│   │   2.json
└───val
    │   1.json
    │   2.json
```

every {i}.json:
```json
{
    "text": "This is text 1.",
    "label": "label1"
}
```


