exports.isAuthenticated = (req, res, next) =>{
    if(req.session.user){
        next()
    }else{
        req.flash('errors', "You must be logged in first!!")
        req.session.save(()=> res.redirect('/'))
    }
}