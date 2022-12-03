const {Router} = require('express');
const fs = require('fs');
const path = require('path');
const { getHeapCodeStatistics } = require('v8');
const router = Router();

// File Api
const FILE = path.join(__dirname,'./radata/posts.json');

if(!fs.existsSync(FILE)){
  fs.mkdirSync(path.join(__dirname, "./radata/"), {recursive: true});
  fs.writeFileSync(FILE, "[]");
}

// Routes 
router.get('/', (req, res) => {
    res.json({"welcome": "Bienvenido a la Api de Mi Blog", "version": 1.0});
  });

router.get('/post', (req, res) => {
    res.json(getPosts());
});

//  get post from slug
router.get('/post/:slug', (req, res) => {
  const {slug} = req.params;
  const posts = getPosts();

  posts.forEach((post) => {
    if(post.slug == slug){
      res.json(post);
}});
 res.status(400).json({"error": "not post from id"});
});

  // route new post form mi blogs
  router.post('/post', (req, res) => {
    const {title, banner, description, content, category, tags} = req.body;
    const posts = getPosts();

    if(title && banner && description && content){
      let id = geneateId(posts.length + 1);
      let slug = title.toLowerCase().replaceAll(" ", "-");
      const createdAt = new Date();

      posts.forEach((post) =>{
        if(post.slug === slug){
          res.status(400).json({"error": `post already exists ${post.name}`});
          return;
        }
      });

      const newPost = {
        "id": id,
        "slug": slug,
        "title": title,
        "banner": banner,
        "content": content,
        "description": description,
        "created_at": createdAt,
        "update_at": createdAt,
        "category": category || "mainly",
        "tags": tags || "default"
      };
      posts.push(newPost);
      updatePosts(posts);
      res.json({"sucess": "new post successfully", "body": newPost});
    }
    else{
      res.status(400).json({"error": "Please fill all the fields"});
    }
  });

  router.put('/post/:id', (req, res) => {
    const {id} = req.params;
    const {title, banner, description, content, category, tags} = req.body;
    const posts = getPosts();
    posts.forEach((post, index) => {
      if(post.id == id){
        if(title || banner || description || content || category || tags){
          let slug = title ? title.toLowerCase().replaceAll(" ", "-") : post.slug;
          const updateAt = new Date();

          const newPost = {
            "id": post.id,
            "slug": slug,
            "title": title || post.title,
            "banner": banner || post.banner,
            "content": content || post.content,
            "description": description || post.description,
            "created_at": post.createdAt,
            "update_at": updateAt,
            "category": category || post.category,
            "tags": tags || post.tags,
          };
          posts[index] = newPost;
          updatePosts(posts);
          res.json({"sucess": "new post successfully", "body": newPost});
        }}});
        res.status(400).json({"error": "Not exist post from id"});
  });

  router.delete('/post/:id', (req, res) => {
    const {id} = req.params;
    const posts = getPosts();
    posts.forEach((post, index) => {
      if(post.id == id){
        posts.splice(index, 1);
        updatePosts(posts);
        res.json({"delete": posts});
  }});
   res.status(400).json({"error": "not post deleted from id"});
  });

  function geneateId(id){
    return id.toString(36).substring(3,7) + (Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
  }

  function getPosts(){
    return JSON.parse(fs.readFileSync(FILE, "utf-8"));
  }
  function updatePosts(posts){
    fs.writeFileSync(FILE,JSON.stringify(posts));
  }
  module.exports = router;