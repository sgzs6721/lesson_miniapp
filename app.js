// app.js
const auth = require('./utils/auth.js');

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

    // 检查登录状态
    this.checkLoginStatus();
  },

  // 检查登录状态
  checkLoginStatus() {
    if (auth.isLoggedIn()) {
      // 已登录，跳转到首页
      wx.reLaunch({
        url: '/pages/index/index'
      });
    } else {
      // 未登录，跳转到登录页
      wx.reLaunch({
        url: '/pages/login/login'
      });
    }
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
