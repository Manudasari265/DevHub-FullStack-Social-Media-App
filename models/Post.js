const ObjectID = require("mongodb").ObjectID

const postsCollection = require('../db').db().collection("posts");
const followsCollection = require('../db').db().collection("follows");
const User = require('./User')

let Post = function(data, userId, requestedPostId){
    this.data = data
    this.errors = []
    this.userId = userId
    this.requestedPostId = requestedPostId
}

Post.prototype.cleanUp = function(){
    if(typeof(this.data.title) != "string"){this.data.title = ""}
    if(typeof(this.data.body) != "string"){this.data.body = ""}

    this.data = {
        title: this.data.title.trim(),
        body: this.data.body.trim(),
        createdDate: new Date(),
        author: ObjectID(this.userId)
    }
}

Post.prototype.validate = function(){
    if(this.data.title == ""){this.errors.push("you must provide a title")}
    if(this.data.body == ""){this.errors.push("you must provide a body")}
}

Post.prototype.createPost = function(){
    return new Promise((resolve, reject)=>{
        this.cleanUp()
        this.validate()

        if(!this.errors.length){
            postsCollection.insertOne(this.data).then(info=>{
                resolve(info.insertedId)
            }).catch(()=>{
                this.errors.push("please try again later..")
                reject(this.errors)
            })
        }else{
            reject(this.errors)
        }
    })
}

Post.reusablePostQuery = function(uniqueOperations, visitorId, finalOperations=[]){
    return new Promise(async (resolve, reject)=>{
        let aggOperations = uniqueOperations.concat([
            {$lookup: {from: "users", localField:"author", foreignField:"_id", as: "authorDocument"}},
            {$project:{
                title: 1,
                body: 1,
                createdDate: 1,
                authorId: "$author",
                author: {$arrayElemAt: ["$authorDocument", 0]}
            }}
        ]).concat(finalOperations)

        let posts = await postsCollection.aggregate(aggOperations).toArray()

        posts = posts.map(function(post){
            post.isVisitorOwner = post.authorId.equals(visitorId)
            post.authorId = undefined
            post.author = {
                username: post.author.username,
                avatar: new User(post.author, true).avatar
            }
            return post
        })

        resolve(posts)

    })
}

Post.findSingleById = function(id, visitorId){
    return new Promise(async (resolve, reject)=>{
        if(typeof(id) !== 'string' || !ObjectID.isValid(id)){
            reject();
            return
        }

        let posts = await Post.reusablePostQuery([
            {$match: {_id: new ObjectID(id)}}
        ], visitorId)

        // let post = await postsCollection.findOne({_id: new ObjectID(id)})
        if(posts.length){
            console.log(posts[0])
            resolve(posts[0])
        }else{
            reject()
        }
    })
}

Post.findByAuthorId = function(authorId){
    return new Promise(async (resolve, reject)=>{
        let posts = await postsCollection.find({author: new ObjectID(authorId)}).toArray();
        console.log(posts)
        resolve(posts)
    })
}

Post.prototype.actuallyUpdate = function(){
    return new Promise(async (resolve, reject)=>{
        this.cleanUp()
        this.validate()
        if(!this.errors.length){
            await postsCollection.findOneAndUpdate({_id: new ObjectID(this.requestedPostId)}, {$set: {title: this.data.title, body: this.data.body}})
            resolve("success")
        }else{
            reject("failure")
        }
    })
}

Post.prototype.update = function(){
    return new Promise(async (resolve, reject)=>{
        try{
            let post = await Post.findSingleById(this.requestedPostId, this.userId)
            if(post.isVisitorOwner){
                let status = await this.actuallyUpdate()
                resolve(status)
            }else{
                reject("not a owner")
            }
        }catch{
            reject("db error")
        }
    })
}

// delete task implementation
Post.delete = function(postIdToDelete, currentUserId){
    return new Promise(async (resolve, reject) => {
      try{
        let post = await Post.findSingleById(postIdToDelete, currentUserId)
        if(post.isVisitorOwner){
          await postsCollection.deleteOne({_id: new ObjectID(postIdToDelete)})
          resolve()
        }else{
          reject()
        }
      }catch{
        reject()
      }
    })
}

Post.search = function(searchTerm){
    return new Promise(async (resolve, reject)=>{
        if(typeof(searchTerm) == 'string'){
            let posts = await Post.reusablePostQuery([
                {$match: {$text: {$search: searchTerm}}},
            ], undefined, [{$sort: {score: {$meta: "textScore"}}}])
            resolve(posts)
        }else{
            reject("not a string!!")
        }
    })
}

Post.countPostsByAuthor = function(id){
    return new Promise(async (resolve, reject) => {
      let postCount = await postsCollection.countDocuments({author: id})
      resolve(postCount)
    })
  }

Post.getFeed = async function(id){
    // create an array of user id that the current user is following
    let followedUsers = await followsCollection.find({authorId: new ObjectID(id)}).toArray()
    followedUsers = followedUsers.map(followDoc=>{
        return followDoc.followedId
    }) 

    // look for the posts where the author is from the above array
    return Post.reusablePostQuery([
        {$match :{author: {$in: followedUsers}}},
        {$sort :{createdDate: -1}}
    ])
}

module.exports = Post