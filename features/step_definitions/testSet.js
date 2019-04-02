export default {
  'test': 'potato',
  'recurseTest': '{{ test }}',
  'recurseTest2': '{{ recurseTest }} {{ recurseTest }}',
  'list': [ 'a1', 'a2' ],
  'recurseList': [ '{{ resultA1 }}', '{{ resultA2 }}', 'answer3' ],
  'resultA1': 'answer1',
  'resultA2': 'answer2'
}
