import os
import webapp2
import jinja2

from google.appengine.api import users
from google.appengine.ext import db

jinja_environment = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.dirname(__file__)))


class MainPage(webapp2.RequestHandler):
    def get(self):
        if users.get_current_user():
            url = users.create_logout_url(self.request.uri)
            url_linktext = 'Logout'
            nickname = users.get_current_user().nickname()
        else:
            url = users.create_login_url(self.request.uri)
            url_linktext = 'Login'
            nickname = ''

        template_values = {
          'url': url,
          'url_linktext': url_linktext,
          'nickname': nickname
          }

        template = jinja_environment.get_template('templates/index.html')
        self.response.out.write(template.render(template_values))


app = webapp2.WSGIApplication([('/', MainPage)],  debug=True)
