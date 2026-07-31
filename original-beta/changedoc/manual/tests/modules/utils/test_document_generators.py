from pathlib import Path
from PIL import Image
import pytest

from modules.utils.document_generators import (
	create_excel_with_layout,
	create_markdown_with_table,
	create_word_with_layout,
)


def _make_dummy_images(tmp_path: Path, count: int = 3) -> list[str]:
	image_paths: list[str] = []
	for i in range(count):
		img_path = tmp_path / f"img_{i}.png"
		# Create a simple colored image
		img = Image.new("RGB", (640 + i * 10, 480 + i * 5), color=(10 * i, 50, 120))
		img.save(img_path)
		image_paths.append(str(img_path))
	return image_paths


# ----------------------------------
# Tests: create_excel_with_layout
# ----------------------------------

class TestCreateExcelWithLayout:
	def test_create_excel_basic(self, tmp_path: Path):
		images = _make_dummy_images(tmp_path, 2)
		responses = ["テスト応答1", "テスト応答2"]
		output = tmp_path / "out.xlsx"

		result_path = create_excel_with_layout(str(output), images, responses, new_height=200)
		assert Path(result_path).exists(), "Excel ファイルが作成されていません。"

	def test_create_excel_length_mismatch_images_gt_responses(self, tmp_path: Path):
		"""画像 > 応答: ValueError が発生する"""
		images = _make_dummy_images(tmp_path, 3)
		responses = ["テスト応答1", "テスト応答2"]  # 画像の方が多い
		output = tmp_path / "out_mismatch_images.xlsx"
		with pytest.raises(ValueError):
			create_excel_with_layout(str(output), images, responses)

	def test_create_excel_length_mismatch_responses_gt_images(self, tmp_path: Path):
		"""応答 > 画像: ValueError が発生する"""
		images = _make_dummy_images(tmp_path, 2)
		responses = ["テスト応答1", "テスト応答2", "余分"]  # 応答の方が多い
		output = tmp_path / "out_mismatch_responses.xlsx"
		with pytest.raises(ValueError):
			create_excel_with_layout(str(output), images, responses)

	def test_create_excel_ignores_missing_image(self, tmp_path: Path):
		images = _make_dummy_images(tmp_path, 1)
		images.append(str(tmp_path / "missing.png"))  # 存在しない画像
		responses = ["存在する画像", "存在しない画像"]
		output = tmp_path / "with_missing.xlsx"
		result_path = create_excel_with_layout(str(output), images, responses, new_height=150)
		assert Path(result_path).exists(), "Excel ファイルが作成されていません。"

# ----------------------------------
# Tests: create_markdown_with_table
# ----------------------------------

class TestCreateMarkdownWithTable:
	def test_create_markdown_basic(self, tmp_path: Path):
		images = _make_dummy_images(tmp_path, 2)
		responses = ["説明1", "説明2"]
		md_path = tmp_path / "doc" / "output.md"

		result_path = create_markdown_with_table(str(md_path), images, responses)
		md_file = Path(result_path)
		content = md_file.read_text(encoding="utf-8")
				
		assert md_file.exists(), "Markdown ファイルが作成されていません。"
		assert content.count("| ![](./images/") == 2 # Header row + separator + 2 data rows expected
		assert (md_file.parent / "images" / Path("img_0.png")).exists()
		assert (md_file.parent / "images" / Path("img_1.png")).exists()

	def test_create_markdown_length_mismatch(self, tmp_path: Path):
		# images と responses の長さが異なる場合、例外が発生することを確認
		images = _make_dummy_images(tmp_path, 1)
		responses = ["説明1", "余分"]
		md_path = tmp_path / "doc" / "bad.md"
		with pytest.raises(ValueError):
			create_markdown_with_table(str(md_path), images, responses)

# ----------------------------------
# Tests: create_word_with_layout
# ----------------------------------

class TestCreateWordWithLayout:
	def test_create_word_basic(self, tmp_path: Path):
		images = _make_dummy_images(tmp_path, 2)
		responses = ["ワード説明1", "ワード説明2"]
		word_path = tmp_path / "out.docx"

		result_path = create_word_with_layout(str(word_path), images, responses, max_width=2)
		assert Path(result_path).exists(), "Word ファイルが作成されていません。"

	def test_create_word_length_mismatch(self, tmp_path: Path):
		"""画像/応答数不一致で ValueError が発生する"""
		images = _make_dummy_images(tmp_path, 3)
		responses = ["説明1", "説明2"]  # 画像が多い
		word_path = tmp_path / "out_mismatch.docx"
		with pytest.raises(ValueError):
			create_word_with_layout(str(word_path), images, responses, max_width=1.8)

	def test_create_word_skips_bad_image(self, tmp_path: Path):
		images = _make_dummy_images(tmp_path, 1)
		# Add a corrupted/invalid image path (create empty file)
		bad_image = tmp_path / "bad.png"
		bad_image.write_bytes(b"")
		images.append(str(bad_image))
		responses = ["正常", "壊れ"]
		word_path = tmp_path / "skip_bad.docx"
		result_path = create_word_with_layout(str(word_path), images, responses, max_width=1.5)
		assert Path(result_path).exists()


