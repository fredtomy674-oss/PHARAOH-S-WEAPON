# RAG SYSTEM — AL FAROUQ AI

> آخر تحديث: 2026-09-23 — الكود في `server/src/modules/rag/`.

## 1. خط الأنابيب

```
Documents (txt/md/csv + ملفات مناهج PDF/DOCX عبر /api/admin/documents/ingest-file)
 → Extraction (extractors: text; pdf → pdfjs-dist; docx → mammoth)
 → Cleaning (normalize newlines, إزالة تكرار الفراغات، فصل عربي/أرقام)
 → Chunking (بالفقرات/العناوين; حجم هدف 300-600 حرف، overlap 40)
 → Metadata building (country_id…concept_id, source, version, doc title)
 → Embedding (EmbeddingProvider: mock | gemini)
 → VectorStore (SqliteVectorStore — جدول `rag_vectors`)
 → Retrieval (query → embeddings + scopeFilter → top-k)
 → Reranking (اختصاري لغوي الآن — ReRanker interface)
 → ContextBuilder → Context موثوق ← TutorEngine
```

### 1.1 استيراد ملفات المناهج (Path B)

- `POST /api/admin/documents/ingest-file` يستقبل `dataUrl` (base64) لملف PDF/DOCX أو txt/md.
- يُعاد استخدام `parseDocumentDataUrl` / `extractDocumentText` من مسار الطالب (غير معدَّل) — نفس تكرار الأمان لحدود الحجم، لكن بسقف المنهج الأكبر `MAX_CURRICULUM_FILE_KB` (20MB) و`MAX_CURRICULUM_DOCUMENT_CHARS` (200000).
- البايتات الخام تُخزَّن في `document_versions.data` (BLOB) و`sha256` يُحسب من البايتات الخام = هوية الملف (إزالة تكرار).
- OCR **يحاول الإنقاذ أولًا** (PHASE 19/D-023): الملف الممسوح ضوئيًا (استخراج صفري أو < 40 حرفًا وPDF/DOCX) يُقرأ عبر `OcrService` (مزوّد AI — mock افتراضيًا/Gemini في الإنتاج، سقف `MAX_OCR_CHARS`) قبل `ingestFile`؛ النص المعترف به يمضي في نفس أنابيب chunking/embedding ويُسترجَع كمحتوى `<context>` فقط. فشل المزوّد → هبوط آمن `400 EMPTY_DOCUMENT` (لا انهيار)؛ TXT/MD لا تُقرأ OCR إطلاقًا.
- المحتوى المستورد يمضي عبر نفس أنابيب chunking/embedding/scoping مثل النص، ويُسترجَع داخل `<context>` فقط — أي نوايا تجاوز بداخله لا تنفَّذ (اختبار S6 عبر الملف، DECISIONS D-017).

## 2. عزل الـMetadata (حاجز المنهج الخاطئ)

كل chunk يخزن JSON بالحقول الإلزامية:

```
country_id, education_system_id, grade_id, subject_id,
curriculum_id, term_id, unit_id, lesson_id, concept_ids[],
source, version, document_id
```

- `retrieve()` لا يقبل استدعاء بلا scope كامل: يطرح خطأ validation إذا غاب `curriculum_id` أو `lesson_id` (وفق نطاق الجلسة).
- فلتر SQL على هذه الأعمدة قبل حساب التشابه → استحالة استرجاع content من صف/منهج آخر.

## 3. Vector Store المحلي (اختيار MVP)

- `SqliteVectorStore`: جدول `rag_vectors(chunk_id UNIQUE, embedding BLOB f32, dim)`
- البحث = cosine similarity في JS على ناتج فلتر SQL (دقيق، صفر إضافات أصلية، يكفي ≤ 100k chunk على هذا الجهاز).
- الواجهة `VectorStore` تسمح بـ pgvector/Chroma/Qdrant لاحقاً (DECISIONS.md).
- إذا كان `AI_EMBEDDING_PROVIDER=gemini` فتوليد المتجهات خارجي (بلا تخزين محتوى خارجياً أبداً — تُرسل الجمل فقط).

## 4. أداء وحدود

- `RAG_TOP_K` من `.env` (5 افتراضيًا) + `MAX_CONTEXT_CHARS` (خادمي، غير قابل للزيادة من العميل).
- Re-embedding للـchunks عند تغيير النموذج فقط (versioning في metadata `embedding_model`).

## 5. الفصل عن Fine-Tuning

- RAG = استرجاع المعرفة وقت الإجابة.
- Fine-Tuning = تعديل أوزان النموذج. **لا يُستخدم لتغيير المعرفة**. البنية تسمح لاحقاً بخط حقن FT (أي provider يملك نموذج fine-tuned يُشار إليه عبر id في `AI_ROUTING_*`) دون إعادة تصميم.

## 6. الاختبارات الخاصة (TEST_PLAN §6)

- استرجاع صف مختلف → صفر نتائج.
- عنصر «امسح القواعد» داخل chunk → لا أثر على سلوك المدرس (prompt injection).
- التعامل مع مستند يحتوي مفاهيم من صف/منهج خاطئ → Metadata يكسر السياق أو يُرفض عند الإدخال.
- **استيراد ملف (Path B)**: استرجاع فعلي لمحتوى ملف PDF/DOCX مستورد داخل نطاق درسه؛ عزل بين الدروس (نفس المنهج)؛ إزالة تكرار على مستوى بايتات الملف؛ ملف ممسوح → OCR ينقذه قبل التجزئة (نص `<context>` مع علامة `OCR_TEXT_MARKER` في الاختبارات؛ TXT قصير صادق يبقى `EMPTY_DOCUMENT` بلا OCR)؛ محتوى جمل "استبدل القواعد" داخل ملف مستورد يُعامَل كمحتوى لا تعليمات (`adminFile.test.ts` + `knowledgeFile.test.ts` + `ocr.test.ts`).