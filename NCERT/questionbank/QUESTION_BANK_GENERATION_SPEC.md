# QUESTION_BANK_GENERATION_SPEC.md
### Question Bank Generation for NCERT PDFs (Config-Driven, White-Label Ready)

This specification defines the canonical pipeline to convert a single textbook PDF into:
- a structured question bank
- difficulty-tagged questions
- chunked theory for RAG retrieval

---

## Quick Reference: Convert One PDF to a Question Bank

### Step 1: Prepare
- Place the PDF on disk (example: `C:\comeplete\NCERT\MATHS 11\kemh1a1.pdf`).
- Update `C:\comeplete\NCERT\questionbank\config.json` with subject/class/chapter.

### Step 2: Run
```
python C:\comeplete\NCERT\questionbank\scripts\run_pipeline.py
```

### Step 3: Output
- `C:\comeplete\NCERT\questionbank\output\raw_text.txt`
- `C:\comeplete\NCERT\questionbank\output\sections.json`
- `C:\comeplete\NCERT\questionbank\output\questions.json`
- `C:\comeplete\NCERT\questionbank\output\chunks.json`
- `C:\comeplete\NCERT\questionbank\output\report.json`

---

It supports:
- Single-PDF ingestion into a question bank
- Difficulty scoring (1-5 by default)
- Answer key linking when present
- Enhanced metadata tagging (subject/chapter/topic/difficulty/exam-type)
- RAG-ready chunked theory with embeddings
- White-label configuration via tenant config
- Cost-optimized architecture ($78-133 one-time, $15-30/month)
- n8n workflow integration
- Vector database support (Qdrant/Chroma/Pinecone)
- Two-stage retrieval (metadata filtering + vector search)
- Groq LLM integration (free tier: 14.4K requests/day)
- Legal compliance guidelines (NCERT + purchased references)
- Phased scaling strategy (5 to 100+ books)

This is the production-ready, version 2.0 canonical spec for question bank generation with full RAG optimization.

---

# 1. Goals and Requirements

### Core goals
- Convert a textbook PDF into structured, queryable questions.
- Preserve exercise numbering and section context.
- Assign difficulty levels for adaptive testing.
- Keep outputs deterministic and reproducible.
- Avoid storing or exposing raw PDFs to learners.

### Required outputs
- Question bank with metadata and difficulty
- Answer key linkage if available
- Theory chunks for retrieval
- Report metrics for QA

---

# 2. Recommended Tech Stack

### 2.1 Core Components

**Orchestration**: n8n (self-hosted or cloud)
**Vector Database**: Qdrant (Docker self-hosted) - **Recommended** ⭐
**Embeddings**: OpenAI text-embedding-3-large (one-time cost)
**LLM**: Groq API (Llama 3.1 70B) - **Free tier** ⭐
**Programming**: Python 3.9+ for pipeline scripts
**PDF Processing**: pypdf or pdfplumber

### 2.2 Infrastructure

**Development**:
- Local machine or small VPS (2GB RAM)
- Docker for Qdrant
- n8n desktop or cloud

**Production**:
- VPS: 8GB RAM, 50GB SSD, 2-4 CPU cores
- Monthly cost: $15-30
- OS: Ubuntu 22.04 LTS recommended

### 2.3 API Keys Required

```bash
# One-time embedding generation
OPENAI_API_KEY=sk-...

# Free tier LLM inference
GROQ_API_KEY=gsk_...

# Optional: n8n cloud (or self-host for free)
N8N_LICENSE_KEY=... (if using cloud)
```

### 2.4 Cost Summary

**One-Time Setup**: $78-133
- OpenAI embeddings (100 books): $13
- VPS setup: $50-100
- Domain/SSL (optional): $15-20/year

**Monthly Running**: $15-30
- VPS hosting: $15-30
- Groq LLM: $0 (free tier)
- Vector DB: $0 (self-hosted)

---

# 3. Input Sources

Allowed inputs:
- NCERT PDF (text-based preferred) - **Primary source** ✅
- Scanned PDF (requires OCR)
- Purchased reference books (HC Verma, RD Sharma, etc.)

Unsupported inputs:
- Encrypted PDFs (must be unlocked before ingestion)
- Images without OCR
- Copyrighted content without proper licensing

**Legal Compliance**:
- NCERT: 100% legal, freely distributable ✅
- Purchased books: Use for RAG training only (no redistribution)
- See Section 12 for full legal guidelines

---

# 4. Pipeline Overview

**Core Pipeline Steps**:
1) Extract text from PDF
2) Normalize and clean text
3) Split into logical sections
4) Identify exercise sections
5) Parse questions and options
6) Locate answer key (if present)
7) Score difficulty
8) Generate RAG chunks (with enhanced metadata)
9) Extract formulas (LaTeX format for Physics/Chemistry/Maths)
10) Generate embeddings (OpenAI API)
11) Store in vector database (Qdrant/Chroma)
12) Output JSON + report

**Additional Processing**:
- Subject-specific handling (formulas, diagrams, proofs)
- Cross-reference tagging
- Exam relevance classification
- Content type identification (theory/example/formula/exercise)

---

# 5. Text Extraction and OCR

### Text-based PDFs
- Extract via `pypdf` (or equivalent).
- Preserve line breaks for section detection.

### Scanned PDFs
- Detect low extracted text volume.
- Mark `needs_ocr: true` in report.
- OCR step must be run externally before reprocessing.

---

# 6. Section and Question Parsing Rules

### 6.1 Section detection
Detect headings by patterns:
- `CHAPTER <number>`
- `1.1`, `1.2.3`
- `EXERCISE <number>`
- `SUMMARY`
- `ANSWERS`

### 5.2 Exercise detection
Any section title containing `EXERCISE` is treated as question source.

### 5.3 Question detection
Recognize the following:
- `1. <question>`
- `Q. 1 <question>`

### 5.4 MCQ option detection
Options are detected by:
- `(a) ... (b) ... (c) ... (d) ...`

### 5.5 Answer key mapping
If an `ANSWERS` section exists, map by question number:
```
1. <answer>
2. <answer>
```

If no answer key exists:
- Mark `answer_source = "missing"`.
- Optionally route to solver or review later.

---

# 7. Difficulty Scoring

### 7.1 Rule-based scoring (default)
Score features:
- Proof/derivation language: +1
- Conditional or multi-step phrasing: +1
- Multi-part question: +1
- Long stem (>80 words): +1
- Algebraic/logical operators: +1

### 6.2 Level mapping
Default scale:
- 1: very easy
- 2: easy
- 3: moderate
- 4: hard
- 5: very hard

### 6.3 Calibration
Use a small labeled set (20-50 questions) to validate thresholds.

---

# 8. Data Model

### 8.1 Question record
```json
{
  "id": "maths_11_ch1_exercise_1_1_q1",
  "source": "exercise",
  "section_title": "EXERCISE 1.1",
  "question_number": "1",
  "stem": "Define a set.",
  "options": null,
  "answer": "A well-defined collection of objects.",
  "answer_source": "answer_key",
  "difficulty": 2,
  "topics": ["set", "notation"],
  "metadata": {
    "subject": "Maths",
    "class": "11",
    "chapter": "1",
    "book": "NCERT Maths 11"
  }
}
```

### 7.2 Chunk record (RAG) - Enhanced Schema
```json
{
  "id": "maths_11_ch1_chunk_7",
  "text": "A set is a well-defined collection of objects...",
  "metadata": {
    "subject": "Maths",
    "class": "11",
    "chapter": "1",
    "chapter_name": "Sets",
    "section_title": "1.2 Sets and Their Representations",
    "section_type": "theory",
    "content_type": "theory|example|formula|exercise",
    "difficulty": "basic|intermediate|advanced",
    "exam_relevance": "JEE|NEET|Board",
    "topics": ["set", "notation", "representation"],
    "equations": ["A = {x | condition}"],
    "book": "NCERT Maths 11",
    "page_number": 3
  }
}
```

**Enhanced Metadata Fields**:
- `content_type`: Distinguishes theory vs examples vs formulas
- `difficulty`: For content-level filtering
- `exam_relevance`: Enables exam-specific retrieval
- `topics`: Granular topic tags for better filtering
- `equations`: Extracted formulas for math/physics content
- `page_number`: Source traceability

---

# 9. Output Files

### Files
- `raw_text.txt` - normalized text
- `sections.json` - parsed sections
- `questions.json` - question bank
- `chunks.json` - RAG chunks
- `report.json` - metrics and flags

### Report schema (example)
```json
{
  "input_pdf": "C:\\comeplete\\NCERT\\MATHS 11\\kemh1a1.pdf",
  "raw_text_chars": 52341,
  "non_ascii_removed": 0,
  "sections_count": 14,
  "questions_count": 42,
  "answers_found": 40,
  "needs_ocr": false
}
```

---

# 10. White-Label Configuration

Question bank generation is independent of branding, but output must be
compatible with multi-tenant configs.

### Example tenant config (question delivery)
```json
{
  "tenant_id": "coach_a",
  "curriculum": {
    "class": "11",
    "subjects": ["Maths"],
    "chapters": ["1"]
  },
  "question_mix": {
    "levels": 5,
    "mix": {"1": 0.2, "2": 0.3, "3": 0.3, "4": 0.15, "5": 0.05}
  },
  "adaptive": {
    "diagnostic_count": 10,
    "upgrade_if": {"accuracy": 0.8, "streak": 2},
    "downgrade_if": {"accuracy": 0.5, "streak": 2}
  }
}
```

---

# 11. RAG-Specific Chunking Strategy

### 11.1 Chunking Best Practices
**Keep Semantic Units Together**:
- Complete sections (don't split mid-concept)
- Full solved examples (problem + solution)
- Formula derivations (start to end)
- Summary sections (entire summary as one chunk)

**Chunk Size Guidelines**:
- Target: 500-1000 tokens per chunk
- Overlap: 100-200 tokens between adjacent chunks
- Exception: Solved examples can be 1500+ tokens if needed

### 10.2 Subject-Specific Handling

**Physics/Chemistry**:
- Preserve formulas in LaTeX format: `v = v_0 + at` → `v = v_0 + at`
- Keep units with values: "9.8 m/s²" not "9.8"
- Diagram descriptions: Extract figure captions and descriptions
- Numerical problems: Keep complete with given/find/solution structure

**Mathematics**:
- LaTeX for all equations: `\frac{1}{2}at^2`
- Theorem statements complete (don't split)
- Proof steps: Keep entire proof together
- Practice problems: Each problem as separate chunk

**Example Chunk (Physics)**:
```json
{
  "id": "physics_11_ch2_example_2.3",
  "text": "Example 2.3: A ball is thrown vertically upwards with velocity 20 m/s...",
  "metadata": {
    "content_type": "solved_example",
    "topics": ["free fall", "kinematics"],
    "equations": ["v = u + at", "s = ut + 0.5at^2"],
    "difficulty": "intermediate",
    "numerical": true
  }
}
```

### 10.3 Cross-Reference Handling
- Include references to related concepts: "See Section 2.1 for velocity definition"
- Tag prerequisites: "Requires: Newton's Laws, Vectors"
- Link forward references: "This concept is used in Chapter 5"

---

# 12. Vector Database & Embeddings

### 12.1 Recommended Vector Databases

**For Production (Self-Hosted)**:

| Database | Capacity | Setup Effort | Cost | Recommended |
|----------|----------|--------------|------|-------------|
| **Qdrant** | Unlimited | Medium | Free | ⭐ Best Choice |
| Chroma | 10M+ vectors | Easy | Free | Good for small scale |
| Weaviate | Unlimited | Medium | Free | Good alternative |
| Milvus | Unlimited | High | Free | Enterprise scale |

**Cloud Options (If Not Self-Hosting)**:
- Pinecone: Easy but expensive (~$70/month for 500K vectors)
- Qdrant Cloud: Free tier available
- Supabase pgvector: Good if already using Supabase

**Recommendation**: **Qdrant self-hosted** (Docker) for best value

### 11.2 Embedding Generation

**Cost-Optimized Approach (Recommended)**:
```
Provider: OpenAI
Model: text-embedding-3-small (1536 dimensions)
Cost: $0.02 per 1M tokens

Typical Book Processing:
- 1 NCERT book ≈ 500 pages
- After chunking ≈ 2,000 chunks
- ~1M tokens total
- Cost: ~$0.02 per book

100 books ≈ $0.70-$2.00 one-time cost
```

**Quality Upgrade Option**:
```
Model: text-embedding-3-large (3072 dimensions)
Cost: $0.13 per 1M tokens
Better retrieval accuracy, ~7x cost
100 books ≈ $4.50-$5.20
```

**Free Alternative**:
- Model: Sentence-Transformers (all-MiniLM-L6-v2)
- Cost: $0 (self-hosted)
- Trade-off: Lower quality, requires GPU/CPU resources

**Recommendation**: Pay for OpenAI embeddings (one-time investment for permanent quality improvement)

### 11.3 Storage Requirements

**100 Books Estimate**:
```
Raw content: 50,000 pages
After chunking: 200K-500K vectors
Vector storage (1536d): ~3GB
Metadata: ~500MB-1GB
Total: ~4-5GB

Server needs:
- 8GB RAM minimum
- 50GB SSD storage
- 2-4 CPU cores
- VPS cost: $15-30/month
```

---

# 13. Content Sourcing & Legal Compliance

### 13.1 Primary Source: NCERT (100% Legal)

**Why NCERT**:
- Government-published, freely distributable
- No licensing restrictions
- Complete Class 11-12 syllabus coverage
- High-quality, verified content

**Download Source**: https://ncert.nic.in/textbook.php

**Subjects Available**:
- Physics Part 1 & 2
- Chemistry Part 1 & 2
- Mathematics
- Biology (for NEET preparation)

### 12.2 Reference Books (If Purchased)

**Safe Usage**:
- Purchase digital editions legally
- Use as reference to enhance RAG knowledge base
- AI generates original explanations (transformative use)
- Do NOT copy solutions verbatim
- Do NOT redistribute original PDFs

**Popular References**:
- HC Verma (Physics)
- RD Sharma (Mathematics)
- OP Tandon (Chemistry)
- NCERT Exemplar (All subjects)

### 12.3 Legal Compliance Rules

**Allowed**:
✅ Use NCERT without restrictions
✅ Purchase reference books for RAG training
✅ Generate original AI explanations based on learned knowledge
✅ Paraphrase concepts in AI responses
✅ Extract knowledge for educational purposes

**Not Allowed**:
❌ Redistribute commercial textbook PDFs
❌ Copy solutions/content verbatim from commercial books
❌ Reproduce diagrams without permission
❌ Share copyrighted material with students directly

**Risk Assessment**:
- NCERT only: **Zero risk** ✅
- NCERT + purchased refs (AI paraphrases): **Very low risk** ✅
- Copying commercial content: **High risk** ❌

**Recommendation**: Start with NCERT as base (100% safe), add purchased references as enhancement only

---

# 14. n8n Workflow Integration

### 14.1 Ingestion Workflow (One-Time Setup)

```
Manual/Schedule Trigger
  ↓
Read PDF Files (batch of 10-20)
  ↓
Loop: For Each Book
  ↓
  ├─ Extract Text (pypdf node)
  ├─ Normalize & Clean
  ├─ Split into Sections (regex-based)
  ├─ Identify Exercises vs Theory
  ├─ Parse Questions (if exercise)
  ├─ Generate Chunks (theory sections)
  ├─ Extract Formulas (LaTeX conversion)
  ├─ Add Enhanced Metadata
  ├─ Generate Embeddings (OpenAI API - batch of 100)
  └─ Store in Vector DB (Qdrant)
  ↓
Next Book
  ↓
Generate Report
```

**Processing Time**: 2-4 hours for 100 books (mostly automated)

### 13.2 Query Workflow (Runtime)

```
Webhook/Chat Trigger (Student Question)
  ↓
Query Classification
  ├─ Identify Subject (Physics/Chemistry/Maths)
  ├─ Detect Question Type (concept/problem/example)
  └─ Extract Key Terms
  ↓
Two-Stage Retrieval:
  ├─ Stage 1: Filter by Metadata
  │   └─ subject, class, topics, difficulty
  ├─ Stage 2: Vector Search
  │   └─ Semantic similarity on filtered set
  └─ Return Top 3-5 Chunks
  ↓
Context Assembly
  ├─ Combine retrieved chunks
  ├─ Format equations (LaTeX → readable)
  └─ Add relevant formulas
  ↓
LLM Generation (Groq API - Llama 3.1 70B)
  ├─ System: "You are a Class 11 tutor..."
  ├─ Context: {retrieved_chunks}
  └─ Query: {student_question}
  ↓
Response Formatting
  ↓
Return to Student
```

**Response Time**: 2-5 seconds end-to-end

### 13.3 n8n Limitations & Solutions

**Issue 1: Workflow Timeout**
- Problem: Processing 100 books in one run causes timeout
- Solution: Batch processing (10-20 books per workflow run)

**Issue 2: Memory Limits**
- Problem: Large PDFs cause memory errors
- Solution: Process one book at a time, clear memory between books

**Issue 3: API Rate Limits**
- Problem: OpenAI/Groq have requests-per-minute limits
- Solution: Add delays between calls, use batch endpoints

---

# 15. Cost Estimates & Optimization

### 15.1 One-Time Setup Costs

**Embedding Generation (100 Books)**:
```
OpenAI text-embedding-3-small:
- 100 books × 1M tokens avg = 100M tokens
- Cost: $0.02 per 1M tokens
- Total: $2.00 one-time

OpenAI text-embedding-3-large (better quality):
- Total: $13.00 one-time

Recommendation: Use -3-large ($13) for permanent quality boost
```

**Infrastructure Setup**:
```
VPS Server: $50-100 (or use existing)
Domain/SSL: $15-20/year
Total setup: $65-120
```

**Total One-Time**: **$78-133**

### 14.2 Monthly Running Costs

**Optimized Architecture**:
```
VPS (8GB RAM, 4 CPU): $15-30/month
Vector DB (self-hosted Qdrant): $0
LLM Inference (Groq free tier): $0
Embeddings (new queries): ~$0.10/month

Total: $15-30/month for unlimited queries
```

**If Using Groq Free Tier**:
- 14,400 requests/day = ~432,000/month
- Model: Llama 3.1 70B (excellent quality)
- Cost: **$0/month** until you exceed limits

**Cost Per Student Query**:
```
Using Groq: $0.00 (within free tier)
If paid tier: ~$0.0002-0.0005 per query
= ₹0.02-0.04 per query
```

### 14.3 Cost Comparison

| Approach | Setup | Monthly | Quality | Recommended |
|----------|-------|---------|---------|-------------|
| All Cloud (OpenAI) | $5 | $50-200 | Excellent | For large scale |
| **Hybrid (Groq)** ⭐ | **$80** | **$15-30** | **Excellent** | **Best Value** |
| Self-hosted LLM | $120 | $30-50 | Good | If privacy critical |
| All Free (local) | $0 | $0 | Fair | For testing only |

**Recommendation**: Hybrid approach (OpenAI embeddings + Groq inference + self-hosted Qdrant)

---

# 16. Scaling Strategy (Phased Approach)

### 16.1 Don't Process 100 Books Immediately

**Problem with Processing All Books Upfront**:
- ❌ More content ≠ better answers (increases retrieval noise)
- ❌ Harder to debug issues
- ❌ Waste time on rarely-queried content
- ❌ Maintenance complexity

### 15.2 Recommended Phased Rollout

**Phase 1: Foundation (Week 1)**
```
Books: 5-6 core NCERT books
- Physics Part 1 (Chapters 1-8)
- Chemistry Part 1 (Chapters 1-7)
- Mathematics (Core chapters)

Chunks: ~10,000-15,000
Cost: $0.20-0.30 embeddings
Goal: Test system, verify quality, debug issues
```

**Phase 2: Expansion (Week 2-3)**
```
Books: Add 10-15 reference books
- NCERT Part 2 (remaining chapters)
- HC Verma selected chapters
- RD Sharma selected topics

Chunks: ~30,000-40,000
Cost: $0.60-0.80 embeddings
Goal: Monitor retrieval quality, adjust metadata
```

**Phase 3: Comprehensive (Week 4+)**
```
Books: Add based on student feedback
- Fill gaps discovered through usage
- Add exam-specific content (JEE/NEET)
- Include practice problem books

Chunks: Scale to 100,000-200,000
Cost: $2-4 total embeddings
Goal: Production-ready system
```

### 15.3 Smart Collection Strategy

Instead of one massive knowledge base:

**Create Specialized Namespaces**:
```
Core Collection (NCERT):
- Use for all general queries
- 15-20 books

JEE Advanced Collection:
- High-difficulty problems
- Advanced concepts
- 20-30 books

NEET Collection:
- Biology-focused
- Medical entrance specific
- 15-20 books

Board Exam Collection:
- CBSE pattern questions
- Previous year papers
- 10-15 books
```

**Smart Routing Logic**:
- Identify student goal/level
- Query only relevant collection
- Faster, more accurate results

---

# 17. QA and Validation

### Validation checks
- No empty question stems
- No duplicate question IDs
- Answer key coverage rate
- OCR required flag
- Reasonable difficulty distribution

### Manual review triggers
- Missing answers
- Very long or malformed stems
- Unrecognized section titles

---

# 18. Testing Strategy

### Smoke tests
- Run pipeline on one PDF
- Confirm non-empty `questions.json`

### Regression tests
- Re-run same PDF, diff counts unchanged
- Question ID stability
- Difficulty distribution within expected bounds

---

# 19. Future Enhancements

### High Priority
- OCR integration step (automated scanned PDF handling)
- LLM-based topic tagging (semantic topic extraction)
- Answer generation for missing keys (AI solver integration)
- Hybrid search (keyword + vector for formulas/terms)

### Medium Priority
- Multi-language extraction (regional language support)
- Auto-generated question variants (practice generation)
- Diagram OCR and description generation
- Cross-chapter concept linking

### Low Priority
- Video content timestamping (if adding video resources)
- Audio transcription for lecture content
- Interactive formula rendering
- 3D visualization metadata

---

# 20. Integration with Clazro Platform

### 20.1 Database Integration

**Question Bank Table** (Already exists in Clazro):
```sql
-- Use existing question_bank table structure
-- Add embeddings column if not present
ALTER TABLE question_bank
ADD COLUMN embedding vector(1536);

CREATE INDEX ON question_bank
USING ivfflat (embedding vector_cosine_ops);
```

**Content Chunks Table** (For RAG):
```sql
CREATE TABLE content_chunks (
  id TEXT PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  text TEXT NOT NULL,
  embedding VECTOR(1536),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ON content_chunks
USING ivfflat (embedding vector_cosine_ops);

CREATE INDEX ON content_chunks (customer_id);
CREATE INDEX ON content_chunks USING GIN (metadata);
```

### 19.2 AI Gateway Integration

Question generation and RAG retrieval go through Clazro's AI Gateway:

**Capability Class**: `EMBEDDINGS / RETRIEVAL`

**Routing**:
- Provider: OpenAI (for embeddings)
- Model: text-embedding-3-small (cost-optimized)
- Fallback: text-embedding-3-large (quality upgrade)

**Query Flow**:
```
Student Question → AI Gateway → RAG Service → Vector Search
→ Context Assembly → LLM (Groq) → Response
```

### 19.3 Platform Studio Configuration

**Add RAG Controls**:
```json
{
  "rag_config": {
    "enabled": true,
    "subjects": ["Physics", "Chemistry", "Maths"],
    "retrieval_settings": {
      "top_k": 5,
      "similarity_threshold": 0.7,
      "filter_by_difficulty": true
    },
    "llm_settings": {
      "provider": "groq",
      "model": "llama-3.1-70b-versatile",
      "temperature": 0.3,
      "max_tokens": 1000
    }
  }
}
```

### 19.4 Tenant-Specific Customization

Each tenant can configure:
- Enabled subjects/chapters
- Difficulty level filtering
- Question mix ratios
- Adaptive testing parameters
- Cost limits per student

### 19.5 RBAC & Audience Profiles

**Audience-Aware RAG**:
```
Kid Profile:
- Filtered content (age-appropriate only)
- Simplified explanations
- Shorter responses

Teen Profile:
- Full curriculum access
- Moderate explanation depth
- Exam-focused content

Coaching Profile:
- Advanced content access
- Detailed derivations
- Multiple solution approaches
```

### 19.6 Observability Integration

Track via Clazro's existing analytics:
- RAG query success rate
- Average response time
- Content coverage gaps
- Student satisfaction scores
- Cost per query (token usage)

---

# 21. Quick Start Checklist

### Development Setup
```
□ Install Python 3.9+ and dependencies
□ Set up Qdrant (Docker): docker run -p 6333:6333 qdrant/qdrant
□ Configure n8n (self-hosted or cloud)
□ Get OpenAI API key for embeddings
□ Get Groq API key for LLM (free tier)
□ Download NCERT PDFs from ncert.nic.in
```

### Processing First Book
```
□ Place PDF in NCERT/[SUBJECT]/[FILENAME].pdf
□ Update config.json with metadata
□ Run: python scripts/run_pipeline.py
□ Verify outputs in output/ folder
□ Check report.json for metrics
□ Test with sample queries
```

### Production Deployment
```
□ Set up VPS (8GB RAM, 50GB storage)
□ Deploy Qdrant vector database
□ Configure n8n workflows (ingestion + query)
□ Generate embeddings for all books
□ Set up monitoring (response time, accuracy)
□ Connect to Clazro AI Gateway
□ Configure tenant-specific settings
□ Test with real student queries
```

### Cost Optimization Checklist
```
□ Use OpenAI text-embedding-3-large (one-time $13)
□ Use Groq free tier for LLM (14.4K/day)
□ Self-host Qdrant (free, unlimited)
□ Batch process books (avoid timeouts)
□ Cache common queries (reduce API calls)
□ Monitor and optimize retrieval (reduce context size)
```

---

# 22. Troubleshooting

### Common Issues

**Issue: Low retrieval quality**
- Solution: Improve metadata tagging, use better embeddings model
- Check: Is chunking preserving semantic units?

**Issue: Slow query responses**
- Solution: Optimize vector search (add metadata filters first)
- Check: Is vector DB indexed properly?

**Issue: High API costs**
- Solution: Switch to Groq free tier, implement caching
- Check: Are you using batch processing for embeddings?

**Issue: Empty chunks or broken questions**
- Solution: Improve PDF parsing, check for scanned pages
- Check: Does PDF need OCR preprocessing?

**Issue: n8n workflow timeout**
- Solution: Process books in smaller batches (10-20 at a time)
- Check: Are you clearing memory between books?

---

# 23. Support & Resources

### Documentation
- Clazro AI Architecture: `Doc/AI/Ai & Automation Architecture Overview.txt`
- Multi-Model Provider Guide: `Doc/AI/Multi‑Model Provider Strategy Guide`
- DB Schema Reference: `Doc/DB_SCHEMA_REFERENCE.md`

### External Resources
- NCERT Textbooks: https://ncert.nic.in/textbook.php
- Qdrant Documentation: https://qdrant.tech/documentation/
- n8n Documentation: https://docs.n8n.io/
- Groq API: https://console.groq.com/
- OpenAI Embeddings: https://platform.openai.com/docs/guides/embeddings

### Community
- Clazro Development Team: Internal Slack/Teams
- n8n Community: https://community.n8n.io/
- Vector DB Forums: Qdrant Discord, Chroma GitHub Discussions

---

# 24. Summary

This specification provides a **complete, production-ready pipeline** for:

**Core Functionality**:
- Converting NCERT PDFs to structured question banks
- Generating difficulty-tagged questions
- Creating RAG-ready theory chunks with rich metadata
- Supporting adaptive testing through question mix configuration

**Cost-Optimized Architecture**:
- One-time: $78-133 (embeddings + VPS setup)
- Monthly: $15-30 (VPS only, Groq free tier for LLM)
- Unlimited queries within Groq free tier limits

**Key Design Principles**:
- Deterministic and reproducible
- Config-driven (no code changes for customization)
- White-label ready (tenant-specific configuration)
- Legally compliant (NCERT base + purchased references)
- Scalable (phased rollout from 5 to 100+ books)

**Integration**:
- Seamlessly integrates with Clazro AI Gateway
- Follows existing architecture patterns
- Supports audience profiles (Kid/Teen/Coaching)
- Compatible with multi-tenant delivery

**Success Metrics**:
- Questions extracted: ~40-50 per chapter
- Retrieval accuracy: >85% relevance
- Response time: 2-5 seconds
- Cost per query: ~₹0.02-0.04 (within free tier: ₹0)

**Next Steps**: Start with Phase 1 (5-6 NCERT books), validate quality, then scale based on student feedback.

---

End of QUESTION_BANK_GENERATION_SPEC.md

**Version**: 2.0 (Updated with RAG optimization, cost analysis, and Clazro integration)
**Last Updated**: December 2024

