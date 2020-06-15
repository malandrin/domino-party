from google.appengine.ext import ndb
from google.appengine.ext.ndb import stats
from uuid import uuid4
import random


class IdxGenerator(ndb.Model):
  nextIdx = ndb.IntegerProperty(default=0)


class SceneModel(ndb.Model):
  uuid = ndb.StringProperty()
  idx = ndb.IntegerProperty()
  author = ndb.StringProperty()
  title = ndb.StringProperty()
  content = ndb.TextProperty()
  created = ndb.DateTimeProperty(auto_now_add=True)


def read_scene(uuid):
  if uuid is None:
    return None

  results = SceneModel.query(SceneModel.uuid == uuid).fetch(1)

  if results:
    r = results[0]

    return {
      'title': r.title,
      'author': r.author,
      'content': r.content
    }

  return None


def list_scenes(count):
  num_scenes = IdxGenerator.query().fetch(1)[0].nextIdx
  idxs = random.sample(range(num_scenes), min(num_scenes, count))
  results = SceneModel.query(SceneModel.idx.IN(idxs)).fetch(count)
  scenes = []

  for r in results:
    scenes.append({
      'title': r.title,
      'author': r.author,
      'content': r.content
    })

  for i in range(num_scenes, count):
    r = scenes[i % num_scenes]
    scenes.append({
      'title': r['title'],
      'author': r['author'],
      'content': r['content']
    })

  return scenes


def create_scene(author, title, content):
  if content is None:
    return None

  generator = IdxGenerator.query().fetch(1)

  if generator:
    generator = generator[0]
  else:
    generator = IdxGenerator()

  nextIdx = generator.nextIdx
  generator.nextIdx += 1
  generator.put()

  scene = SceneModel()

  scene.uuid = str(uuid4())
  scene.idx = nextIdx
  scene.author = author
  scene.title = title
  scene.content = content

  scene.put()

  return scene.uuid

