export class VectorMemory {
  constructor() {
    this.records = [];
  }

  addText(text, metadata = {}) {
    const record = {
      id: `vector-memory-${Date.now()}-${this.records.length + 1}`,
      text,
      metadata,
      embedding: this.embedText(text),
      createdAt: new Date().toISOString()
    };

    this.records.push(record);
    return record;
  }

  search(query, limit = 5) {
    const queryEmbedding = this.embedText(query);

    return this.records
      .map(record => ({
        ...record,
        score: this.cosineSimilarity(queryEmbedding, record.embedding)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  embedText(text) {
    const vector = new Array(64).fill(0);
    const normalized = String(text).toLowerCase();

    for (let index = 0; index < normalized.length; index += 1) {
      const bucket = normalized.charCodeAt(index) % vector.length;
      vector[bucket] += 1;
    }

    return vector;
  }

  cosineSimilarity(left, right) {
    let dot = 0;
    let leftMagnitude = 0;
    let rightMagnitude = 0;

    for (let index = 0; index < left.length; index += 1) {
      dot += left[index] * right[index];
      leftMagnitude += left[index] * left[index];
      rightMagnitude += right[index] * right[index];
    }

    if (!leftMagnitude || !rightMagnitude) {
      return 0;
    }

    return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
  }
}
