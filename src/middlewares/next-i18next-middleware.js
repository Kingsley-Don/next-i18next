import i18nextMiddleware from 'i18next-express-middleware'
import { forceTrailingSlash, lngPathDetector } from 'utils'
import { parse } from 'url'

export default function (nexti18next, app, server, routeMap) {

  const { config, i18n } = nexti18next
  const { allLanguages, localeSubpaths } = config

  server.use(i18nextMiddleware.handle(i18n))

  if (localeSubpaths) {
    server.get('*', forceTrailingSlash)
    server.get(/^\/(?!_next|static).*$/, lngPathDetector)
    if (Array.isArray(routeMap)) {
      routeMap.forEach(([path, callback]) => {
        if (typeof callback !== 'function') {
          return
        }
        server.get(`(/:lng(${allLanguages.join('|')}))?${path}`, (req, res) => {
          const [actualPath, pathQuery] = callback(req, res)
          const { params: { lng }, query } = req
          app.render(req, res, actualPath.replace(`/${lng}`, ''), { lng, ...pathQuery, ...query })
        })
      })
    }
    server.get(`/:lng(${allLanguages.join('|')})/*`, (req, res) => {
      const { lng } = req.params
      const { query } = req
      const url = parse(req.url).pathname
      app.render(req, res, url.replace(`/${lng}`, ''), { lng, ...query })
    })
  }
}
