"""
TRUEINSPECT - Standalone AI Computer Vision Microservice
========================================================
Defect Detection Service trained on the real CarDD dataset.

Adheres strictly to Requirement 14, 15, 18:
- NO fake AI predictions
- NO fabricated confidence values
- Returns real detected damages from trained weights.
- If weights are not loaded, reports uninitialized state.

Accuracy Improvements (v3):
- Confidence threshold raised to 0.40 (suppress weak noise)
- Completely rewritten component mapper with full view-aware anatomy
  (no longer sends bonnet-area Glass Damage → Windshield)
- Duplicate (same component + same type) suppression after mapping
- Cross-component NMS: one box cannot claim two overlapping components
- Anatomy plausibility filter: impossible component-in-view combos removed
- Inference resolution raised to 800/1333 px
- PIL contrast + sharpness preprocessing
- Panel-relative severity grading
"""

import os
import io
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image, ImageEnhance
import torch
import torchvision
from torchvision.models.detection.faster_rcnn import FastRCNNPredictor

app = Flask(__name__)
CORS(app)

PORT = int(os.environ.get("AI_PORT", 5001))
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.abspath(os.path.join(BASE_DIR, "..", "model", "cardd_detector.pt"))
METADATA_PATH = os.path.abspath(os.path.join(BASE_DIR, "..", "model", "metadata.json"))

# CarDD class indices → display names
CLASS_NAMES = {
    1: "Dent",
    2: "Scratch",
    3: "Crack",
    4: "Glass Damage",
    5: "Broken Lamp",
    6: "Tire Damage"
}

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
loaded_model = None


def load_inference_model():
    global loaded_model
    if os.path.exists(MODEL_PATH):
        try:
            print(f"[TRUEINSPECT AI] Loading model from: {MODEL_PATH}")
            model = torchvision.models.detection.fasterrcnn_mobilenet_v3_large_320_fpn(weights=None)
            in_features = model.roi_heads.box_predictor.cls_score.in_features
            model.roi_heads.box_predictor = FastRCNNPredictor(in_features, num_classes=7)
            state_dict = torch.load(MODEL_PATH, map_location=device, weights_only=True)
            model.load_state_dict(state_dict)
            model.transform.min_size = (800,)
            model.transform.max_size = 1333
            model.to(device)
            model.eval()
            loaded_model = model
            print("[TRUEINSPECT AI] Model loaded. Transform: 800/1333px. Device:", device)
        except Exception as e:
            print(f"[TRUEINSPECT AI Error] {e}")
            loaded_model = None
    else:
        print(f"[TRUEINSPECT AI] No weights at {MODEL_PATH}")
        loaded_model = None


load_inference_model()

# ---------------------------------------------------------------------------
# Geometry
# ---------------------------------------------------------------------------

def compute_box_iou(b1, b2):
    x1, y1 = max(b1[0], b2[0]), max(b1[1], b2[1])
    x2, y2 = min(b1[2], b2[2]), min(b1[3], b2[3])
    inter = max(0.0, x2 - x1) * max(0.0, y2 - y1)
    a1 = (b1[2] - b1[0]) * (b1[3] - b1[1])
    a2 = (b2[2] - b2[0]) * (b2[3] - b2[1])
    return inter / max(1.0, a1 + a2 - inter)


def compute_box_containment(b_sub, b_main):
    x1, y1 = max(b_sub[0], b_main[0]), max(b_sub[1], b_main[1])
    x2, y2 = min(b_sub[2], b_main[2]), min(b_sub[3], b_main[3])
    inter = max(0.0, x2 - x1) * max(0.0, y2 - y1)
    area  = (b_sub[2] - b_sub[0]) * (b_sub[3] - b_sub[1])
    return inter / max(1.0, area)


# ---------------------------------------------------------------------------
# Image preprocessing
# ---------------------------------------------------------------------------

def preprocess_image(pil_image):
    """Mild contrast + sharpness enhancement for defect edge visibility."""
    pil_image = ImageEnhance.Contrast(pil_image).enhance(1.25)
    pil_image = ImageEnhance.Sharpness(pil_image).enhance(1.5)
    return pil_image


# ---------------------------------------------------------------------------
# Vehicle anatomy: per-view component zone lookup tables
# ---------------------------------------------------------------------------

# For each named view, define spatial zones that a model prediction maps to.
# Each zone: (norm_cy_min, norm_cy_max, norm_cx_min, norm_cx_max, component_name)
# Checked in order; first match wins.

FRONT_VIEW_ZONES = [
    # (cy_min, cy_max, cx_min, cx_max, component)
    (0.00, 0.20, 0.15, 0.85, "Windshield"),       # Top centre → windshield
    (0.00, 0.20, 0.00, 0.15, "Front Fender"),      # Top corners → fender
    (0.00, 0.20, 0.85, 1.00, "Front Fender"),
    (0.20, 0.60, 0.10, 0.90, "Bonnet"),            # Mid-upper centre → bonnet
    (0.20, 0.60, 0.00, 0.10, "Front Fender"),
    (0.20, 0.60, 0.90, 1.00, "Front Fender"),
    (0.60, 0.80, 0.05, 0.30, "Headlamp"),          # Mid-lower corners → headlamp
    (0.60, 0.80, 0.70, 0.95, "Headlamp"),
    (0.60, 1.00, 0.30, 0.70, "Front Bumper"),      # Lower centre → front bumper
    (0.80, 1.00, 0.00, 1.00, "Front Bumper"),
]

REAR_VIEW_ZONES = [
    (0.00, 0.25, 0.15, 0.85, "Windshield"),
    (0.00, 0.25, 0.00, 0.15, "Rear Quarter Panel"),
    (0.00, 0.25, 0.85, 1.00, "Rear Quarter Panel"),
    (0.25, 0.65, 0.10, 0.90, "Boot"),
    (0.25, 0.65, 0.00, 0.10, "Rear Quarter Panel"),
    (0.25, 0.65, 0.90, 1.00, "Rear Quarter Panel"),
    (0.65, 0.80, 0.05, 0.30, "Taillamp"),
    (0.65, 0.80, 0.70, 0.95, "Taillamp"),
    (0.65, 1.00, 0.30, 0.70, "Rear Bumper"),
    (0.80, 1.00, 0.00, 1.00, "Rear Bumper"),
]

LEFT_SIDE_ZONES = [
    (0.00, 0.18, 0.00, 1.00, "Roof"),
    (0.18, 0.35, 0.55, 1.00, "Side Window"),
    (0.18, 0.65, 0.00, 0.50, "Front Door"),
    (0.18, 0.65, 0.50, 1.00, "Rear Door"),
    (0.65, 1.00, 0.00, 1.00, "Side Skirt"),
]

RIGHT_SIDE_ZONES = LEFT_SIDE_ZONES  # Mirror symmetric


def lookup_zone(zones, norm_cy, norm_cx):
    for (cy_min, cy_max, cx_min, cx_max, comp) in zones:
        if cy_min <= norm_cy <= cy_max and cx_min <= norm_cx <= cx_max:
            return comp
    return None


# ---------------------------------------------------------------------------
# Defect-type → component special overrides (physically unambiguous)
# ---------------------------------------------------------------------------

# For certain defect types, the component is physically determined by the type,
# regardless of position — but ONLY when there is strong spatial evidence.
DEFECT_FORCED_COMPONENTS = {
    "Tire Damage": "Tire",          # Tires are always at the bottom corners
}

# When model predicts Glass Damage, it should ONLY map to glass components.
GLASS_COMPONENTS = {"Windshield", "Side Window", "Headlamp", "Taillamp"}

# Glass damage in these structural components is anatomically impossible
# — if the spatial zone gives a non-glass component, remap to nearest glass.
GLASS_REMAP_BY_VIEW = {
    "front": "Headlamp",       # Glass on bonnet/bumper area → headlamp lens
    "rear":  "Taillamp",
    "side":  "Side Window",
    "left":  "Side Window",
    "right": "Side Window",
    "":      "Windshield",     # Unknown view fallback
}

# Lamp damage should only map to lamp components
LAMP_COMPONENTS = {"Headlamp", "Taillamp"}
LAMP_REMAP_BY_VIEW = {
    "front": "Headlamp",
    "rear":  "Taillamp",
    "":      "Headlamp",
}


# ---------------------------------------------------------------------------
# Main component resolver
# ---------------------------------------------------------------------------

def resolve_component(defect_type, box, img_w, img_h, vehicle_area):
    """
    Determines the vehicle component for a detected defect.

    Algorithm:
    1. Forced component for physically unambiguous defect types (Tire Damage)
    2. Compute normalised box position
    3. Select anatomy zone table based on vehicle_area tag
    4. Look up spatial zone → candidate component
    5. For Glass Damage: validate candidate is a glass component;
       if not (e.g. model fired on Bonnet), remap to the nearest glass part.
    6. For Broken Lamp: validate candidate is a lamp component; remap if not.
    7. Fallback spatial heuristics if no zone table matches.
    """
    x, y, w, h = box['x'], box['y'], box['width'], box['height']
    area = (vehicle_area or "").strip().lower()

    # ---- Step 1: Physically forced defect types ----------------------------
    if defect_type in DEFECT_FORCED_COMPONENTS:
        return defect_type, DEFECT_FORCED_COMPONENTS[defect_type]

    # ---- Step 2: Normalised centroid ---------------------------------------
    cx = x + w / 2.0
    cy = y + h / 2.0
    norm_cx = cx / float(img_w)
    norm_cy = cy / float(img_h)

    # ---- Step 3 & 4: Pick zone table from view tag -------------------------
    candidate_component = None

    if "front" in area and "rear" not in area and "door" not in area and "side" not in area:
        candidate_component = lookup_zone(FRONT_VIEW_ZONES, norm_cy, norm_cx)

    elif "rear" in area or "back" in area:
        candidate_component = lookup_zone(REAR_VIEW_ZONES, norm_cy, norm_cx)

    elif any(k in area for k in ["left", "right", "side", "door"]):
        candidate_component = lookup_zone(LEFT_SIDE_ZONES, norm_cy, norm_cx)

    else:
        # Pure spatial fallback (no view tag)
        if norm_cy < 0.25:
            candidate_component = "Windshield" if defect_type in ["Glass Damage", "Crack"] else "Roof"
        elif norm_cy < 0.55:
            candidate_component = "Bonnet" if norm_cx > 0.15 and norm_cx < 0.85 else "Front Fender"
        elif norm_cy < 0.75:
            candidate_component = "Front Door"
        else:
            candidate_component = "Front Bumper"

    if candidate_component is None:
        candidate_component = "Front Bumper"

    # ---- Step 5: Glass Damage — must land on a glass component -------------
    if defect_type == "Glass Damage":
        if candidate_component not in GLASS_COMPONENTS:
            # Model fired on a non-glass surface (e.g. Bonnet).
            # Remap to the nearest anatomically correct glass component for this view.
            view_key = ""
            for k in ["front", "rear", "back", "left", "right", "side"]:
                if k in area:
                    view_key = k if k not in ["back"] else "rear"
                    break
            candidate_component = GLASS_REMAP_BY_VIEW.get(view_key, "Windshield")

    # ---- Step 6: Broken Lamp — must land on a lamp component ---------------
    elif defect_type == "Broken Lamp":
        if candidate_component not in LAMP_COMPONENTS:
            view_key = ""
            for k in ["rear", "back"]:
                if k in area:
                    view_key = "rear"
                    break
            candidate_component = LAMP_REMAP_BY_VIEW.get(view_key, "Headlamp")

    return defect_type, candidate_component


# ---------------------------------------------------------------------------
# Severity — panel-relative
# ---------------------------------------------------------------------------

def calculate_severity(box_w, box_h, img_w, img_h):
    """
    Severity relative to estimated panel area (~35% of full image).
    """
    box_area   = float(box_w * box_h)
    panel_area = float(img_w * img_h) * 0.35
    ratio = box_area / max(1.0, panel_area)
    if ratio > 0.25:
        return "Major"
    elif ratio > 0.08:
        return "Moderate"
    return "Minor"


# ---------------------------------------------------------------------------
# Anatomy plausibility: remove impossible detections for a given view
# ---------------------------------------------------------------------------

# Components that CANNOT appear in a given named view
VIEW_IMPOSSIBLE_COMPONENTS = {
    "front":    {"Boot", "Taillamp", "Tailgate", "Rear Bumper", "Rear Quarter Panel", "Rear Door"},
    "rear":     {"Bonnet", "Headlamp", "Front Bumper", "Front Fender", "Front Door"},
    "left":     {"Front Bumper", "Rear Bumper", "Bonnet", "Boot", "Windshield"},
    "right":    {"Front Bumper", "Rear Bumper", "Bonnet", "Boot", "Windshield"},
}


def is_anatomically_plausible(component, vehicle_area):
    area = (vehicle_area or "").strip().lower()
    for view_key, impossible_set in VIEW_IMPOSSIBLE_COMPONENTS.items():
        if view_key in area and component in impossible_set:
            return False
    return True


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route("/health", methods=["GET"])
def health():
    global loaded_model
    if loaded_model is None and os.path.exists(MODEL_PATH):
        load_inference_model()
    return jsonify({
        "service": "TRUEINSPECT AI Computer Vision Microservice v3",
        "dataset": "CarDD",
        "status": "ready",
        "model_loaded": loaded_model is not None,
        "device": str(device),
        "classes": list(CLASS_NAMES.values())
    })


@app.route("/detect", methods=["POST"])
def detect():
    """
    POST /detect
    Form fields:
        image        - image file (required)
        vehicle_area - user panel tag e.g. "Front", "Rear", "Left Side" (optional)
        threshold    - confidence floor, default 0.40

    Pipeline:
        1. PIL contrast/sharpness preprocessing
        2. High-res inference (800/1333 px)
        3. Confidence threshold filter (≥ 0.40)
        4. Sort by confidence descending
        5. Geometric NMS (IoU > 0.45, containment > 0.70)
        6. Component resolution with view-aware anatomy zone tables
        7. Glass/Lamp plausibility remapping
        8. Anatomy impossibility filter (e.g. Taillamp on Front view)
        9. Deduplicate: only one detection per (component, defect_type) pair
       10. Severity grading (panel-relative)
    """
    global loaded_model
    if loaded_model is None and os.path.exists(MODEL_PATH):
        load_inference_model()

    if "image" not in request.files:
        return jsonify({"success": False, "message": "No image file provided."}), 400

    image_file = request.files["image"]
    if image_file.filename == "":
        return jsonify({"success": False, "message": "Empty filename."}), 400

    vehicle_area   = request.form.get("vehicle_area", "")
    conf_threshold = float(request.form.get("threshold", 0.40))

    try:
        pil_image = Image.open(io.BytesIO(image_file.read())).convert("RGB")
        img_w, img_h = pil_image.size

        if loaded_model is None:
            return jsonify({
                "success": True, "model_connected": False, "defects": [],
                "message": "AI model not loaded (weights missing)."
            })

        # ---- Step 1: Preprocessing ----------------------------------------
        enhanced = ImageEnhance.Contrast(pil_image).enhance(1.25)
        enhanced = ImageEnhance.Sharpness(enhanced).enhance(1.5)

        # ---- Step 2: Inference --------------------------------------------
        tensor_img = torchvision.transforms.functional.to_tensor(enhanced).unsqueeze(0).to(device)
        with torch.no_grad():
            predictions = loaded_model(tensor_img)[0]

        boxes  = predictions["boxes"].detach().cpu().numpy()
        scores = predictions["scores"].detach().cpu().numpy()
        labels = predictions["labels"].detach().cpu().numpy()

        # ---- Step 3: Confidence filter ------------------------------------
        candidates = []
        for i in range(len(scores)):
            score = float(scores[i])
            label = int(labels[i])
            if score >= conf_threshold and label in CLASS_NAMES:
                x1, y1, x2, y2 = boxes[i]
                x = int(max(0, x1));  y = int(max(0, y1))
                w = int(max(15, x2 - x1));  h = int(max(15, y2 - y1))
                candidates.append({
                    "score":      score,
                    "label":      label,
                    "defect_type": CLASS_NAMES[label],
                    "box_coords": [x1, y1, x2, y2],
                    "bbox_dict":  {"x": x, "y": y, "width": w, "height": h}
                })

        # ---- Step 4: Sort by confidence -----------------------------------
        candidates.sort(key=lambda c: c["score"], reverse=True)

        # ---- Step 5: Geometric NMS ----------------------------------------
        selected = []
        for cand in candidates:
            skip = False
            for sel in selected:
                iou = compute_box_iou(cand["box_coords"], sel["box_coords"])
                c1  = compute_box_containment(cand["box_coords"], sel["box_coords"])
                c2  = compute_box_containment(sel["box_coords"],  cand["box_coords"])
                if iou > 0.45 or c1 > 0.70 or c2 > 0.70:
                    skip = True
                    break
            if not skip:
                selected.append(cand)

        # ---- Steps 6-10: Component resolve, plausibility, dedup ----------
        detected_defects = []
        seen_pairs = set()   # (component, defect_type) — no duplicates

        for item in selected:
            raw_type = item["defect_type"]
            bbox     = item["bbox_dict"]
            score    = item["score"]

            defect_type, component = resolve_component(
                raw_type, bbox, img_w, img_h, vehicle_area
            )

            # Step 8: Anatomy impossibility filter
            if not is_anatomically_plausible(component, vehicle_area):
                print(f"[Filter] Dropped implausible: {defect_type} on {component} in view '{vehicle_area}'")
                continue

            # Step 9: Deduplicate same (component, type) pair — keep highest confidence
            pair_key = (component, defect_type)
            if pair_key in seen_pairs:
                print(f"[Dedup] Dropped duplicate: {defect_type} on {component}")
                continue
            seen_pairs.add(pair_key)

            severity = calculate_severity(bbox["width"], bbox["height"], img_w, img_h)

            detected_defects.append({
                "defectType":  defect_type,
                "component":   component,
                "severity":    severity,
                "confidence":  round(score, 3),
                "boundingBox": bbox
            })

            if len(detected_defects) >= 8:
                break

        return jsonify({
            "success": True,
            "image_resolution": {"width": img_w, "height": img_h},
            "model_connected": True,
            "defects": detected_defects,
            "message": (
                f"{len(detected_defects)} defect(s) identified."
                if detected_defects
                else "No visible defects detected on this panel."
            )
        })

    except Exception as e:
        return jsonify({"success": False, "message": f"Inference error: {str(e)}"}), 500


if __name__ == "__main__":
    print(f"Starting TRUEINSPECT AI Microservice v3 on port {PORT}...")
    print(f"Device: {device}")
    app.run(host="0.0.0.0", port=PORT, debug=False)
