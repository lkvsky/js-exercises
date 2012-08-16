import os

from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app
from google.appengine.ext.webapp import template
from google.appengine.ext import db


class MainPage(webapp.RequestHandler):
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

        path = os.path.join(os.path.dirname(__file__), 'templates/index.html')
        self.response.out.write(template.render(path, template_values))


class Market(db.Model):
    marketname = db.StringProperty()
    streetaddress = db.StringProperty()
    city = db.StringProperty()
    state = db.StringProperty()
    latitude = db.FloatProperty()
    longitude = db.FloatProperty()
    specialties = db.ReferenceProperty()


class Shopper(db.Model):
    firstname = db.StringProperty()
    lastname = db.StringProperty()
    email = db.EmailProperty()
    visitedmarkets = db.ReferenceProperty()


class VisitedMarket(db.Model):
    rating = db.IntegerProperty()
    shoppinglist = db.ReferenceProperty()


class ShoppingList(db.Model):
    quantity = db.IntegerProperty()
    item = db.StringProperty()
    vendor = db.StringProperty()


application = webapp.WSGIApplication(
                                     [('/', MainPage)],
                                     debug=True)


def main():
    run_wsgi_app(application)

if __name__ == "__main__":
    main()
