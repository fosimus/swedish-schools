const pAll = require('p-all')
const got = require('got')
const parse = require('node-html-parser').default
const xlsx = require('node-xlsx')
const fs = require('fs')
const path = require('path')

const getPageLink = page => `https://utbildningsguiden.skolverket.se/appresource/4.5773086416b1c2d84ca134/12.5406806016b70e49d5e2f79/?page=${page}&namn=&omrade=01&skolform=&arskurser=0%2C1%2C2%2C3%2C4%2C5%2C6%2C7%2C8%2C9%2C10&organisationsform=&svAjaxReqParam=ajax`
const schoolLink = 'https://utbildningsguiden.skolverket.se/skolenhet?schoolUnitID='

;(async () => {
  try {
    const schools = await pAll(getPagePromises())
    const schoolIDs = getSchoolIDs(schools)

    await runSchools(schoolIDs)

    createDocument()

  } catch (e) {
    console.log(e)
  }
})()
