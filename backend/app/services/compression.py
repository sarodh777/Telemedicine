import os
import uuid
from pathlib import Path
from PIL import Image
from io import BytesIO
from fastapi import UploadFile, HTTPException
from pypdf import PdfReader, PdfWriter

from backend.app.config import UPLOAD_DIR

ALLOWED_MIME_TYPES = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "application/pdf": ".pdf",
}

MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024  # 15 MB limit for slow rural uploads

def optimize_and_store_medical_document(file: UploadFile) -> dict:
    """
    Dual-storage medical document optimizer:
    1. Preserves the untouched, high-fidelity ORIGINAL medical document securely.
    2. Generates an optimized, low-bandwidth PREVIEW (using Pillow for images or PyPDF for PDFs)
       specifically calibrated so rural clinics on 2G/3G can download it rapidly without sacrificing
       clinical or prescription readability.
    """
    content_type = file.content_type.lower() if file.content_type else ""
    if content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported format '{content_type}'. Supported medical formats: PDF, JPG, JPEG, PNG."
        )

    file_bytes = file.file.read()
    original_size = len(file_bytes)

    if original_size == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    if original_size > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum allowed upload size of 15MB (got {original_size / (1024 * 1024):.1f}MB)."
        )

    ext = ALLOWED_MIME_TYPES[content_type]
    file_uuid = uuid.uuid4().hex

    # 1. Securely store original preserved document
    original_filename = f"original_{file_uuid}{ext}"
    original_dest = UPLOAD_DIR / original_filename
    with open(original_dest, "wb") as f:
        f.write(file_bytes)

    # 2. Generate optimized low-bandwidth preview
    preview_filename = f"preview_{file_uuid}{ext if ext == '.pdf' else '.webp'}"
    preview_dest = UPLOAD_DIR / preview_filename
    preview_size = original_size

    if content_type.startswith("image/"):
        try:
            image = Image.open(BytesIO(file_bytes))

            # Normalize color channels
            if image.mode in ("RGBA", "P"):
                image = image.convert("RGB")
            elif image.mode != "RGB":
                image = image.convert("RGB")

            # High diagnostic readability downscale only if image exceeds standard 2K resolution
            max_dimension = 1600
            if max(image.size) > max_dimension:
                image.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)

            # Save as optimized WebP (or progressive JPEG) for fast mobile transmission
            image.save(preview_dest, format="WEBP", quality=78, method=6)
            preview_size = os.path.getsize(preview_dest)

            # If compression somehow failed to reduce size, copy original bytes
            if preview_size >= original_size:
                with open(preview_dest, "wb") as f:
                    f.write(file_bytes)
                preview_size = original_size

        except Exception as e:
            print(f"[Compression Service] Image optimization fallback: {e}")
            with open(preview_dest, "wb") as f:
                f.write(file_bytes)
            preview_size = original_size

    elif content_type == "application/pdf":
        try:
            # Safe lossless content stream compression using PyPDF
            reader = PdfReader(BytesIO(file_bytes))
            writer = PdfWriter()
            
            for page in reader.pages:
                page.compress_content_streams()
                writer.add_page(page)

            writer.compress_identical_objects()
            with open(preview_dest, "wb") as f:
                writer.write(f)

            preview_size = os.path.getsize(preview_dest)
            if preview_size >= original_size or preview_size == 0:
                with open(preview_dest, "wb") as f:
                    f.write(file_bytes)
                preview_size = original_size

        except Exception as e:
            print(f"[Compression Service] PDF optimization fallback: {e}")
            with open(preview_dest, "wb") as f:
                f.write(file_bytes)
            preview_size = original_size

    # Calculate compression ratio
    reduction_pct = 0.0
    if original_size > 0 and preview_size < original_size:
        reduction_pct = ((original_size - preview_size) / original_size) * 100

    return {
        "original_size": original_size,
        "preview_size": preview_size,
        "compressed_size": preview_size, # for backward compat
        "compression_ratio": f"{reduction_pct:.1f}% reduction",
        "original_file_path": f"/uploads/{original_filename}",
        "preview_file_path": f"/uploads/{preview_filename}",
        "file_path": f"/uploads/{preview_filename}", # default view path
        "file_type": content_type,
        "original_filename": file.filename or "medical_report"
    }

# Backward compatible alias
compress_and_store_file = optimize_and_store_medical_document
