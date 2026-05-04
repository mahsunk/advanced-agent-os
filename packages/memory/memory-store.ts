export type MemoryRecord = {
  id: string;
  category: string;
  content: string;
  createdAt: number;
};

export class MemoryStore {
  private records: MemoryRecord[] = [];

  add(record: MemoryRecord) {
    this.records.push(record);
  }

  search(category: string) {
    return this.records.filter(r => r.category === category);
  }

  all() {
    return this.records;
  }
}
