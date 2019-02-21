# passport-qgame

vivo 小游戏帐号接入
授权拿到code后，获取 access_token 并返回用户信息

```json
{
  "provider": "qgame",
  "expires_in": 86400,
  "refresh_token": "...",
  "access_token": "...",
  "nickname": "...",
  "openid": "...",
  "avatar": "..."
}
```

```js
// express 使用示例

const passport = require('passport');
const QgameStrategy = require('passport-qgame');

passport.use(new QgameStrategy({
  key, screct, passReqToCallback: true
}, function(req, profile, done){
  // 处理 profile, 查找或创建用户
  const user = User.findOrCreate();

  // 完成
  done(null, user);
}));

// router
app.get("/auth/qgame", passport.authenticate('qgame', {
  session: false,
  successReturnToOrRedirect: null,
}), function() {});

```


## License

[MIT](LICENSE)
