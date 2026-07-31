from pathlib import Path
from unittest.mock import patch, MagicMock

import numpy as np
import pytest

from azure.core.exceptions import ResourceNotFoundError
from modules.image_module.image_similarity import (
	vectorize_image_from_binary_data,
	compute_cosine_similarity,
	are_images_similar_multiple,
	get_image_vectors_list,
)


# ----------------------------------
# Tests: vectorize_image_from_binary_data
# ----------------------------------

class TestVectorizeImageFromBinaryData:
	@pytest.fixture
	def fake_image_file(self, tmp_path: Path):
		p = tmp_path / "test.jpg"
		# Write minimal bytes; content isn't validated by function beyond reading
		p.write_bytes(b"fakejpegdata")
		return p

	@patch("modules.image_module.image_similarity.requests.post")
	def test_vectorize_success(self, mock_post, fake_image_file):
		mock_response = MagicMock()
		mock_response.json.return_value = {"vector": [0.1, 0.2, 0.3]}
		mock_response.raise_for_status.return_value = None
		mock_post.return_value = mock_response

		with patch.dict("os.environ", {"AZURE_COMPUTER_VISION_ENDPOINT": "https://example.cognitiveservices.azure.com", "AZURE_COMPUTER_VISION_SUBSCRIPTION_KEY": "key"}):
			vec = vectorize_image_from_binary_data(str(fake_image_file))
		assert vec == [0.1, 0.2, 0.3]
		assert mock_post.call_count == 1

# ----------------------------------
# Tests: compute_cosine_similarity
# ----------------------------------

class TestComputeCosineSimilarity:
    def test_identical_vectors(self):
        v = [1, 2, 3]
        assert compute_cosine_similarity(v, v) == pytest.approx(1.0)
        
    def test_orthogonal_vectors(self):
        v1 = [1, 0]
        v2 = [0, 1]
        assert compute_cosine_similarity(v1, v2) == pytest.approx(0.0, abs=1e-7)
        
    def test_cosine_half(self):
        # 60度の角度 -> cos(60°)=0.5
        v1 = [1.0, 0.0]
        v2 = [0.5, np.sqrt(3)/2]
        assert compute_cosine_similarity(v1, v2) == pytest.approx(0.5, abs=1e-6)

# ----------------------------------
# Tests: are_images_similar_multiple
# ----------------------------------

class TestAreImagesSimilarMultiple:
	def test_basic_flow(self):
		vectors = [
			[1, 0, 0],
			[1, 0, 0],  # identical to first → similar
			[0, 1, 0],  # different → not similar
		]
		bool_list, remain = are_images_similar_multiple(vectors, threshold=0.99)
		# cosine similarities: (v0,v1)=1.0 -> True, (v1,v2)=0.0 -> False, last forced 0.0 -> False
		assert bool_list == [True, False, False]
		# Remaining should include indices where bool_list is False
		assert remain == [vectors[1], vectors[2]]

	def test_invalid_threshold(self):
		with pytest.raises(ValueError):
			are_images_similar_multiple([[1, 0, 0], [1, 0, 0]], threshold=1.5)

# ----------------------------------
# Tests: get_image_vectors_list
# ----------------------------------

class TestGetImageVectorsList:
	@pytest.fixture
	def image_paths_list(self, tmp_path: Path):
		# Two "shots", first has 2 images, second has 1 image
		shot1 = [tmp_path / "a.jpg", tmp_path / "b.jpg"]
		shot2 = [tmp_path / "c.jpg"]
		for p in shot1 + shot2:
			p.write_bytes(b"data")
		return [[str(p) for p in shot1], [str(p) for p in shot2]]

	@patch("modules.image_module.image_similarity.upload_file_to_blob")
	@patch("modules.image_module.image_similarity.vectorize_image_from_binary_data")
	@patch("modules.image_module.image_similarity.download_file_from_blob")
	def test_blob_not_found_generates_and_uploads(self, mock_download, mock_vectorize, mock_upload, tmp_path, image_paths_list):
		# Simulate blob not found
		mock_download.side_effect = ResourceNotFoundError("not found")
		# Provide deterministic vectors
		vectors_cycle = [[0.1, 0.2], [0.3, 0.4], [0.5, 0.6]]
		mock_vectorize.side_effect = vectors_cycle

		res = get_image_vectors_list(
			temp_dir=str(tmp_path),
			container_name="container",
			blob_folder_name="folder",
			image_paths_list=image_paths_list,
		)
		assert res == [[vectors_cycle[0], vectors_cycle[1]], [vectors_cycle[2]]]
		assert mock_upload.call_count == 1
		# Ensure order preserved (ThreadPoolExecutor might return out-of-order if we mishandle index mapping)
		assert res[0][0] == [0.1, 0.2]
		assert res[0][1] == [0.3, 0.4]

	@patch("modules.image_module.image_similarity.upload_file_to_blob")
	@patch("modules.image_module.image_similarity.np.load")
	@patch("modules.image_module.image_similarity.download_file_from_blob")
	def test_blob_exists_download_and_load(self, mock_download, mock_npload, mock_upload, tmp_path, image_paths_list):
		# Simulate existing blob file path
		fake_blob_path = tmp_path / "vectors" / "image_vectors.npz"
		fake_blob_path.parent.mkdir(parents=True, exist_ok=True)
		fake_blob_path.write_bytes(b"dummy")
		mock_download.return_value = str(fake_blob_path)

		class FakeNPZ:
			def __enter__(self_inner):
				return {"array": np.array([[ [1,2],[3,4] ]], dtype=object)}
			def __exit__(self_inner, exc_type, exc, tb):
				return False

		mock_npload.return_value = FakeNPZ()

		res = get_image_vectors_list(
			temp_dir=str(tmp_path),
			container_name="container",
			blob_folder_name="folder",
			image_paths_list=image_paths_list,
		)
		assert res == [[[1,2],[3,4]]]
		# Should not call upload when file existed
		mock_upload.assert_not_called()

