export default function bytes2Size(byteVal) {
  var units = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  var counter = 0;
  var kb = 1024;
  var div = byteVal / 1;
  while (div >= kb) {
    counter++;
    div = div / kb;
  }
  return div.toFixed(1) + ' ' + units[counter];
}
