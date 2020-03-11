import got from 'got'
import pAll from 'p-all'

const getStatisticPromises = links => Object.keys(links)
  .map(linkKey => () => new Promise(async (resolve, reject) => {
    try {
      const schoolData = await got(links[linkKey]).json()

      resolve({ [linkKey]: schoolData })
    } catch (e) {
      reject(e)
    }
  }))

// TODO eslint not used arg?
export const runMetricsBySchool = (school, i) => new Promise(async (resolve, reject) => {
  let statisticLinks
  const statisticHref = school._links.statistics.href

  try {
    const { _links } = await got(statisticHref).json()

    statisticLinks = _links
  } catch (e) {
    reject(e)
  }

  const statisticPromises = getStatisticPromises(statisticLinks)

  try {
    const schoolStatistics = await pAll(statisticPromises)
    const stat = schoolStatistics.reduce((acc, cur) => {
      const result = { ...acc, ...cur }
      return result
    }, {})

    resolve({ ...school, stat })
  } catch (e) {
    reject(e)
  }
})
