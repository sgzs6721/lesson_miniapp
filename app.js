// app.js
App({
  onLaunch() {
    // 设置全局主题色
    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: '#4A6FFF'
    });
    
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })
  },
  globalData: {
    userInfo: null,
    theme: {
      primaryColor: '#4A6FFF',
      primaryLight: '#6B8AFF',
      primaryDark: '#3A5AE5',
      secondaryColor: '#FF6B6B',
      accentColor: '#6BCB77',
      warningColor: '#FFD166',
      dangerColor: '#FF6B6B',
      infoColor: '#4ECDC4'
    }
  }
})
