const fs = require('fs')

fs.readFile('./3.12.2020.csv', (err, data) => {
  if (err) {
    console.error(err)
    return
  }
  // TODO why array 5241 !== total schools 5342
  const array = data
    .toString()
    .split('\n')
    .map((e) => e.trim())
  const header = array.splice(0, 1)

  console.log('items', array.length)

  const MAX_ITEMS = 1000
  const files = Math.ceil(array.length / MAX_ITEMS)

  Array(files).fill(null).map((_, i) => {
    const start = i * MAX_ITEMS
    const end = start + MAX_ITEMS
    const file = [header, ...array.slice(start, end)].join('\r\n')

    fs.writeFile(`${start}-${end}.csv`, file, function (err) {
      if (err) return console.log(err)
      console.log('Done for', i)
    })
  })
})
