import json
import re
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONFIG_PATH = ROOT / "config.json"
VENDOR_PATH = ROOT / "vendor"

if VENDOR_PATH.exists():
    sys.path.insert(0, str(VENDOR_PATH))


def load_config():
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def extract_text(pdf_path):
    try:
        from pypdf import PdfReader
    except Exception as exc:
        raise RuntimeError(
            "Missing dependency: pypdf. Install with:\n"
            'python -m pip install --no-cache-dir --target "C:\\comeplete\\NCERT\\questionbank\\vendor" pypdf'
        ) from exc

    reader = PdfReader(str(pdf_path))
    pages = []
    for page in reader.pages:
        try:
            text = page.extract_text() or ""
        except Exception:
            text = ""
        pages.append(text)
    return "\n\n".join(pages)


def normalize_text(text):
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"(\w)-\n(\w)", r"\1\2", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def to_ascii(text):
    return text.encode("ascii", "ignore").decode("ascii")


def count_non_ascii(text):
    return sum(1 for ch in text if ord(ch) > 127)


def is_heading(line):
    s = line.strip()
    if not s:
        return False
    if re.match(r"^CHAPTER\s+\d+\b", s, re.I):
        return True
    if re.match(r"^\d+(\.\d+)+\s+\S+", s):
        return True
    if re.match(r"^EXERCISE\s+\d+(\.\d+)?\b", s, re.I):
        return True
    if re.match(r"^MISCELLANEOUS\s+EXERCISE\b", s, re.I):
        return True
    if re.match(r"^SUMMARY\b", s, re.I):
        return True
    if re.match(r"^HISTORICAL\s+NOTE\b", s, re.I):
        return True
    if re.match(r"^ANSWERS?\b", s, re.I):
        return True
    return False


def classify_section(title):
    t = title.upper()
    if "EXERCISE" in t:
        return "exercise"
    if t.startswith("CHAPTER"):
        return "chapter"
    if "SUMMARY" in t:
        return "summary"
    if "HISTORICAL NOTE" in t:
        return "note"
    if t.startswith("ANSWERS"):
        return "answers"
    return "section"


def split_sections(text):
    sections = []
    current_title = "front_matter"
    current_lines = []
    for line in text.splitlines():
        if is_heading(line):
            if current_lines:
                sections.append(make_section(current_title, current_lines))
            current_title = line.strip()
            current_lines = []
        else:
            current_lines.append(line)
    if current_lines:
        sections.append(make_section(current_title, current_lines))
    return sections


def make_section(title, lines):
    body = "\n".join(lines).strip()
    return {"title": title, "type": classify_section(title), "text": body}


def chunk_text(text, max_words=200, overlap=40):
    words = text.split()
    if not words:
        return []
    chunks = []
    step = max_words - overlap
    if step <= 0:
        step = max_words
    idx = 0
    while idx < len(words):
        part = words[idx : idx + max_words]
        if not part:
            break
        chunks.append(" ".join(part))
        idx += step
    return chunks


def parse_answer_key(sections):
    answers = {}
    for section in sections:
        if section["type"] != "answers":
            continue
        for line in section["text"].splitlines():
            match = re.match(r"^\s*(\d+)\.\s*(.+)$", line)
            if match:
                answers[match.group(1)] = match.group(2).strip()
    return answers


def parse_questions_from_section(section):
    questions = []
    current = None
    current_num = None
    for line in section["text"].splitlines():
        match = re.match(r"^\s*(\d+)\.\s+(.*)$", line)
        alt = re.match(r"^\s*Q\.?\s*(\d+)\s*[-:.]?\s*(.*)$", line, re.I)
        if match or alt:
            if current is not None:
                questions.append({"number": current_num, "text": "\n".join(current).strip()})
            if match:
                current_num = match.group(1)
                line_text = match.group(2).strip()
            else:
                current_num = alt.group(1)
                line_text = alt.group(2).strip()
            current = [line_text] if line_text else []
        else:
            if current is not None:
                if line.strip():
                    current.append(line.strip())
    if current is not None:
        questions.append({"number": current_num, "text": "\n".join(current).strip()})
    return questions


def extract_options(text):
    options = []
    for line in text.splitlines():
        match = re.match(r"^\s*\(?([a-dA-D])\)\s*(.+)$", line)
        if match:
            options.append(match.group(2).strip())
    return options or None


TOPIC_KEYWORDS = {
    "set": ["set", "sets", "subset", "superset", "power set"],
    "operations": ["union", "intersection", "difference", "complement"],
    "notation": ["roster", "set-builder", "element", "belongs", "empty set"],
    "venn": ["venn", "diagram"],
    "intervals": ["interval", "open interval", "closed interval"],
}


def detect_topics(text):
    text_lower = text.lower()
    hits = []
    for topic, keywords in TOPIC_KEYWORDS.items():
        for kw in keywords:
            if kw in text_lower:
                hits.append(topic)
                break
    return hits


def score_difficulty(text, levels):
    score = 1
    lower = text.lower()
    if re.search(r"\bprove\b|\bshow that\b|\bderive\b|\bverify\b", lower):
        score += 1
    if re.search(r"\bif\b.*\bthen\b", lower):
        score += 1
    if re.search(r"\b(i\)|\(ii\)|\(a\)|\(b\))", lower):
        score += 1
    if len(text.split()) > 80:
        score += 1
    if re.search(r"[=<>]|union|intersection|complement|subset", lower):
        score += 1
    if score > levels:
        score = levels
    return score


def slugify(value):
    value = value.lower()
    value = re.sub(r"[^a-z0-9]+", "_", value)
    return value.strip("_")


def build_questions(sections, answers, config):
    questions = []
    base_id = f"{slugify(config['subject'])}_{config['class']}_ch{config['chapter']}"
    for section in sections:
        if section["type"] != "exercise":
            continue
        section_questions = parse_questions_from_section(section)
        section_slug = slugify(section["title"]) or "exercise"
        for idx, q in enumerate(section_questions, start=1):
            q_num = q["number"] or str(idx)
            answer = answers.get(q_num)
            question_text = q["text"].strip()
            question_text_ascii = to_ascii(question_text)
            options = extract_options(question_text_ascii)
            difficulty = score_difficulty(question_text_ascii, config["difficulty_levels"])
            qid = f"{base_id}_{section_slug}_q{q_num}"
            questions.append(
                {
                    "id": qid,
                    "source": "exercise",
                    "section_title": section["title"],
                    "question_number": q_num,
                    "stem": question_text_ascii,
                    "options": options,
                    "answer": to_ascii(answer) if answer else None,
                    "answer_source": "answer_key" if answer else "missing",
                    "difficulty": difficulty,
                    "topics": detect_topics(question_text_ascii),
                    "metadata": {
                        "subject": config["subject"],
                        "class": config["class"],
                        "chapter": config["chapter"],
                        "book": config["book"],
                    },
                }
            )
    return questions


def build_chunks(sections, config):
    chunks = []
    base_id = f"{slugify(config['subject'])}_{config['class']}_ch{config['chapter']}"
    chunk_index = 1
    for section in sections:
        if section["type"] == "answers":
            continue
        for text in chunk_text(section["text"]):
            chunk_text_ascii = to_ascii(text)
            chunks.append(
                {
                    "id": f"{base_id}_chunk_{chunk_index}",
                    "text": chunk_text_ascii,
                    "metadata": {
                        "section_title": section["title"],
                        "section_type": section["type"],
                        "subject": config["subject"],
                        "class": config["class"],
                        "chapter": config["chapter"],
                        "book": config["book"],
                    },
                }
            )
            chunk_index += 1
    return chunks


def write_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=True)


def main():
    config = load_config()
    pdf_path = Path(config["input_pdf"])
    output_dir = Path(config["output_dir"])
    output_dir.mkdir(parents=True, exist_ok=True)

    raw_text = extract_text(pdf_path)
    non_ascii_count = count_non_ascii(raw_text)
    raw_text = normalize_text(raw_text)
    raw_text_ascii = to_ascii(raw_text)

    (output_dir / "raw_text.txt").write_text(raw_text_ascii, encoding="utf-8")

    sections = split_sections(raw_text)
    for section in sections:
        section["text"] = to_ascii(section["text"])

    answers = parse_answer_key(sections)
    questions = build_questions(sections, answers, config)
    chunks = build_chunks(sections, config)

    write_json(output_dir / "sections.json", sections)
    write_json(output_dir / "questions.json", questions)
    write_json(output_dir / "chunks.json", chunks)

    report = {
        "input_pdf": str(pdf_path),
        "output_dir": str(output_dir),
        "raw_text_chars": len(raw_text),
        "raw_text_ascii_chars": len(raw_text_ascii),
        "non_ascii_removed": non_ascii_count,
        "sections_count": len(sections),
        "questions_count": len(questions),
        "answers_found": len(answers),
        "needs_ocr": len(raw_text_ascii) < 2000,
        "generated_at": datetime.utcnow().isoformat() + "Z",
    }
    write_json(output_dir / "report.json", report)

    print("Done.")
    print(f"Sections: {len(sections)}")
    print(f"Questions: {len(questions)}")
    print(f"Chunks: {len(chunks)}")
    print(f"Answers found: {len(answers)}")


if __name__ == "__main__":
    main()
