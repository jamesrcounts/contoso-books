import { describe, it, expect } from 'vitest';
import { toggleListItem, toggleRating } from './filterHelpers';

describe('toggleRating', () => {
  it('returns the new rating when it differs from current', () => {
    expect(toggleRating("0", "3")).toBe("3");
  });

  it('resets to "0" when the same rating is selected again', () => {
    expect(toggleRating("3", "3")).toBe("0");
  });
});

describe('toggleListItem', () => {
  it('returns the item when the list is empty', () => {
    expect(toggleListItem("", "Hardcover")).toBe("Hardcover");
  });

  it('appends a new item to an existing list', () => {
    expect(toggleListItem("Hardcover", "Paperback")).toBe("Hardcover,Paperback");
  });

  it('removes an existing item from the list', () => {
    expect(toggleListItem("Hardcover,Paperback", "Hardcover")).toBe("Paperback");
  });

  it('returns "" when the last item is removed', () => {
    expect(toggleListItem("Hardcover", "Hardcover")).toBe("");
  });

  it('accepts an array as the current value', () => {
    expect(toggleListItem(["Hardcover", "Paperback"], "Hardcover")).toBe("Paperback");
  });

  it('does not duplicate an item that is already present', () => {
    const result = toggleListItem("Hardcover", "Hardcover");
    expect(result).toBe("");
  });
});
