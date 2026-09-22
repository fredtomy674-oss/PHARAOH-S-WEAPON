# RAG SYSTEM — AL FAROUQ AI

> آخر تحديث: 2026-09-22 — الكود في `server/src/modules/rag/`.

## 1. خط الأنابيب

```
Documents (txt/md/csv الآن)
 → Extraction (extracxtors: text; pdf/docx = documented placeholder)
 → Cleaning (normalize newlines, إزالة تكرار الفراغات، فصل عربي/أرقام)
 → Chunking (بالفقرات/العناوين; حجم هدف 300-600 حرف، overlap 40)
 → Metadata building (country_id…concept_id, source, version, doc title)
 → Embedding (EmbeddingProvider: mock | gemini)
 → VectorStore (SqliteVectorStore — جدول `rag_vectors`)
 → Retrieval (query → embeddings + scopeFilter → top-k)
 → Reranking (اختصاري لغوي الآن — ReRanker interface)
 → ContextBuilder → Context موثوق ← TutorEngine
```

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