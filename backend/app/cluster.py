"""
Clustering + optional 2D visualization for CLIP image embeddings.

Kept intentionally simple: KMeans (default) via scikit-learn, with PCA
(not UMAP, to keep dependencies light) for a sanity-check scatter plot.
"""
from __future__ import annotations

from pathlib import Path

import numpy as np


def cluster_embeddings(embeddings: np.ndarray, n_clusters: int = 5, seed: int = 42) -> np.ndarray:
    """Cluster embeddings into `n_clusters` groups.

    Returns an (N,) int array of cluster labels, one per embedding.
    Falls back to a single cluster if there are fewer samples than clusters.
    """
    from sklearn.cluster import KMeans

    n_samples = embeddings.shape[0]
    if n_samples == 0:
        return np.array([], dtype=int)

    k = min(n_clusters, n_samples)
    model = KMeans(n_clusters=k, random_state=seed, n_init="auto")
    return model.fit_predict(embeddings)


def project_2d(embeddings: np.ndarray) -> np.ndarray:
    """PCA-project embeddings down to 2D for visualization."""
    from sklearn.decomposition import PCA

    n_samples = embeddings.shape[0]
    if n_samples < 2:
        return np.zeros((n_samples, 2), dtype=np.float32)

    n_components = min(2, embeddings.shape[1], n_samples)
    coords = PCA(n_components=n_components, random_state=42).fit_transform(embeddings)

    if n_components < 2:
        coords = np.pad(coords, ((0, 0), (0, 2 - n_components)))

    return coords


def save_cluster_plot(embeddings: np.ndarray, labels: np.ndarray, out_path: str | Path) -> None:
    """Save a PNG scatter plot of the clusters (PCA-projected) for a quick
    visual sanity check. Purely a debugging aid, not used by the export
    pipeline itself.
    """
    import matplotlib

    matplotlib.use("Agg")  # headless, no display needed
    import matplotlib.pyplot as plt

    coords = project_2d(embeddings)

    plt.figure(figsize=(6, 6))
    plt.scatter(coords[:, 0], coords[:, 1], c=labels, cmap="tab10", s=40)
    plt.title("Photo clusters (PCA projection)")
    plt.xlabel("PC1")
    plt.ylabel("PC2")
    plt.tight_layout()
    plt.savefig(out_path, dpi=150)
    plt.close()
