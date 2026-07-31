from pydantic import BaseModel, Field, field_validator


class ImagePostRequest(BaseModel):
    imageContent: str = Field(..., title="画像の内容")
    imageSize: str = Field(..., title="解像度")
    imageFormat: str = Field(..., title="出力形式")

    @field_validator("imageContent", mode="before")
    @classmethod
    def validate_image_content(cls, v):
        if v is None:
            raise ValueError("image_contentは必須です")
        return v

    @field_validator("imageSize", mode="before")
    @classmethod
    def validate_image_size(cls, v):
        if v is None:
            raise ValueError("image_sizeは必須です")
        return v

    @field_validator("imageFormat", mode="before")
    @classmethod
    def validate_image_format(cls, v):
        if v is None:
            raise ValueError("image_formatは必須です")
        return v


class ImageGenerationResponse(BaseModel):
    """画像生成APIのレスポンス"""

    image_url: str = Field(..., title="SASトークン付き画像URL")
    blob_name: str = Field(..., title="Blob Storage上のファイル名")
    expiry_time: str = Field(..., title="SASトークンの有効期限")


class FixImagePostRequest(BaseModel):
    blobName: str = Field(..., title="修正対象の画像のblob名")
    fixImageRequest: str = Field(..., title="修正内容")
    imageSize: str = Field(..., title="解像度")
    imageFormat: str = Field(..., title="出力形式")

    @field_validator("blobName", mode="before")
    @classmethod
    def validate_blob_name(cls, v):
        if v is None:
            raise ValueError("blobNameは必須です")
        return v

    @field_validator("fixImageRequest", mode="before")
    @classmethod
    def validate_fixImageRequest(cls, v):
        if v is None:
            raise ValueError("fix_image_requestは必須です")
        return v

    @field_validator("imageSize", mode="before")
    @classmethod
    def validate_image_size(cls, v):
        if v is None:
            raise ValueError("image_sizeは必須です")
        return v

    @field_validator("imageFormat", mode="before")
    @classmethod
    def validate_image_format(cls, v):
        if v is None:
            raise ValueError("image_formatは必須です")
        return v
