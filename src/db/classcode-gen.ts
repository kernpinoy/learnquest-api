const charset =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export default function generateClassCode(length: number) {
  let result = "";
  const randomArr = new Uint8Array(length);

  crypto.getRandomValues(randomArr);

  for (let i = 0; i < length; i++) {
    result += charset[randomArr[i] % charset.length];
  }

  return result;
}
