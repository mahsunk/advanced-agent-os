export class SimpleQueue {
  constructor() {
    this.items = [];
  }

  add(type, payload = {}) {
    const item = {
      id: `queue-item-${Date.now()}-${this.items.length + 1}`,
      type,
      payload,
      status: 'queued',
      createdAt: new Date().toISOString()
    };

    this.items.push(item);
    return item;
  }

  next() {
    const item = this.items.find(entry => entry.status === 'queued');

    if (!item) {
      return null;
    }

    item.status = 'reserved';
    item.updatedAt = new Date().toISOString();
    return item;
  }

  complete(id, result = {}) {
    const item = this.items.find(entry => entry.id === id);

    if (!item) {
      return null;
    }

    item.status = 'completed';
    item.result = result;
    item.updatedAt = new Date().toISOString();
    return item;
  }

  list() {
    return [...this.items].reverse();
  }
}
