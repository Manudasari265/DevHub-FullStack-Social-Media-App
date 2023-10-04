const Follow = require('../models/Follow')

// create separate collection inmongodb followerid and authorid

exports.addFollow = function(req, res){
    let follow = new Follow(req.params.username, req.visitorId)
    follow.create().then(()=>{
        req.flash('success', `Successfully followed ${req.params.username}`)
        req.session.save(()=> res.redirect(`/profile/${req.params.username}`))
    }).catch((errors)=>{
        errors.forEach(err=>{
            req.flash('errors', err)
        })
        req.session.save(()=> res.redirect('/'))
    })
}

exports.removeFollow = function(req, res){
    let follow = new Follow(req.params.username, req.visitorId)
    follow.delete().then(()=>{
        req.flash('success', `Successfully unfollowed ${req.params.username}`)
        req.session.save(()=> res.redirect(`/profile/${req.params.username}`))
    }).catch((errors)=>{
        errors.forEach(err=>{
            req.flash('errors', err)
        })
        req.session.save(()=> res.redirect('/'))
    })
}