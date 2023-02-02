/**
 * Go like error catcher for async/await block
 * @param {Promise<Function>} promise Original async function
 * @returns Promise<[err, data]>
 */
export function catchEm(promise) {
  return promise.then(data => [null, data])
    .catch(err => [err]);
}