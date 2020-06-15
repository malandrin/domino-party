import webapp2
import json
import urllib

from scene import create_scene
from scene import list_scenes
from scene import read_scene

RECAPTCHA_SECRET_KEY = '!!RECAPTCHA_SECRET_KEY!!'

def _enable_cors(response):
  response.headers['Access-Control-Allow-Origin'] = 'https://malandrin.github.io'
  response.headers['Access-Control-Allow-Headers'] = 'Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers'
  response.headers['Access-Control-Allow-Methods'] = 'GET,OPTIONS,POST'
  response.headers['Access-Control-Allow-Credentials'] = 'true'


class ScenesHandler(webapp2.RequestHandler):
  def options(self):
    _enable_cors(self.response)

  def get(self):
    _enable_cors(self.response)
    count = int(self.request.GET.get('count') or 1)
    id = self.request.GET.multi.get('id')

    if id is not None:
      scene = read_scene(id)
      self.response.out.write(json.dumps({'ok': True, 'scenes': [scene]}))
    else:
      self.response.out.write(json.dumps({'ok': True, 'scenes': list_scenes(count)}))

  def post(self):
    _enable_cors(self.response)
    params = self.request.POST.multi
    token = self.request.GET.multi.get('token')

    recaptcha_params = urllib.urlencode({
      'response': token,
      'secret': RECAPTCHA_SECRET_KEY
    })

    data = json.loads(urllib.urlopen('https://www.google.com/recaptcha/api/siteverify', recaptcha_params.encode('utf-8')).read())

    if data['success'] and data['score'] > 0.5:
      author = params.get('author')
      title = params.get('title')
      content = json.loads(params.get('content'))
      scene_uuid = None

      if len(author) <= 30 and len(title) <= 50 and len(content) <= 1501:
        scene_uuid = create_scene(params.get('author'), params.get('title'), params.get('content'))

      if scene_uuid is not None:
        self.response.out.write(json.dumps({'ok': True, 'uuid': scene_uuid}))
      else:
        self.response.out.write(json.dumps({'ok': False}))
    else:
      self.response.out.write(json.dumps({'ok': False}))


# ----------------------------------------------------
app = webapp2.WSGIApplication([
  webapp2.Route('/api/scenes',  handler=ScenesHandler),
], debug=True)