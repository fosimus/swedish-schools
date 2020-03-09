const got = require('got')

const forkName = process.argv[2]

process.on('message', async ({id}) => {
  try {
    await got(`https://beeceptor.com/console/tests?${id}`)
    console.log('child id done', forkName);
    process.send({ value: id, status: 'DONE' });
  } catch (e) {
    console.log('child id error', e, forkName);
    process.send({ value: id, status: 'ERROR', msg: e });
  }
});
