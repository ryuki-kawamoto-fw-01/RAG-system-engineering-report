import pytest
from unittest.mock import patch
from modules.image_module.image_delegation import delete_image_based_on_similarity, pick_segment_images


# ----------------------------------
# Tests: delete_image_based_on_similarity
# ----------------------------------

class TestDeleteImageBasedOnSimilarity:
    @pytest.fixture
    def sample_data(self):
        image_paths = ["img1.jpg", "img2.jpg", "img3.jpg"]
        vectors = [
            [0.1, 0.2, 0.3],
            [0.1, 0.2, 0.3],
            [0.9, 0.8, 0.7]
        ]
        return image_paths, vectors

    def test_removes_similar_images(self, sample_data):
        image_paths, vectors = sample_data
        remain_vectors = [vectors[2]]

        with patch("modules.image_module.image_delegation.Path") as mock_path:
            mock_path.return_value.exists.return_value = True
            mock_path.return_value.unlink.return_value = None

            new_paths, new_vectors = delete_image_based_on_similarity(image_paths, vectors, is_auto_threshold=False, similarity_threshold=0.1)
            assert new_paths == ["img3.jpg"]
            assert new_vectors == remain_vectors

    def test_threshold_out_of_range(self, sample_data):
        image_paths, vectors = sample_data
        with pytest.raises(ValueError):
            delete_image_based_on_similarity(image_paths, vectors, is_auto_threshold=False, similarity_threshold=1.5)

    def test_auto_threshold_forces_099(self, sample_data):
        image_paths, vectors = sample_data
        remain_vectors = [vectors[1], vectors[2]]

        with patch("modules.image_module.image_delegation.Path") as mock_path:
            mock_path.return_value.exists.return_value = True
            mock_path.return_value.unlink.return_value = None

            new_paths, new_vectors = delete_image_based_on_similarity(image_paths, vectors, is_auto_threshold=True, similarity_threshold=0.1)
            assert new_paths == ["img2.jpg", "img3.jpg"]
            assert new_vectors == remain_vectors

    def test_handles_unlink_oserror(self, sample_data):
        image_paths, vectors = sample_data

        with patch("modules.image_module.image_delegation.Path") as mock_path:
            mock_path.return_value.exists.return_value = True
            mock_path.return_value.unlink.side_effect = OSError

            # 実装は OSError を再送出するため例外を期待
            with pytest.raises(OSError):
                delete_image_based_on_similarity(
                    image_paths,
                    vectors,
                    is_auto_threshold=False,
                    similarity_threshold=0.99
                )

    def test_path_does_not_exist(self, sample_data):
        image_paths, vectors = sample_data
        remain_vectors = [vectors[1], vectors[2]]

        with patch("modules.image_module.image_delegation.Path") as mock_path:
            mock_path.return_value.exists.return_value = False

            new_paths, new_vectors = delete_image_based_on_similarity(image_paths, vectors, is_auto_threshold=False, similarity_threshold=0.99)
            assert new_paths == ["img2.jpg", "img3.jpg"]
            assert new_vectors == remain_vectors

# ----------------------------------
# Tests: remove_similar_images
# ----------------------------------

class TestRemoveSimilarImages:
    @pytest.fixture
    def sample_multi_data(self):
        image_paths_list = [
            ["0/img1a.jpg", "0/img1b.jpg", "0/img1c.jpg"],
            ["1/img2a.jpg", "1/img2b.jpg"]
        ]
        image_vectors_list = [
            [
                [0.1, 0.2, 0.3],
                [0.1, 0.2, 0.3],
                [0.9, 0.8, 0.7]
            ],
            [
                [0.5, 0.5, 0.5],
                [0.5, 0.5, 0.5]
            ]
        ]
        return image_paths_list, image_vectors_list

    def test_removes_similar_images_across_multiple_shots(self, sample_multi_data):
        image_paths_list, image_vectors_list = sample_multi_data
        # Simulate: first shot keeps last image, second shot keeps none
        with patch("modules.image_module.image_delegation.delete_image_based_on_similarity") as mock_del:
            mock_del.side_effect = [(["0/img1c.jpg"], [[0.9, 0.8, 0.7]])]
            remain_paths, remain_vectors = pick_segment_images(
                similarity_threshold=0.1,
                is_auto_threshold=False,
                image_paths_list=image_paths_list,
                image_vectors_list=image_vectors_list
            )
            assert remain_paths == [["0/img1c.jpg"], []]
            assert remain_vectors == [[[0.9, 0.8, 0.7]], []]

    def test_empty_input_lists(self):
        remain_paths, remain_vectors = pick_segment_images(
            similarity_threshold=0.99,
            is_auto_threshold=True,
            image_paths_list=[],
            image_vectors_list=[]
        )
        assert remain_paths == []
        assert remain_vectors == []

    def test_handles_exceptions_from_delete_image_based_on_similarity(self, sample_multi_data):
        image_paths_list, image_vectors_list = sample_multi_data
        with patch("modules.image_module.image_delegation.delete_image_based_on_similarity") as mock_del:
            mock_del.side_effect = [OSError("fail"), (["1/img2a.jpg"], [[0.5, 0.5, 0.5]])]
            with pytest.raises(OSError):
                pick_segment_images(
                    similarity_threshold=0.99,
                    is_auto_threshold=False,
                    image_paths_list=image_paths_list,
                    image_vectors_list=image_vectors_list
                )

    def test_correct_arguments_passed_to_delete_image_based_on_similarity(self, sample_multi_data):
        image_paths_list, image_vectors_list = sample_multi_data
        input_image_paths_list = ["0/img1a.jpg", "0/img1b.jpg", "0/img1c.jpg", "1/img2a.jpg", "1/img2b.jpg"]
        input_image_vectors_list = [
                [0.1, 0.2, 0.3],
                [0.1, 0.2, 0.3],
                [0.9, 0.8, 0.7],
                [0.5, 0.5, 0.5],
                [0.5, 0.5, 0.5]
            ]
        
        with patch("modules.image_module.image_delegation.delete_image_based_on_similarity") as mock_del:
            mock_del.side_effect = [(["0/img1a.jpg", "1/img2b.jpg"], [[0.1, 0.2, 0.3], [0.9, 0.8, 0.7], [0.5, 0.5, 0.5]]),]
            pick_segment_images(
                similarity_threshold=0.5,
                is_auto_threshold=True,
                image_paths_list=image_paths_list,
                image_vectors_list=image_vectors_list
            )
            assert mock_del.call_count == 1
            args1 = mock_del.call_args_list[0][0]
            assert args1[0] == input_image_paths_list
            assert args1[1] == input_image_vectors_list
            assert args1[2] is True
            assert args1[3] == 0.5