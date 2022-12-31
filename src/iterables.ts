export function* range(start: number, length: number) {
  for (let i = 0; i < length; i++) {
    yield start + i;
  }
}
