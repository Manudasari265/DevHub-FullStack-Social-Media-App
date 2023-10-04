const express = require('express');
const router = express.Router();

const userController = require('./controller/userController');
const postController = require('./controller/postController');
const followController = require('./controller/followController');

const isAuth = require('./middleware/is-auth');

router.get('/', userController.home)

// user related routes
router.post('/register', userController.register)
router.post('/login', userController.login)
router.post('/logout', userController.logout)

//profile related routes
router.get('/profile/:username', userController.ifUserExists, userController.sharedProfileData, userController.profilePostsScreen)
router.get('/profile/:username/followers', userController.ifUserExists, userController.sharedProfileData, userController.profileFollowersScreen)
router.get('/profile/:username/following', userController.ifUserExists, userController.sharedProfileData, userController.profileFollowingScreen)

// post related routes
router.get('/create-post', isAuth.isAuthenticated, postController.viewCreatePage)
router.post('/create-post', isAuth.isAuthenticated, postController.createPost)
router.get('/post/:id', postController.viewSingle)
router.get('/post/:id/edit', isAuth.isAuthenticated, postController.viewEditScreen)
router.post('/post/:id/edit', isAuth.isAuthenticated, postController.edit)
// task- delete feature
router.post('/post/:id/delete', isAuth.isAuthenticated, postController.delete)
router.post('/search', postController.search)

//follow related routes
router.post('/addFollow/:username', isAuth.isAuthenticated, followController.addFollow)
router.post('/removeFollow/:username', isAuth.isAuthenticated, followController.removeFollow)

module.exports = router;