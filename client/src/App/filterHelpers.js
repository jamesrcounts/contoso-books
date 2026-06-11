export function toggleListItem(currentValue, newItem) {
  if (currentValue === "") {
    return newItem;
  }
  const list = Array.isArray(currentValue) ? currentValue : currentValue.split(",");
  if (list.includes(newItem)) {
    const updated = list.filter((item) => item !== newItem);
    return updated.length === 0 ? "" : updated.join();
  }
  return currentValue + "," + newItem;
}

export function toggleRating(currentRating, newRating) {
  return currentRating === newRating ? "0" : newRating;
}
