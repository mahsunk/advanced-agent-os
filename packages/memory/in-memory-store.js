export class InMemoryStore {
  constructor() {
    this.records = [];
  }

  add(record) {
    const storedRecord = {
      id: record.id ?? `memory-${Date.now()}-${this.records.length + 1}`,
      type: record.type ?? 'generic',
      content: record.content,
      metadata: record.metadata ?? {},
      createdAt: record.createdAt ?? new Date().toISOString()
    };

    this.records.push(storedRecord);
    return storedRecord;
  }

  list() {
    return [...this.records].reverse();
  }

  search(query) {
    const normalizedQuery = query.toLowerCase();

    return this.records
      .filter(record => JSON.stringify(record).toLowerCase().includes(normalizedQuery))
      .reverse();
  }

  clear() {
    this.records = [];
  }
}
