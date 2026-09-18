# TRUEINSPECT - AI Computer Vision Model Architecture

This directory is dedicated to the computer vision model weights and training pipelines for exterior vehicle damage detection.

---

## 1. Primary Datasets

### CarDD (Car Damage Dataset)
- **Primary source**: CarDD Benchmark Dataset for automotive visual damage inspection.
- **Classes**: Dents, scratches, cracks, broken lighting, glass damage, and tire punctures.
- **Annotation format**: COCO / YOLO format with polygonal masks and bounding boxes $(x, y, w, h)$.

### CDDM (Comprehensive Damage Dataset)
- Secondary complementary dataset containing multi-angle automotive exterior damage images across diverse lighting, weather conditions, and paint finishes.

---

## 2. Model Pipeline

1. **Input**: Exterior vehicle photo in RGB format (JPEG/PNG).
2. **Feature Extraction**: Backbone architecture (e.g. ResNet-50-FPN or CSPDarknet).
3. **Region Proposal / Detection Head**: Detects damaged regions and produces bounding box coordinates $(x, y, \text{width}, \text{height})$.
4. **Classification & Severity Mapping**:
   - Classifies defect type: `Dent`, `Scratch`, `Crack`, `Broken Lamp`, `Glass Damage`, `Tire Damage`.
   - Maps component area (e.g., `Front Door`, `Rear Bumper`, `Bonnet`).
   - Assesses severity (`Minor`, `Moderate`, `Major`) based on relative damaged area pixel ratio.
5. **Output Schema**:
```json
{
  "defectType": "Dent",
  "component": "Front Door",
  "severity": "Moderate",
  "confidence": 0.91,
  "boundingBox": {
    "x": 120,
    "y": 80,
    "width": 220,
    "height": 150
  }
}
```

---

## 3. Placing Trained Weights

Export your trained PyTorch / TorchScript / ONNX model weights to:

```text
ai/model/cardd_detector.pt
```

The inference server `ai/inference/app.py` automatically checks for this file upon startup.

---

## 4. Technical Honesty Principle (Requirement 18)

TRUEINSPECT strictly enforces **no fabricated model predictions**. If no model weights are loaded or if the AI service is offline:
- The system reports `AI detection service unavailable` or `No visible defects detected`.
- It **never** displays fake bounding boxes, artificial confidence scores, or fabricated 95% claims.
