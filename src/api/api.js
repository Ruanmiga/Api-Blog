const {Router} = require('express');
const fs = require('fs');
const path = require('path');
const router = Router();
const suid = require('short-unique-id');

// File Api
const FILE = path.join(__dirname,'./radata/posts.json');
const CF = path.join(__dirname,'./radata/comments.json');

if(!fs.existsSync(FILE)){
  fs.mkdirSync(path.join(__dirname, "./radata/"), {recursive: true});
  fs.writeFileSync(FILE, "[]");
}

if(!fs.existsSync(CF)){
  fs.mkdirSync(path.join(__dirname, "./radata/"), {recursive: true});
  fs.writeFileSync(CF, "{}");
}

// Routes 
router.get('/', (req, res) => {
    res.json({"welcome": "Bienvenido a la Api de Mi Blog", "version": 1.0});
  });

  // Ruta de la api comentarios
router.get('/comments', (req, res) => {
  res.json(getComments());
});

router.get('/comments/:id', (req, res) => {
   const {id} = req.params;
   const comments = getComments();
   if(comments[id]){
     res.json(comments[id]);
   }else res.status(400).json({"error": `not comments from post with id ${id}`});
});

router.post('/comments/:id', (req, res) => {
  const {id} = req.params;
  const {name, web, email, message} = req.body;
  const comments = getComments();

  if(name && web && email && message){
    const publish = new Date();
    uid = new suid({length: 10});
    let finded = getMinPosts().some((post) => post.id == id);

    if(finded){
      const newComment = {
        id: uid() + publish.getTime(),
        publish,
        name,
        web,
        email,
        message,
        isHeart: false,
        isResponse: false
      };
  
      if(comments[id]) comments[id].push(newComment);
      else comments[id] = [newComment];
      
      updateComments(comments);
      res.json({"sucess": "new comment add", "comment": newComment});
    }else{
      res.status(400).json({message: `Not post with id ${id}`});
    }
  }else{
      res.status(400).json({"error": "Please fill all the fields"});
  }
});

router.put('/comments/:id/:cid', (req, res) => {
  const {id,cid} = req.params;
  const {name, web, email, message} = req.body;
  const comments = getComments();

  if(comments[id]){
     comments[id].map((comment,index) => {
      if(comment.id == cid) {
        if(name || web || email || message){
          const publish = new Date();

            const newComment = {
              id: comment.id,
              publish: publish || comment.publish,
              name: name || comment.name,
              web: web || comment.web,
              email: email || comment.email,
              message: message || comment.message
            };

            comments[id][index] = newComment;
            updateComments(comments);
            res.json({"sucess": "update comment", "comment": newComment});
      }else{
        res.status(400).json({"error": 'there is no data to update comment.'});
      }
    }else{
        res.status(400).json({"error": `no comments found within ${id} id: ${cid}`});
    }
    });
  }else{
    res.status(400).json({"error": "no comment found with id: " + id});
  }
});

router.delete('/comments/:id/:cid', (req, res) => {
  const {id,cid} = req.params;
  const comments = getComments();

  if(comments[id]){
    if(comments[id].length == 0){
      res.json({"error": "not comments"});
    }else {
     comments[id].map((comment,index) => {
      if(comment.id == cid) {
        comments[id].splice(index, 1);
        updateComments(comments);
        res.json({"delete": comments});
    }else{
        res.status(400).json({"error": `no comment deleted found within ${id} id: ${cid}`});
    }
    });
  }
  }else{
    res.status(400).json({"error": "no comment deleted found with id: " + id});
  }
});

// responder comentarios

router.post('/comments/reply/:id/:cid', (req, res) => {
  const {id,cid} = req.params;
  const {name, web, message, isHeart} = req.body;
  const comments = getComments();

  if(comments[id]){
     comments[id].map((comment,index) => {
      if(comment.id == cid) {
        if(name && web && message){
          const publish = new Date();

            const response = {
              publish: publish,
              name: name,
              web: web,
              message: message,
            };

            comments[id][index]["isResponse"] = true;
            comments[id][index]["response"] = response;
            comments[id][index]["isHeart"] = isHeart || false;

            updateComments(comments);
            res.json({"sucess": "response comment", "response": response});
      }else{
        res.status(400).json({"error": 'there is no data to update comment.'});
      }
    }else{
        res.status(400).json({"error": `no comments found within ${id} id: ${cid}`});
    }
    });
  }else{
    res.status(400).json({"error": "no comment found with id: " + id});
  }
});

function getComments(){
  return JSON.parse(fs.readFileSync(CF, "utf-8"));
}

function updateComments(comments){
  fs.writeFileSync(CF,JSON.stringify(comments));
}
  // Rutas de la api blogs
router.get('/post', (req, res) => {
    res.json(getMinPosts());
});

router.get('/categories', (req, res) => {
   res.json(getCategories());
});

router.get('/tags', (req, res) => {
  res.json(getTags());
});
//  get post from slug
router.get('/post/:slug', (req, res) => {
  const {slug} = req.params;
  const posts = getPosts();

  let finded = posts.some(post => post.slug === slug);

  if(finded){
    posts.forEach((post, index) => {
      if(post.slug == slug){
        let size = posts.length - 1;
        let prev, next;
        if(index > 0 && size >= index){
          prev = posts[index-1];
        }
         if(index < size){
          next = posts[index+1];
        }
        post["prev"] = prev;
        post["next"] = next;
        res.json(post);
  }});
  }else{
    res.status(400).json({"error": "not pos from id"});
  }
});

router.get('/recents', (req, res) => {
  let recentPost = getMinPosts().sort((a, b) => {
    a = new Date(a.updated);
    b = new Date(b.updated);
    return b.getTime() - a.getTime();
  });
 recentPost = recentPost.slice(0, recentPost.length > 8 ? 8 : recentPost.length);
  res.json({content: recentPost, count: recentPost.length});
});

router.get('/search', (req, res) => {
  let {title, category, tag} = req.query;

  const resPost = [];
  getMinPosts().map((post) => {
    const finded = post.tags.some((itag) => itag == tag);

    if((title && post.title) || (category && category == post.category) || finded){
      resPost.push(post);
    }
  });
  
  res.json({filter: {title,category,tag}, results: resPost.length == 0 ? "not results" : resPost, count: resPost.length});
});
  // route new post form mi blogs
  router.post('/post', (req, res) => {
    const {title, banner, description, content, category, tags, isVideo, videoApi, video, private, islug} = req.body;
    const posts = getPosts();

    if(title && banner && description && content){
      let id = geneateId(posts.length + 1);
      let slug = islug ? islug.toLowerCase().replaceAll(" ", "-") :  title.toLowerCase().replaceAll(" ", "-");
      const createdAt = new Date();

      const exists = posts.some((post) => post.slug === slug);

      if(exists){
        res.status(400).json({"error": `post already exists`});
      }else{
        const newPost = {
          "id": id,
          "slug": slug,
          "title": title,
          "banner": banner,
          "isVideo": isVideo || false,
          "videoApi": videoApi,
          "video": video,
          "private": private || false,
          "description": description,
          "content": content,
          "created_at": createdAt,
          "update_at": createdAt,
          "category": category || "mainly",
          "tags": tags || "default"
        };
        posts.push(newPost);
        updatePosts(posts);
  
        res.json({"sucess": "new post successfully", "body": newPost});
      }
    }
    else{
      res.status(400).json({"error": "Please fill all the fields"});
    }
  });

  router.put('/post/:id', (req, res) => {
    const {id} = req.params;
    const {title, banner, description, content, category, tags, isVideo, video, videoApi, private, islug} = req.body;
    const posts = getPosts();
    posts.forEach((post, index) => {
      if(post.id == id){
        if(title || banner || description || content || category || tags || isVideo || video || videoApi || private){
           let slug = islug ? islug.toLowerCase().replaceAll(" ", "-") :  title.toLowerCase().replaceAll(" ", "-");
          const updateAt = new Date();

          const newPost = {
            "id": post.id,
            "slug": slug,
            "title": title || post.title,
            "banner": banner || post.banner,
            "isVideo": isVideo || post.isVideo,
            "videoApi": videoApi || post.videoApi,
            "video": video || post.video,
            "private": private || post.private,
            "description": description || post.description,
            "content": content || post.content,
            "created_at": post.created_at,
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
  if(posts.length > 0){
    posts.forEach((post, index) => {
      if(post.id == id){
        let comments = getComments();
        if(comments[id]){
          delete comments[id];
          updateComments(comments)
        }
        posts.splice(index, 1);
        updatePosts(posts);
        res.json({"delete": posts});
  }else{
   res.status(400).json({"error": "not post deleted from id"});
  }
});

  }else{
   res.status(400).json({"error": "not post deleted from id"});
  }
  });

  function geneateId(id){
    return id.toString(36).substring(3,7) + (Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
  }

  function getPosts(){
    return JSON.parse(fs.readFileSync(FILE, "utf-8"));
  }

  function getMinPosts(){
    const tempPost = [];
    getPosts().map((post) => {
      if(!post.private){
        tempPost.push({
          "id": post.id,
          "slug": post.slug,
          "title": post.title,
          "banner": post.banner,
          "description": post.description,
          "created": post.created_at,
          "updated": post.update_at,
          "category": post.category,
          "tags": post.tags,
        });
      }
     });
     return tempPost;
  }

  function getCategories(){
    const categories = [];
    getMinPosts().map((post) =>{
      if(!categories.includes(post.category)) categories.push(post.category);
    });
    return categories;
  }
  function getTags(){
    const tags = [];
    getMinPosts().map((post) =>{
      post.tags.map((tag) => {
        if(!tags.includes(tag)) tags.push(tag);
      });
    });
    return tags;
  }

  function updatePosts(posts){
    fs.writeFileSync(FILE,JSON.stringify(posts));
  }


  module.exports = router;