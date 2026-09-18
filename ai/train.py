"""
TRUEINSPECT - CarDD Dataset Training Script (v2)
=================================================
Trains a Faster R-CNN MobileNetV3 model on the real CarDD dataset.

Improvements over v1:
- Uses ALL available training samples (no cap) by default
- 12 epochs with StepLR learning rate scheduler
- Horizontal flip augmentation for better generalisation
- Saves best checkpoint (lowest epoch loss) not just the last one
- SGD optimizer with momentum (better convergence than AdamW for detection)
- Cosine annealing LR for smoother convergence
"""

import os
import sys
import json
import time
import random
import math

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

from PIL import Image
import torch
import torchvision
import torchvision.transforms.functional as TF
from torch.utils.data import Dataset, DataLoader
from torchvision.models.detection.faster_rcnn import FastRCNNPredictor

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "archive (15)")
TRAIN_JSON = os.path.join(DATASET_DIR, "train.json")
TRAIN_IMAGES_DIR = os.path.join(DATASET_DIR, "train")
OUTPUT_MODEL_DIR = os.path.join(BASE_DIR, "model")
MODEL_SAVE_PATH = os.path.join(OUTPUT_MODEL_DIR, "cardd_detector.pt")
BEST_MODEL_PATH = os.path.join(OUTPUT_MODEL_DIR, "cardd_detector_best.pt")
METADATA_SAVE_PATH = os.path.join(OUTPUT_MODEL_DIR, "metadata.json")

# ---------------------------------------------------------------------------
# Category mapping from CarDD → TRUEINSPECT taxonomy
# CarDD categories:
#   1: dent        → Dent
#   2: scratch     → Scratch
#   3: crack       → Crack
#   4: glass shatter → Glass Damage
#   5: lamp broken → Broken Lamp
#   6: tire flat   → Tire Damage
# ---------------------------------------------------------------------------
CATEGORY_MAPPING = {
    1: {"name": "Dent",         "component": "Body Panel"},
    2: {"name": "Scratch",      "component": "Body Panel"},
    3: {"name": "Crack",        "component": "Bumper / Trim"},
    4: {"name": "Glass Damage", "component": "Windshield / Glass"},
    5: {"name": "Broken Lamp",  "component": "Headlamp / Taillamp"},
    6: {"name": "Tire Damage",  "component": "Tire / Wheel"},
}


# ---------------------------------------------------------------------------
# Dataset
# ---------------------------------------------------------------------------
class CarDDDataset(Dataset):
    def __init__(self, json_path, images_dir, augment=False, max_samples=None):
        self.images_dir = images_dir
        self.augment = augment

        with open(json_path, 'r') as f:
            data = json.load(f)

        # Map image_id → image info
        self.images_info = {img['id']: img for img in data['images']}

        # Group annotations by image_id
        self.annotations = {}
        for ann in data['annotations']:
            img_id = ann['image_id']
            if img_id not in self.annotations:
                self.annotations[img_id] = []
            self.annotations[img_id].append(ann)

        # Keep images that have valid annotations and exist on disk
        self.valid_image_ids = []
        for img_id in self.images_info:
            if img_id in self.annotations and len(self.annotations[img_id]) > 0:
                file_name = self.images_info[img_id]['file_name']
                img_path = os.path.join(self.images_dir, file_name)
                if os.path.exists(img_path):
                    self.valid_image_ids.append(img_id)

        if max_samples and max_samples < len(self.valid_image_ids):
            self.valid_image_ids = self.valid_image_ids[:max_samples]

        print(f"[CarDD Dataset] Loaded {len(self.valid_image_ids)} images with valid annotations. Augment={augment}")

    def __len__(self):
        return len(self.valid_image_ids)

    def __getitem__(self, idx):
        img_id = self.valid_image_ids[idx]
        img_info = self.images_info[img_id]
        img_path = os.path.join(self.images_dir, img_info['file_name'])

        image = Image.open(img_path).convert("RGB")
        img_w, img_h = image.size

        boxes = []
        labels = []

        for ann in self.annotations[img_id]:
            # COCO bbox: [x, y, width, height]
            x, y, w, h = ann['bbox']
            x1 = max(0.0, float(x))
            y1 = max(0.0, float(y))
            x2 = min(float(img_w), x1 + max(1.0, float(w)))
            y2 = min(float(img_h), y1 + max(1.0, float(h)))

            if x2 > x1 and y2 > y1:
                boxes.append([x1, y1, x2, y2])
                labels.append(ann['category_id'])  # 1..6

        if len(boxes) == 0:
            boxes = torch.zeros((0, 4), dtype=torch.float32)
            labels = torch.zeros((0,), dtype=torch.int64)
        else:
            # ----------------------------------------------------------------
            # Augmentation: random horizontal flip
            # ----------------------------------------------------------------
            if self.augment and random.random() > 0.5:
                image = TF.hflip(image)
                flipped_boxes = []
                for b in boxes:
                    x1, y1, x2, y2 = b
                    new_x1 = img_w - x2
                    new_x2 = img_w - x1
                    flipped_boxes.append([new_x1, y1, new_x2, y2])
                boxes = flipped_boxes

            # ----------------------------------------------------------------
            # Augmentation: random brightness/contrast jitter
            # ----------------------------------------------------------------
            if self.augment and random.random() > 0.5:
                brightness_factor = random.uniform(0.8, 1.2)
                contrast_factor   = random.uniform(0.85, 1.15)
                image = TF.adjust_brightness(image, brightness_factor)
                image = TF.adjust_contrast(image, contrast_factor)

            boxes  = torch.as_tensor(boxes,  dtype=torch.float32)
            labels = torch.as_tensor(labels, dtype=torch.int64)

        img_tensor = TF.to_tensor(image)

        target = {
            "boxes":    boxes,
            "labels":   labels,
            "image_id": torch.tensor([img_id])
        }

        return img_tensor, target


def collate_fn(batch):
    return tuple(zip(*batch))


# ---------------------------------------------------------------------------
# Model factory
# ---------------------------------------------------------------------------
def get_model(num_classes=7):
    """Faster R-CNN MobileNetV3-Large-FPN with pretrained COCO backbone."""
    model = torchvision.models.detection.fasterrcnn_mobilenet_v3_large_320_fpn(
        weights=torchvision.models.detection.FasterRCNN_MobileNet_V3_Large_320_FPN_Weights.DEFAULT
    )
    in_features = model.roi_heads.box_predictor.cls_score.in_features
    model.roi_heads.box_predictor = FastRCNNPredictor(in_features, num_classes=num_classes)
    return model


# ---------------------------------------------------------------------------
# Training loop
# ---------------------------------------------------------------------------
def train_model(epochs=12, batch_size=4, max_samples=None, lr=0.005, resume=False, start_epoch=0, initial_best_loss=math.inf):
    os.makedirs(OUTPUT_MODEL_DIR, exist_ok=True)
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Training device: {device}", flush=True)

    # Dataset & DataLoader (with augmentation)
    dataset = CarDDDataset(TRAIN_JSON, TRAIN_IMAGES_DIR, augment=True, max_samples=max_samples)
    dataloader = DataLoader(
        dataset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=0,
        collate_fn=collate_fn
    )

    print(f"Total training batches per epoch: {len(dataloader)}", flush=True)

    # Model
    model = get_model(num_classes=7)
    model.to(device)

    # SGD with momentum — proven better than AdamW for object detection fine-tuning
    params = [p for p in model.parameters() if p.requires_grad]
    optimizer = torch.optim.SGD(params, lr=lr, momentum=0.9, weight_decay=0.0005)

    # Cosine annealing LR: smoothly decays from lr → 0 over all epochs
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs, eta_min=lr * 0.01)

    best_loss = initial_best_loss
    best_epoch = start_epoch

    if resume and os.path.exists(BEST_MODEL_PATH):
        print(f"[Training] Resuming from checkpoint: {BEST_MODEL_PATH}", flush=True)
        model.load_state_dict(torch.load(BEST_MODEL_PATH, map_location=device))
        for _ in range(start_epoch):
            scheduler.step()
        print(f"[Training] Resumed at Epoch {start_epoch + 1}/{epochs} | Best Loss: {best_loss:.4f} | LR: {scheduler.get_last_lr()[0]:.6f}", flush=True)

    print("--- Starting CarDD Model Training (v2) ---", flush=True)
    start_time = time.time()

    for epoch in range(start_epoch, epochs):
        model.train()
        epoch_loss = 0.0
        step = 0

        for images, targets in dataloader:
            images  = list(img.to(device) for img in images)
            targets = [{k: v.to(device) for k, v in t.items()} for t in targets]

            try:
                loss_dict = model(images, targets)
                losses    = sum(loss for loss in loss_dict.values())

                optimizer.zero_grad()
                losses.backward()
                # Gradient clipping prevents exploding gradients
                torch.nn.utils.clip_grad_norm_(params, max_norm=5.0)
                optimizer.step()

                epoch_loss += losses.item()
                step += 1

                if step % 10 == 0 or step == len(dataloader):
                    breakdown = ", ".join(
                        [f"{k}: {v.item():.3f}" for k, v in loss_dict.items()]
                    )
                    print(
                        f"[Epoch {epoch+1}/{epochs}] Step {step}/{len(dataloader)} | "
                        f"Loss: {losses.item():.4f} ({breakdown}) | "
                        f"LR: {scheduler.get_last_lr()[0]:.6f}",
                        flush=True
                    )

            except Exception as e:
                print(f"[Training] Skipping batch due to error: {e}", flush=True)
                continue

        scheduler.step()

        avg_loss = epoch_loss / max(1, step)
        print(f"--> Epoch {epoch+1} done. Avg loss: {avg_loss:.4f}", flush=True)

        # Save best checkpoint
        if avg_loss < best_loss:
            best_loss = avg_loss
            best_epoch = epoch + 1
            torch.save(model.state_dict(), BEST_MODEL_PATH)
            print(f"    [+] Best model updated (epoch {best_epoch}, loss {best_loss:.4f})", flush=True)

    total_time = time.time() - start_time
    print(f"--- Training Completed in {total_time:.1f}s ---", flush=True)
    print(f"Best checkpoint: epoch {best_epoch}, loss {best_loss:.4f}", flush=True)

    # Copy best weights as the production model
    import shutil
    shutil.copy(BEST_MODEL_PATH, MODEL_SAVE_PATH)
    print(f"Production weights saved to: {MODEL_SAVE_PATH}", flush=True)

    # Save metadata
    metadata = {
        "model_architecture": "fasterrcnn_mobilenet_v3_large_320_fpn",
        "dataset": "CarDD",
        "num_classes": 7,
        "classes": {
            "0": "Background",
            "1": "Dent",
            "2": "Scratch",
            "3": "Crack",
            "4": "Glass Damage",
            "5": "Broken Lamp",
            "6": "Tire Damage"
        },
        "training_samples": len(dataset),
        "epochs": epochs,
        "best_epoch": best_epoch,
        "best_loss": round(best_loss, 4),
        "augmentation": ["horizontal_flip", "brightness_jitter", "contrast_jitter"],
        "optimizer": "SGD+momentum",
        "lr_scheduler": "CosineAnnealingLR",
        "trained_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }
    with open(METADATA_SAVE_PATH, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"Metadata saved to: {METADATA_SAVE_PATH}", flush=True)
    print("Model ready for inference!", flush=True)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    epochs            = 12
    samples           = None   # Use ALL available samples by default
    batch_size        = 4
    lr                = 0.005
    resume            = False
    start_epoch       = 0
    initial_best_loss = math.inf

    if len(sys.argv) > 1:
        epochs = int(sys.argv[1])
    if len(sys.argv) > 2:
        arg = sys.argv[2]
        samples = None if arg.lower() == "all" else int(arg)
    if len(sys.argv) > 3:
        batch_size = int(sys.argv[3])
    if len(sys.argv) > 4:
        lr = float(sys.argv[4])
    if len(sys.argv) > 5:
        resume = sys.argv[5].lower() in ["true", "1", "yes", "resume", "--resume"]
    if len(sys.argv) > 6:
        start_epoch = int(sys.argv[6])
    if len(sys.argv) > 7:
        initial_best_loss = float(sys.argv[7])

    print(f"Config: epochs={epochs}, samples={samples or 'ALL'}, batch={batch_size}, lr={lr}, resume={resume}, start_epoch={start_epoch}", flush=True)
    train_model(epochs=epochs, batch_size=batch_size, max_samples=samples, lr=lr, resume=resume, start_epoch=start_epoch, initial_best_loss=initial_best_loss)
