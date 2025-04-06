#image_processing.py
import os
import io
import numpy as np
import colorsys
from uuid import uuid4
from PIL import Image
from rembg import remove  # type: ignore
from sklearn.cluster import KMeans  # type: ignore
from image_classes import Fit


def remove_background(file_binary: bytes) -> bytes:
    # Remove the background
    output_image = remove(file_binary)

    # Open the output image as an Image object
    try:
        img = Image.open(io.BytesIO(output_image)).convert("RGBA")
    except Exception as e:
        raise ValueError(f"Failed to open processed image: {e}")

    # Calculate the bounding box of the non-transparent part of the image
    bbox = img.getbbox()
    if not bbox:
        raise ValueError("No non-transparent pixels found in the image.")

    # Crop the image to the bounding box
    img = img.crop(bbox)

    # Calculate the new canvas size to ensure the image is centered
    max_side = max(img.width, img.height)
    canvas_size = (max_side, max_side)

    # Create a new blank canvas
    canvas = Image.new("RGBA", canvas_size, (255, 255, 255, 0))

    # Center the image on the canvas
    x = (canvas_size[0] - img.width) // 2
    y = (canvas_size[1] - img.height) // 2
    canvas.paste(img, (x, y), img)

    # Save the centered image to a bytes buffer
    centered_output = io.BytesIO()
    canvas.save(centered_output, format="PNG")
    centered_output.seek(0)

    return centered_output.getvalue()


def get_dominant_colors_with_percentage(image_path: str, k: int = 3) -> list[tuple[tuple[int, int, int], float]]:
    image = Image.open(image_path).convert("RGBA")
    np_image = np.array(image)
    mask = np_image[:, :, 3] > 0
    rgb_values = np_image[mask][:, :3]

    kmeans = KMeans(n_clusters=k)
    kmeans.fit(rgb_values)
    colors = kmeans.cluster_centers_
    labels = kmeans.labels_

    label_counts = np.bincount(labels)
    total_count = len(labels)

    percentages = label_counts / total_count

    return [(tuple(map(int, colors[i])), float(percentages[i])) for i in range(k)]


def rgb_to_hsv(rgb: tuple[int, int, int]) -> tuple[float, float, float]:
    """Convert RGB to HSV color space."""
    return colorsys.rgb_to_hsv(rgb[0] / 255.0, rgb[1] / 255.0, rgb[2] / 255.0)


def color_complementarity(hsv1: tuple[float, float, float], hsv2: tuple[float, float, float]) -> float:
    """Calculate the complementarity score between two HSV colors."""
    hue_diff = abs(hsv1[0] - hsv2[0])
    complementarity_score = 1 - min(hue_diff, 1 - hue_diff)
    return complementarity_score


def calculate_complementarity_score(fit: Fit) -> float:
    """Calculate how well the colors complement each other in the list of outfits."""
    total_complementarity = 0.0
    total_weight = 0.0

    if len(fit.clothes) == 1:
        return 25

    # Compare each clothing element with each other
    for i, clothing1 in enumerate(fit.clothes):
        for j, clothing2 in enumerate(fit.clothes):
            if i >= j:
                # Avoid double counting pairs and self-comparison
                continue

            for rgb1, percent1 in clothing1.rgbs:
                hsv1 = rgb_to_hsv(rgb1)

                for rgb2, percent2 in clothing2.rgbs:
                    hsv2 = rgb_to_hsv(rgb2)

                    # Calculate the complementarity score
                    complementarity = color_complementarity(hsv1, hsv2)

                    # Weight the complementarity by the color dominance percentages
                    weight = percent1 * percent2
                    total_complementarity += complementarity * weight
                    total_weight += weight

    # Return the weighted average complementarity score as a percentage
    if total_weight == 0:
        return 0.0

    penalty = 1.0
    if len(fit.clothes) == 2:
        penalty = 0.75

    if len(fit.clothes) == 3:
        penalty = 0.90

    return (total_complementarity / total_weight) * 100 * penalty