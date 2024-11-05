function getValueFrom(dictionary, label) {
  const object = dictionary.find((phrase) => phrase.label == label);
  return object?.value;
}
export default async function convertKeys(record, dictionary) {
  let renamedRecords = {};
  for (let key in record) {
    const newKey = getValueFrom(dictionary, key) || key;
    renamedRecords[newKey] = record[key];
  }
  return renamedRecords;
}
