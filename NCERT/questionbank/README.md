Question bank pipeline for a single PDF.

What this does
- Extracts text from the PDF.
- Splits into sections and chunks for RAG.
- Parses exercise questions.
- Scores difficulty (1-5).
- Links answers if an answer key is present.

How to run
1) Install dependency into vendor:
   python -m pip install --no-cache-dir --target "C:\comeplete\NCERT\questionbank\vendor" pypdf
2) Run:
   python C:\comeplete\NCERT\questionbank\scripts\run_pipeline.py

Outputs
- C:\comeplete\NCERT\questionbank\output\raw_text.txt
- C:\comeplete\NCERT\questionbank\output\sections.json
- C:\comeplete\NCERT\questionbank\output\chunks.json
- C:\comeplete\NCERT\questionbank\output\questions.json
- C:\comeplete\NCERT\questionbank\output\report.json

Notes
- If the PDF is scanned, the extractor will return little text. In that case, OCR is required.
