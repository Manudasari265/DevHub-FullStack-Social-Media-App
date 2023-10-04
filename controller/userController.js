const User = require('../models/User')
const Post = require('../models/Post')
const Follow = require('../models/Follow')

exports.sharedProfileData = async function(req, res, next) {
    let isVisitorsProfile = false
    let isFollowing = false
    if(req.session.user){
        isVisitorsProfile = req.profileUser._id.equals(req.session.user._id)
        isFollowing = await Follow.isVisitorFollowing(req.profileUser._id, req.visitorId)
    }

    req.isVisitorsProfile = isVisitorsProfile
    req.isFollowing = isFollowing

    //retrieve post, follower and following counts
    let postCount = await Post.countPostsByAuthor(req.profileUser._id)
    let followerCount = await Follow.countFollowersById(req.profileUser._id)
    let followingCount = await Follow.countFollowingById(req.profileUser._id)

    req.postCount = postCount
    req.followerCount = followerCount
    req.followingCount = followingCount
    next()
}

exports.register = (req, res)=>{
    let user = new User(req.body)
    user.register().then(()=>{
        req.session.user = {avatar: user.avatar, username: user.data.username, _id: user.data._id}
        req.session.save(()=>res.redirect('/'))
    }).catch(err =>{
        err.forEach(error => {
            req.flash('regErrors', error)
        })
        req.session.save(()=>res.redirect('/'))
    })
}

// two types of auth- session, token

exports.login = (req, res)=>{
    let user = new User(req.body)
    // user.avatar
    user.login().then((result)=>{
        req.session.user = {avatar: user.avatar ,username: user.data.username, _id: user.data._id}
        req.session.save(()=>res.redirect('/'))
    }).catch(err=>{
        // same as req.session.flash.errors = [err]
        req.flash('errors', err)
        req.session.save(()=>res.redirect('/'))
    })
}

exports.logout = (req, res)=>{
    req.session.destroy(()=>res.redirect('/'))
}

exports.home = async (req, res)=>{
    if(req.session.user){
        let posts = await Post.getFeed(req.session.user._id)
        // console.log(posts)
        res.render('home-dashboard', {posts: posts})
    }else{
        res.render('home-guest', {regErrors: req.flash('regErrors')})
    }
}

exports.ifUserExists = (req, res, next) => {
    User.findByUsername(req.params.username).then(userDoc =>{
        req.profileUser = userDoc
        next()
    }).catch(()=>{
        res.render('404')
    })
}

exports.profilePostsScreen = (req, res, next) => {
    Post.findByAuthorId(req.profileUser._id).then(posts =>{
        res.render('profile',{
            currentPage: "posts",
            posts: posts,
            profileUsername: req.profileUser.username,
            profileProfile: req.profileUser.profile,
            profileAvatar: req.profileUser.avatar,
            isVisitorsProfile: req.isVisitorsProfile,
            isFollowing: req.isFollowing,
            counts: {postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount}
        })
    }).catch(()=>{
        res.render('404')
    })
}

exports.profileFollowersScreen = async(req, res, next) => {
    try{
        let followers = await Follow.getFollowersById(req.profileUser._id)

        res.render('profile-followers',{
            currentPage: "followers",
            followers: followers,
            profileUsername: req.profileUser.username,
            profileProfile: req.profileUser.profile,
            profileAvatar: req.profileUser.avatar,
            isVisitorsProfile: req.isVisitorsProfile,
            isFollowing: req.isFollowing,
            counts: {postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount}
        })
    }catch{
        res.render('404')
    }
}

exports.profileFollowingScreen = async (req, res)=>{
    try{
      let following = await Follow.getFollowingById(req.profileUser._id)
      res.render('profile-following', {
          currentPage: "following",
          following: following,
          profileUsername: req.profileUser.username,
          profileAvatar: req.profileUser.avatar,
          profileProfile: req.profileUser.profile,
          isFollowing: req.isFollowing,
          isVisitorsProfile: req.isVisitorsProfile,
          counts: {postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount}
      })
    }catch {
          res.render('404')
    }
}