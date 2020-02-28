const pAll = require('p-all')
const got = require('got')
const parse = require('node-html-parser').default
const xlsx = require('node-xlsx')
const fs = require('fs')
const path = require('path')

const getPageLink = page => `https://utbildningsguiden.skolverket.se/appresource/4.5773086416b1c2d84ca134/12.5406806016b70e49d5e2f79/?page=${page}&namn=&omrade=01&skolform=&arskurser=0%2C1%2C2%2C3%2C4%2C5%2C6%2C7%2C8%2C9%2C10&organisationsform=&svAjaxReqParam=ajax`
const schoolLink = 'https://utbildningsguiden.skolverket.se/skolenhet?schoolUnitID='

const totalPages = 1 // 44 // for Stockholm land only
// const totalElements = 861

const parsePage = body => {
  const schools = parse(body).querySelectorAll('.iov-button-addtocomparison')
  const schoolIDs = schools.map(el =>
    el.rawAttrs
      .split(' ')
      .find(el => /data-schoolunitcode/.test(el))
      .split('=')[1]
      .replace(/["']/g, '')
  )
  return schoolIDs
}

const getPagePromises = () => Array(totalPages)
  .fill(null)
  .map((_, index) => () => new Promise(async (resolve, reject) => {
    // TODO return failed pages?
    console.log('Page', index)
    try {
      const { body } = await got(getPageLink(index), { timeout: 120000 })
      const schoolIDs = parsePage(body)

      resolve(schoolIDs)
    } catch (e) {
      console.log(e)
    }
  })
  )

const parseSchoolPage = body => {
  const html = parse(body)
  const bar = html.querySelectorAll('.bar-chart--text').find(el => /(av max 340)/.test(el))
  const score = bar && bar.text ? bar.text.replace(' (av max 340)', '') : 0
  const name =
    (html.querySelectorAll('h1.heading')[0] &&
      html.querySelectorAll('h1.heading')[0].text) ||
    'None'
  const address = html
    .querySelectorAll('[aria-labelledby="iov-info-address"]')
    .map(el => el.text)
    .join()

  return {
    address,
    name,
    score: parseInt(score)
  }
}

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
